"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { AttendanceStatus } from "@prisma/client";

// --- Schemas ---
const AttendanceSchema = z.object({
    classId: z.string().uuid(),
    date: z.string(), // ISO date string
    attendance: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
    })),
});

const UploadMarksSchema = z.object({
    classId: z.string().uuid(),
    subjectId: z.string().uuid(),
    examTitle: z.string().min(2),
    totalMarks: z.coerce.number().min(1),
    marks: z.array(z.object({
        studentId: z.string().uuid(),
        marksObtained: z.coerce.number().min(0),
    })),
});

// --- Auth Helper ---
async function checkTeacherAuth() {
    const session = await auth();
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Only Teachers can perform this action.");
    }
    return session;
}

// --- Actions ---

/**
 * Gets the dashboard data for the logged-in teacher.
 */
export async function getTeacherDashboard() {
    try {
        const session = await checkTeacherAuth();

        const assignments = await prisma.teacherAssignment.findMany({
            where: { teacherId: session.user.id },
            include: {
                class: {
                    include: {
                        studentProfiles: true, // We need students for both attendance and marks
                    }
                },
                subject: true,
            }
        });

        return { success: true, assignments };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to load dashboard." };
    }
}

/**
 * Marks daily attendance for a specific class on a specific date.
 */
export async function markDailyAttendance(prevState: any, formData: FormData) {
    try {
        const session = await checkTeacherAuth();

        const rawJson = formData.get("payload") as string;
        if (!rawJson) return { success: false, message: "Missing payload data." };

        const parsed = JSON.parse(rawJson);
        const validated = AttendanceSchema.safeParse(parsed);

        if (!validated.success) {
            return { success: false, message: "Invalid attendance data." };
        }

        const { classId, date, attendance } = validated.data;
        const targetDate = new Date(date);

        // Use a transaction to perform bulk upsert safely
        await prisma.$transaction(async (tx) => {
            // Delete existing attendance for this class/date if any, to prevent duplicates
            // We find students in this class first
            const studentsInClass = await tx.studentProfile.findMany({
                where: { classId }
            });
            const studentIds = studentsInClass.map(s => s.id);

            await tx.attendance.deleteMany({
                where: {
                    date: targetDate,
                    studentId: { in: studentIds }
                }
            });

            // Insert new attendance records
            if (attendance.length > 0) {
                await tx.attendance.createMany({
                    data: attendance.map(a => ({
                        studentId: a.studentId,
                        date: targetDate,
                        status: a.status,
                    }))
                });
            }

            // Audit logging
            await tx.auditLog.create({
                data: {
                    actorId: session.user.id,
                    actionType: "MARK_ATTENDANCE",
                    targetId: classId,
                    timestamp: new Date()
                }
            });
        });

        revalidatePath("/dashboard/teacher");
        return { success: true, message: "Attendance marked successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to mark attendance." };
    }
}

/**
 * Uploads marks for a specific class, subject, and exam.
 */
export async function uploadMarks(prevState: any, formData: FormData) {
    try {
        const session = await checkTeacherAuth();

        const rawJson = formData.get("payload") as string;
        if (!rawJson) return { success: false, message: "Missing payload data." };

        const parsed = JSON.parse(rawJson);
        const validated = UploadMarksSchema.safeParse(parsed);

        if (!validated.success) {
            return { success: false, message: "Invalid marks data." };
        }

        const { classId, subjectId, examTitle, totalMarks, marks } = validated.data;

        await prisma.$transaction(async (tx) => {
            // Remove existing marks for this exact exam/class/subject
            await tx.studentMark.deleteMany({
                where: { classId, subjectId, examTitle }
            });

            if (marks.length > 0) {
                await tx.studentMark.createMany({
                    data: marks.map(m => ({
                        studentId: m.studentId,
                        subjectId,
                        classId,
                        examTitle,
                        totalMarks,
                        marksObtained: m.marksObtained,
                    }))
                });
            }

            // Audit logging
            await tx.auditLog.create({
                data: {
                    actorId: session.user.id,
                    actionType: "UPLOAD_MARKS",
                    targetId: `${classId}-${subjectId}`,
                    timestamp: new Date()
                }
            });
        });

        revalidatePath("/dashboard/teacher");
        return { success: true, message: "Marks uploaded successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to upload marks." };
    }
}
