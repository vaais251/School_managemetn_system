"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const remarkSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    subject: z.string().optional(),
    comments: z.string().min(3, "Remarks must be at least 3 characters").max(1000, "Remarks are too long"),
});

export async function submitStudentRemark(data: z.infer<typeof remarkSchema>) {
    const session = await auth();

    // Basic Auth Check
    if (!session || session.user.role !== "TEACHER") {
        throw new Error("Unauthorized access");
    }

    const teacherId = session.user.id;

    // Validate Input
    const parsedData = remarkSchema.safeParse(data);
    if (!parsedData.success) {
        throw new Error("Invalid input data");
    }

    const { studentId, subject, comments } = parsedData.data;

    // Security Check: Ensure the teacher is actually assigned to the student's current class
    const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { classId: true },
    });

    if (!student || !student.classId) {
        throw new Error("Student not found or not assigned to a class");
    }

    const assignment = await prisma.teacherAssignment.findFirst({
        where: {
            teacherId: teacherId,
            classId: student.classId,
        },
    });

    if (!assignment) {
        throw new Error("You are not authorized to leave remarks for this student");
    }

    // Create the Remark
    await prisma.teacherRemark.create({
        data: {
            teacherId,
            studentId,
            subject,
            comments,
        },
    });

    // Revalidate the student dashboard path so parents/students see it immediately
    revalidatePath("/student");
    revalidatePath("/dashboard/teacher");

    return { success: true };
}

export async function getRemarksForStudent(userId: string) {
    const session = await auth();

    // Ensure the caller is either the student themselves or an admin/teacher
    if (!session || !["STUDENT", "TEACHER", "SUPER_ADMIN", "SECTION_HEAD"].includes(session.user.role)) {
        throw new Error("Unauthorized access");
    }

    // Find the student profile ID based on the NextAuth userId
    const student = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!student) {
        throw new Error("Student profile not found");
    }

    // Fetch all remarks for this student
    const remarks = await prisma.teacherRemark.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: {
            teacher: {
                select: {
                    email: true, // we might not have 'name' strictly on User model, but we have email or studentProfile name
                },
            },
        },
    });

    return remarks;
}
