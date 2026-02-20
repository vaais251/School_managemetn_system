"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getExecutiveDashboardMetrics() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    // 1. Total Students vs. Capacity (group by ProgramType)
    const enrollmentCounts = await prisma.programEnrollment.groupBy({
        by: ['type'],
        where: { status: 'ACTIVE' },
        _count: { studentId: true }
    });

    const capacityMap: Record<string, number> = {
        MRHSS: 100, // Example capacity limits
        MRA: 50,
        RFL: 20
    };

    const studentsVsCapacity = enrollmentCounts.map(ec => ({
        name: ec.type,
        enrolled: ec._count.studentId,
        capacity: capacityMap[ec.type as string] || 0
    }));

    // If there are no students, we still want to show the capacity structure so charts don't look empty
    Object.keys(capacityMap).forEach(program => {
        if (!studentsVsCapacity.find(s => s.name === program)) {
            studentsVsCapacity.push({
                name: program as any,
                enrolled: 0,
                capacity: capacityMap[program]
            });
        }
    });

    // 2. Financial Collection Rate (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const feeSummaries = await prisma.feeVoucher.groupBy({
        by: ['status'],
        where: { month: { gte: startOfMonth } },
        _sum: { amount: true }
    });

    const financialCollection = feeSummaries.map(fs => ({
        status: fs.status,
        total: Number(fs._sum.amount || 0)
    }));

    // Fast-fill for empty DBs so pie chart still renders
    if (!financialCollection.find(f => f.status === 'PAID')) financialCollection.push({ status: 'PAID' as any, total: 0 });
    if (!financialCollection.find(f => f.status === 'UNPAID')) financialCollection.push({ status: 'UNPAID' as any, total: 0 });

    // 3. RFL Disbursement Volume (grouped by purpose)
    const disbursements = await prisma.disbursement.groupBy({
        by: ['purpose'],
        _sum: { amount: true }
    });

    const rflVolume = disbursements.map(d => ({
        purpose: d.purpose,
        total: Number(d._sum.amount || 0)
    }));

    return {
        studentsVsCapacity,
        financialCollection,
        rflVolume
    };
}
