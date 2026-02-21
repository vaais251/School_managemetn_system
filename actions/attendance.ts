"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { AttendanceStatus } from "@prisma/client";

const AttendanceSchema = z.object({
    classId: z.string().uuid(),
    date: z.string(), // ISO date string
    attendance: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
    })),
});

export async function markDailyAttendance(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "TEACHER") {
            throw new Error("Unauthorized");
        }

        const rawJson = formData.get("payload") as string;
        if (!rawJson) return { success: false, message: "Missing payload data." };

        const parsed = JSON.parse(rawJson);
        const validated = AttendanceSchema.safeParse(parsed);

        if (!validated.success) {
            return { success: false, message: "Invalid attendance data." };
        }

        const { classId, date, attendance } = validated.data;
        const targetDate = new Date(date);

        // Ensure the time components are normalized for consistent date querying
        targetDate.setHours(0, 0, 0, 0);

        // Security Check: Verify the logged-in user is the *Class Teacher* for this class
        const assignment = await prisma.teacherAssignment.findFirst({
            where: {
                teacherId: session.user.id,
                classId: classId,
                subjectId: null, // Critical: If subjectId is null, they are the global Class Teacher
            }
        });

        if (!assignment) {
            return { success: false, message: "Unauthorized: You are not the assigned Class Teacher for this class." };
        }

        // Use a transaction to perform bulk upsert safely
        await prisma.$transaction(async (tx) => {
            // Delete existing attendance for this date and these specific students (handling upsert semantics)
            const studentIds = attendance.map(a => a.studentId);

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
