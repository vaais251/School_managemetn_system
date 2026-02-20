"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const EvaluationSchema = z.object({
    evaluateeId: z.string().uuid({ message: "Please select a staff member." }),
    punctuality: z.coerce.number().min(1).max(5),
    qualityOfWork: z.coerce.number().min(1).max(5),
    teamwork: z.coerce.number().min(1).max(5),
    communication: z.coerce.number().min(1).max(5),
    initiative: z.coerce.number().min(1).max(5),
    comments: z.string().optional(),
});

/**
 * Ensures the actor has SUPER_ADMIN or HR capabilities (Assuming SUPER_ADMIN for now
 * as there isn't a dedicated HR role, but can easily be added if expanding Role enum).
 */
async function checkHrAuth() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized: Only Admins can perform staff evaluations.");
    }
    return session;
}

/**
 * Submits a new 5-star performance evaluation for a staff member.
 */
export async function submitEvaluation(prevState: any, formData: FormData) {
    try {
        const session = await checkHrAuth();

        const validated = EvaluationSchema.safeParse({
            evaluateeId: formData.get("evaluateeId"),
            punctuality: formData.get("punctuality"),
            qualityOfWork: formData.get("qualityOfWork"),
            teamwork: formData.get("teamwork"),
            communication: formData.get("communication"),
            initiative: formData.get("initiative"),
            comments: formData.get("comments"),
        });

        if (!validated.success) return { success: false, message: "Invalid evaluation data. Ensure all metrics are between 1 and 5." };
        const data = validated.data;

        // Auto-calculate average score safely
        const total = data.punctuality + data.qualityOfWork + data.teamwork + data.communication + data.initiative;
        const averageScore = Number((total / 5.0).toFixed(2));

        await prisma.staffEvaluation.create({
            data: {
                evaluateeId: data.evaluateeId,
                evaluatorId: session.user.id,
                punctuality: data.punctuality,
                qualityOfWork: data.qualityOfWork,
                teamwork: data.teamwork,
                communication: data.communication,
                initiative: data.initiative,
                averageScore,
                comments: data.comments,
            }
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "SUBMIT_EVALUATION", targetId: data.evaluateeId }
        });

        revalidatePath("/dashboard/hr");
        return { success: true, message: "Evaluation saved successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to submit evaluation." };
    }
}
