"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcrypt";

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
}).refine(d => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export async function changePassword(prevState: any, formData: FormData) {
    try {
        const session = await auth();
        if (!session) throw new Error("Not authenticated.");

        const validated = ChangePasswordSchema.safeParse({
            currentPassword: formData.get("currentPassword"),
            newPassword: formData.get("newPassword"),
            confirmPassword: formData.get("confirmPassword"),
        });

        if (!validated.success) {
            return { success: false, message: validated.error.issues[0].message };
        }

        const { currentPassword, newPassword } = validated.data;

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) throw new Error("User not found.");

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return { success: false, message: "Current password is incorrect." };

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "CHANGE_PASSWORD" }
        });

        revalidatePath("/dashboard/profile");
        return { success: true, message: "Password changed successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to change password." };
    }
}
