"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const DisbursementSchema = z.object({
    studentId: z.string().uuid(),
    amount: z.coerce.number().min(0.01),
    purpose: z.string().min(2),
    transactionDate: z.coerce.date(),
    description: z.string().optional(),
});

const AcademicTrackingSchema = z.object({
    studentId: z.string().uuid(),
    universityName: z.string().min(2),
    degree: z.string().min(2),
    currentSemester: z.coerce.number().min(1).max(12),
    gpa: z.coerce.number().min(0).max(4.0).optional(),
});

/**
 * Ensures the actor has TRUST_MANAGER or SUPER_ADMIN permissions.
 */
async function checkRflAuth() {
    const session = await auth();
    if (!session || (session.user.role !== "TRUST_MANAGER" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Only RFL Trust Managers can perform this action.");
    }
    return session;
}

/**
 * Adds a new financial disbursement record for an RFL student.
 */
export async function addDisbursement(prevState: any, formData: FormData) {
    try {
        const session = await checkRflAuth();

        const validated = DisbursementSchema.safeParse({
            studentId: formData.get("studentId"),
            amount: formData.get("amount"),
            purpose: formData.get("purpose"),
            transactionDate: formData.get("transactionDate"),
            description: formData.get("description"),
        });

        if (!validated.success) return { success: false, message: "Invalid disbursement data." };
        const data = validated.data;

        await prisma.disbursement.create({
            data: {
                studentId: data.studentId,
                amount: data.amount,
                purpose: data.purpose,
                transactionDate: data.transactionDate,
                description: data.description,
            }
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "ADD_RFL_DISBURSEMENT", targetId: data.studentId }
        });

        revalidatePath("/dashboard/rfl");
        return { success: true, message: "Disbursement recorded successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to record disbursement." };
    }
}

/**
 * Updates or creates the university academic tracking record for an RFL student.
 */
export async function updateAcademicTracking(prevState: any, formData: FormData) {
    try {
        const session = await checkRflAuth();

        const validated = AcademicTrackingSchema.safeParse({
            studentId: formData.get("studentId"),
            universityName: formData.get("universityName"),
            degree: formData.get("degree"),
            currentSemester: formData.get("currentSemester"),
            gpa: formData.get("gpa") || undefined,
        });

        if (!validated.success) return { success: false, message: "Invalid academic tracking data." };
        const data = validated.data;

        await prisma.rFLAcademicRecord.upsert({
            where: { studentId: data.studentId },
            update: {
                universityName: data.universityName,
                degree: data.degree,
                currentSemester: data.currentSemester,
                gpa: data.gpa,
            },
            create: {
                studentId: data.studentId,
                universityName: data.universityName,
                degree: data.degree,
                currentSemester: data.currentSemester,
                gpa: data.gpa,
            },
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "UPDATE_RFL_ACADEMICS", targetId: data.studentId }
        });

        revalidatePath("/dashboard/rfl");
        return { success: true, message: "Academic tracking updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update academic tracking." };
    }
}
