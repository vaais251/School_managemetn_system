"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { ProgramType, Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const RegisterStudentSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    registrationId: z.string().min(3),
    isBeneficiary: z.boolean().default(false),
    needsHostel: z.boolean().default(false),
    programType: z.nativeEnum(ProgramType).optional(), // Can be overridden by needsHostel
    guardianInfo: z.string().optional(), // Expected to be JSON stringified representation from UI
});

function generateTempPassword(length = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < length; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

export async function registerStudent(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMISSION_DEPT")) {
        return { success: false, message: "Unauthorized: Insufficient privileges." };
    }

    const validatedFields = RegisterStudentSchema.safeParse({
        email: formData.get("email"),
        name: formData.get("name"),
        registrationId: formData.get("registrationId"),
        isBeneficiary: formData.get("isBeneficiary") === "true",
        needsHostel: formData.get("needsHostel") === "true",
        programType: formData.get("programType"),
        guardianInfo: formData.get("guardianInfo"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed.",
        };
    }

    const { email, name, registrationId, isBeneficiary, needsHostel, guardianInfo } = validatedFields.data;
    let { programType } = validatedFields.data;

    // Business Logic: If needs hostel, forced to MRA
    if (needsHostel) {
        programType = ProgramType.MRA;
    }

    if (!programType) {
        return { success: false, message: "Program Type is required if not opting for Hostel." };
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: Role.STUDENT,
                },
            });

            // 2. Create Student Profile
            const profile = await tx.studentProfile.create({
                data: {
                    userId: user.id,
                    registrationId,
                    name,
                    isBeneficiary,
                    needsHostel,
                    guardianInfo: guardianInfo ? JSON.parse(guardianInfo) : null,
                },
            });

            // 3. Create Program Enrollment
            await tx.programEnrollment.create({
                data: {
                    studentId: profile.id,
                    type: programType as ProgramType,
                },
            });

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    actorId: session.user.id,
                    actionType: "REGISTER_STUDENT",
                    targetId: profile.id,
                },
            });
        });

        revalidatePath("/dashboard/admissions");
        revalidatePath("/dashboard/students"); // If there is a students list

        return {
            success: true,
            message: "Student registered successfully.",
            credentials: { email, password: tempPassword }
        };

    } catch (error: any) {
        console.error("Failed to register student:", error);
        if (error.code === 'P2002') {
            return { success: false, message: "Email or Registration ID already exists." };
        }
        return { success: false, message: "Database Error: Failed to register student." };
    }
}
