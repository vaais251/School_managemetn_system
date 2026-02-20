"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const SurveySchema = z.object({
    title: z.string().min(5),
    description: z.string().optional(),
    metrics: z.array(z.string().min(2)).min(1, "At least one metric must be defined."),
});

const FeedbackSchema = z.object({
    surveyId: z.string().uuid(),
    evaluateeId: z.string().uuid(), // Teacher ID
    ratings: z.record(z.string(), z.coerce.number().min(1).max(5)),
    comments: z.string().optional(),
});

/**
 * Ensures the actor is a SUPER_ADMIN or PRINCIPAL (assuming SUPER_ADMIN covers QEC for now).
 */
async function checkQecAuth() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized: Only Admins can manage QEC surveys.");
    }
    return session;
}

/**
 * Creates a new QEC feedback survey targeting teachers.
 */
export async function createSurvey(prevState: any, formData: FormData) {
    try {
        const session = await checkQecAuth();

        // Extract native formData array for metrics
        const metricsArray = formData.getAll("metrics[]").map(m => m.toString());

        const validated = SurveySchema.safeParse({
            title: formData.get("title"),
            description: formData.get("description"),
            metrics: metricsArray,
        });

        if (!validated.success) return { success: false, message: "Invalid survey configuration." };
        const data = validated.data;

        // @ts-ignore
        await prisma.survey.create({
            data: {
                title: data.title,
                description: data.description,
                metrics: data.metrics,
            }
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "CREATE_QEC_SURVEY" }
        });

        revalidatePath("/dashboard/qec");
        return { success: true, message: "Survey published successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to publish survey." };
    }
}

/**
 * Students submit feedback anonymously. 
 * `studentId` is intentionally NOT stored in the `Feedback` table.
 */
export async function submitFeedback(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "STUDENT") {
            throw new Error("Unauthorized: Only students can submit feedback forms.");
        }

        // Ratings are sent as stringified JSON from the client form
        const rawRatings = formData.get("ratings") as string;
        let pRatings = {};
        try { pRatings = JSON.parse(rawRatings); } catch (e) { }

        const validated = FeedbackSchema.safeParse({
            surveyId: formData.get("surveyId"),
            evaluateeId: formData.get("evaluateeId"),
            ratings: pRatings,
            comments: formData.get("comments"),
        });

        if (!validated.success) return { success: false, message: "Invalid feedback input." };
        const data = validated.data;

        // @ts-ignore
        await prisma.feedback.create({
            data: {
                surveyId: data.surveyId,
                evaluateeId: data.evaluateeId,
                ratings: data.ratings, // Saving anonymous JSON
                comments: data.comments,
            }
        });

        // We can't link to student ID for anonymity, but we'll log that feedback happened
        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "SUBMITTED_ANON_FEEDBACK", targetId: data.evaluateeId }
        });

        revalidatePath("/dashboard/student/feedback");
        return { success: true, message: "Feedback submitted anonymously. Thank you!" };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to submit feedback." };
    }
}
