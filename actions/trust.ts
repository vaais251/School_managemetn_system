"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const SetPerformanceSchema = z.object({
    studentId: z.string().uuid(),
    subjectId: z.string().uuid(),
    examTitle: z.string().min(2, "Exam title is required"),
    marksObtained: z.coerce.number().min(0),
    totalMarks: z.coerce.number().min(1),
});

async function checkTrustAuth() {
    const session = await auth();
    if (!session || (session.user.role !== "TRUST_MANAGER" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Only Trust Managers can set academic performance.");
    }
    return session;
}

/**
 * Allows TRUST_MANAGER to set (upsert) an academic performance record
 * for an MRHSS student against a specific exam + subject.
 */
export async function setStudentAcademicPerformance(prevState: any, formData: FormData) {
    try {
        const session = await checkTrustAuth();

        const validated = SetPerformanceSchema.safeParse({
            studentId: formData.get("studentId"),
            subjectId: formData.get("subjectId"),
            examTitle: formData.get("examTitle"),
            marksObtained: formData.get("marksObtained"),
            totalMarks: formData.get("totalMarks"),
        });

        if (!validated.success) {
            const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, message: firstError || "Invalid form data." };
        }

        const { studentId, subjectId, examTitle, marksObtained, totalMarks } = validated.data;

        if (marksObtained > totalMarks) {
            return { success: false, message: "Marks obtained cannot exceed the total marks." };
        }

        // Verify the student is MRHSS
        const profile = await prisma.studentProfile.findUnique({
            where: { id: studentId },
            include: {
                enrollments: { where: { status: "ACTIVE" }, take: 1 },
                class: true,
            },
        });

        if (!profile) return { success: false, message: "Student not found." };

        const program = profile.enrollments[0]?.type;
        if (program !== "MRHSS") {
            return { success: false, message: "Academic performance can only be set for MRHSS students." };
        }

        if (!profile.classId) {
            return { success: false, message: "This student is not assigned to a class." };
        }

        // Upsert: delete existing mark for this exact exam+subject+student, then create
        await prisma.$transaction(async (tx) => {
            await tx.studentMark.deleteMany({
                where: { studentId, subjectId, examTitle },
            });

            await tx.studentMark.create({
                data: {
                    studentId,
                    subjectId,
                    classId: profile.classId!,
                    examTitle,
                    marksObtained,
                    totalMarks,
                },
            });

            await tx.auditLog.create({
                data: {
                    actorId: session.user.id,
                    actionType: "SET_ACADEMIC_PERFORMANCE",
                    targetId: studentId,
                },
            });
        });

        revalidatePath(`/dashboard/admin/student/${studentId}`);
        return { success: true, message: "Academic performance saved successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to save performance." };
    }
}
