"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getStudentDashboardData() {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        include: {
            enrollments: true,
            attendance: {
                orderBy: { date: "desc" },
                take: 30, // Last 30 days
            },
            marks: {
                orderBy: { date: "desc" },
                include: { subject: true, class: true },
                take: 10,
            },
            feeVouchers: {
                orderBy: { month: "desc" },
                take: 12, // Last 12 months
            },
            disbursements: {
                orderBy: { transactionDate: "desc" },
            },
            rflRecord: true,
            class: true,
        },
    });

    if (!studentProfile) {
        throw new Error("Student profile not found");
    }

    return studentProfile;
}

export async function getPendingSurveys() {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { id: true, classId: true },
    });

    if (!studentProfile || !studentProfile.classId) {
        return []; // No class assigned, so no teachers
    }

    // Find current teachers for the student's class
    const classAssignments = await prisma.teacherAssignment.findMany({
        where: { classId: studentProfile.classId },
        include: {
            teacher: {
                select: { id: true, email: true },
            },
            subject: true,
        },
    });

    // Get active surveys
    const activeSurveys = await prisma.survey.findMany({
        where: { isActive: true },
    });

    // Check existing submissions
    const submissions = await prisma.surveySubmission.findMany({
        where: {
            studentId: studentProfile.id,
            surveyId: { in: activeSurveys.map((s) => s.id) },
        },
    });

    // Build a list of pending surveys
    const pendingSurveys = [];

    for (const survey of activeSurveys) {
        for (const assignment of classAssignments) {
            const hasSubmitted = submissions.some(
                (sub) => sub.surveyId === survey.id && sub.evaluateeId === assignment.teacherId
            );

            if (!hasSubmitted) {
                pendingSurveys.push({
                    survey: {
                        id: survey.id,
                        title: survey.title,
                        description: survey.description,
                        metrics: survey.metrics,
                    },
                    teacherId: assignment.teacherId,
                    teacherEmail: assignment.teacher.email, // using email as identifier
                    subjectName: assignment.subject?.name || "General",
                });
            }
        }
    }

    return pendingSurveys;
}

export async function submitQECFeedback(data: {
    surveyId: string;
    evaluateeId: string;
    ratings: Record<string, number>;
    comments?: string;
}) {
    const session = await auth();
    if (!session || session.user.role !== "STUDENT") {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!studentProfile) {
        throw new Error("Student profile not found");
    }

    // Use a transaction
    await prisma.$transaction(async (tx) => {
        // 1. Check if already submitted
        const existing = await tx.surveySubmission.findUnique({
            where: {
                surveyId_studentId_evaluateeId: {
                    surveyId: data.surveyId,
                    studentId: studentProfile.id,
                    evaluateeId: data.evaluateeId,
                },
            },
        });

        if (existing) {
            throw new Error("Feedback already submitted for this teacher on this survey");
        }

        // 2. Create the anonymous Feedback (without linking studentId)
        await tx.feedback.create({
            data: {
                surveyId: data.surveyId,
                evaluateeId: data.evaluateeId,
                ratings: data.ratings,
                comments: data.comments,
            },
        });

        // 3. Record the submission to prevent duplicates
        await tx.surveySubmission.create({
            data: {
                surveyId: data.surveyId,
                studentId: studentProfile.id,
                evaluateeId: data.evaluateeId,
            },
        });
    });

    return { success: true };
}
