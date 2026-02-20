"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// Schemas
const CreateClassSchema = z.object({
    name: z.string().min(2, "Class name too short"),
});

const CreateSubjectSchema = z.object({
    name: z.string().min(2, "Subject name too short"),
});

const AssignTeacherSchema = z.object({
    teacherId: z.string().uuid(),
    classId: z.string().uuid(),
    subjectId: z.string().optional(), // If missing, implies Class Teacher
});

// Authorization helper
async function checkAuth() {
    const session = await auth();
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SECTION_HEAD")) {
        throw new Error("Unauthorized: Insufficient privileges for Academic Setup.");
    }
    return session;
}

export async function createClass(prevState: any, formData: FormData) {
    try {
        const session = await checkAuth();

        const validatedFields = CreateClassSchema.safeParse({
            name: formData.get("name"),
        });

        if (!validatedFields.success) {
            return { success: false, message: "Invalid class name." };
        }

        const newClass = await prisma.class.create({
            data: { name: validatedFields.data.name },
        });

        await prisma.auditLog.create({
            data: {
                actorId: session.user.id,
                actionType: "CREATE_CLASS",
                targetId: newClass.id,
            },
        });

        revalidatePath("/dashboard/academics");
        return { success: true, message: "Class created successfully." };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: "Class name already exists." };
        return { success: false, message: error.message || "Failed to create class." };
    }
}

export async function createSubject(prevState: any, formData: FormData) {
    try {
        const session = await checkAuth();

        const validatedFields = CreateSubjectSchema.safeParse({
            name: formData.get("name"),
        });

        if (!validatedFields.success) {
            return { success: false, message: "Invalid subject name." };
        }

        const subject = await prisma.subject.create({
            data: { name: validatedFields.data.name },
        });

        await prisma.auditLog.create({
            data: {
                actorId: session.user.id,
                actionType: "CREATE_SUBJECT",
                targetId: subject.id,
            },
        });

        revalidatePath("/dashboard/academics");
        return { success: true, message: "Subject created successfully." };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: "Subject name already exists." };
        return { success: false, message: error.message || "Failed to create subject." };
    }
}

export async function assignTeacher(prevState: any, formData: FormData) {
    try {
        const session = await checkAuth();

        // Convert empty string subjectId to undefined for optional validation
        let rawSubjectId = formData.get("subjectId");
        if (rawSubjectId === "" || rawSubjectId === "none") rawSubjectId = null;

        const validatedFields = AssignTeacherSchema.safeParse({
            teacherId: formData.get("teacherId"),
            classId: formData.get("classId"),
            subjectId: rawSubjectId || undefined,
        });

        if (!validatedFields.success) {
            return { success: false, message: "Invalid assignment data." };
        }

        const { teacherId, classId, subjectId } = validatedFields.data;

        // Verify teacher exists and has TEACHER role
        const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
        if (!teacher || teacher.role !== "TEACHER") {
            return { success: false, message: "Invalid teacher selected." };
        }

        const assignment = await prisma.teacherAssignment.create({
            data: {
                teacherId,
                classId,
                subjectId: subjectId || null,
            },
        });

        await prisma.auditLog.create({
            data: {
                actorId: session.user.id,
                actionType: subjectId ? "ASSIGN_SUBJECT_TEACHER" : "ASSIGN_CLASS_TEACHER",
                targetId: assignment.id,
            },
        });

        revalidatePath("/dashboard/academics");
        return { success: true, message: "Teacher assigned successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to assign teacher." };
    }
}
