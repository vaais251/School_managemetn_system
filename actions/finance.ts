"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

const FeeStructureSchema = z.object({
    classId: z.string().uuid(),
    tuitionFee: z.coerce.number().min(0),
    hostelFee: z.coerce.number().min(0),
});

const BulkFeeVoucherSchema = z.object({
    classId: z.string().uuid(),
    month: z.string(), // ISO date
    fineAmount: z.coerce.number().min(0).default(0),
});

const MarkPaidSchema = z.object({
    voucherId: z.string().uuid(),
});

async function checkFinanceAuth() {
    const session = await auth();
    if (!session || (session.user.role !== "FEE_DEPT" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized: Only Fee Department can perform this action.");
    }
    return session;
}

/**
 * Defines or updates the fee structure for a specific class.
 */
export async function defineFeeStructure(prevState: any, formData: FormData) {
    try {
        const session = await checkFinanceAuth();

        const validated = FeeStructureSchema.safeParse({
            classId: formData.get("classId"),
            tuitionFee: formData.get("tuitionFee"),
            hostelFee: formData.get("hostelFee"),
        });

        if (!validated.success) return { success: false, message: "Invalid fee structure data." };
        const data = validated.data;

        await prisma.feeStructure.upsert({
            where: { classId: data.classId },
            update: { tuitionFee: data.tuitionFee, hostelFee: data.hostelFee },
            create: { classId: data.classId, tuitionFee: data.tuitionFee, hostelFee: data.hostelFee },
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "DEFINE_FEE_STRUCTURE", targetId: data.classId }
        });

        revalidatePath("/dashboard/finance");
        return { success: true, message: "Fee structure updated successfully." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to define fee structure." };
    }
}

/**
 * Generates bulk fee vouchers for an entire class for a specific month.
 * Automatically handles Beneficiary logic and Hostel Fee inclusion.
 */
export async function generateBulkFeeVouchers(prevState: any, formData: FormData) {
    try {
        const session = await checkFinanceAuth();

        const validated = BulkFeeVoucherSchema.safeParse({
            classId: formData.get("classId"),
            month: formData.get("month"),
            fineAmount: formData.get("fineAmount") || 0,
        });

        if (!validated.success) return { success: false, message: "Invalid input parameters." };
        const { classId, month, fineAmount } = validated.data;
        const targetDate = new Date(month);

        // Run within a transaction for ACID compliance
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Fee Structure
            // @ts-ignore
            const feeStructure = await tx.feeStructure.findUnique({
                where: { classId }
            });
            if (!feeStructure) throw new Error("Fee Structure not defined for this class.");

            // 2. Find eligible students (Active students in this class)
            // @ts-ignore
            const eligibleStudents = await tx.studentProfile.findMany({
                where: {
                    classId,
                    // We could add an EnrollmentStatus check here if we explicitly modeled dropping out.
                    // Assuming classId linkage implies active for now.
                },
                include: {
                    feeVouchers: {
                        where: {
                            month: {
                                gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
                                lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1),
                            }
                        }
                    }
                }
            });

            if (eligibleStudents.length === 0) return { count: 0, message: "No students found." };

            let vouchersCreated = 0;

            for (const student of eligibleStudents) {
                // Skip if voucher already exists for this month
                if (student.feeVouchers.length > 0) continue;

                // Skip if isBeneficiary == true
                if (student.isBeneficiary) continue;

                let totalAmount = Number(feeStructure.tuitionFee);

                if (student.needsHostel) {
                    totalAmount += Number(feeStructure.hostelFee);
                }

                // @ts-ignore
                await tx.feeVoucher.create({
                    data: {
                        studentId: student.id,
                        month: targetDate,
                        amount: totalAmount,
                        fineAmount: fineAmount > 0 ? fineAmount : null,
                        status: "UNPAID",
                    }
                });
                vouchersCreated++;
            }

            // @ts-ignore
            await tx.auditLog.create({
                data: { actorId: session.user.id, actionType: "GENERATE_BULK_VOUCHERS", targetId: classId }
            });

            return { count: vouchersCreated };
        }, {
            maxWait: 5000,
            timeout: 10000,
        });

        revalidatePath("/dashboard/finance");
        return { success: true, message: `Successfully generated ${result.count} vouchers.` };
    } catch (error: any) {
        return { success: false, message: error.message || "Bulk generation failed." };
    }
}

/**
 * Marks a specific voucher as PAID.
 */
export async function markVoucherPaid(voucherId: string) {
    try {
        const session = await checkFinanceAuth();

        const validated = MarkPaidSchema.safeParse({ voucherId });
        if (!validated.success) return { success: false, message: "Invalid voucher ID." };

        await prisma.feeVoucher.update({
            where: { id: validated.data.voucherId },
            data: { status: "PAID" },
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "MARK_VOUCHER_PAID", targetId: voucherId }
        });

        revalidatePath("/dashboard/finance");
        revalidatePath("/dashboard/students");
        return { success: true, message: "Voucher marked as PAID." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update voucher status." };
    }
}

/**
 * Marks a specific voucher as UNPAID.
 */
export async function markVoucherUnpaid(voucherId: string) {
    try {
        const session = await checkFinanceAuth();

        const validated = MarkPaidSchema.safeParse({ voucherId });
        if (!validated.success) return { success: false, message: "Invalid voucher ID." };

        await prisma.feeVoucher.update({
            where: { id: validated.data.voucherId },
            data: { status: "UNPAID" },
        });

        await prisma.auditLog.create({
            data: { actorId: session.user.id, actionType: "MARK_VOUCHER_UNPAID", targetId: voucherId }
        });

        revalidatePath("/dashboard/finance");
        revalidatePath("/dashboard/students");
        return { success: true, message: "Voucher marked as UNPAID." };
    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update voucher status." };
    }
}
