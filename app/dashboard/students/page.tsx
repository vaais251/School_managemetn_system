import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Users, GraduationCap, Info, Receipt } from "lucide-react";
import { Suspense } from "react";
import { StudentFilters } from "@/components/students/student-filters";
import { MarkFeeButton } from "@/components/students/mark-fee-button";
import { format } from "date-fns";

interface PageProps {
    searchParams: Promise<{ q?: string; class?: string }>;
}

export default async function StudentsDirectoryPage({ searchParams }: PageProps) {
    const session = await auth();
    const authorizedRoles = ["SUPER_ADMIN", "TRUST_MANAGER", "SECTION_HEAD", "ADMISSION_DEPT", "FEE_DEPT"];

    if (!session || !authorizedRoles.includes(session.user.role)) {
        if (session?.user?.role === "TEACHER") redirect("/dashboard/teacher");
        redirect("/dashboard");
    }

    const isTrustManager = session.user.role === "TRUST_MANAGER";
    const isFeeDept = session.user.role === "FEE_DEPT";

    const params = await searchParams;
    const searchQuery = params.q?.trim() ?? "";
    const classFilter = params.class ?? "";

    // Fetch all classes for the filter dropdown (only relevant for non-TM roles)
    const classes = isTrustManager
        ? []
        : await prisma.class.findMany({ orderBy: { name: "asc" } });

    // Build dynamic Prisma query
    const whereClause: any = {};

    // TRUST_MANAGER can ONLY see RFL students (scholarship students)
    if (isTrustManager) {
        whereClause.enrollments = {
            some: { type: "RFL", status: "ACTIVE" },
        };
    }

    if (searchQuery) {
        whereClause.OR = [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { registrationId: { contains: searchQuery, mode: "insensitive" } },
            { user: { email: { contains: searchQuery, mode: "insensitive" } } },
        ];
    }

    // Class filter only applies for non-TRUST_MANAGER roles
    if (!isTrustManager) {
        if (classFilter === "unassigned") {
            whereClause.classId = null;
        } else if (classFilter && classFilter !== "all") {
            whereClause.classId = classFilter;
        }
    }

    const students = await prisma.studentProfile.findMany({
        where: whereClause,
        orderBy: [{ name: "asc" }],
        include: {
            class: true,
            user: { select: { email: true, isActive: true } },
            enrollments: { where: { status: "ACTIVE" }, take: 1 },
            rflRecord: isTrustManager ? true : false,
            feeVouchers: isFeeDept ? { orderBy: { month: "desc" }, take: 1 } : false,
        },
    });

    // For total count badge
    const totalCount = await prisma.studentProfile.count(
        isTrustManager
            ? { where: { enrollments: { some: { type: "RFL" } } } }
            : undefined
    );

    // Group students by class for non-TM roles; flat list for TM (RFL have no class)
    const grouped: Record<string, typeof students> = {};

    for (const student of students) {
        const key = isTrustManager
            ? "RFL Scholarship Scholars"
            : (student.class?.name ?? "Unassigned (RFL / No Class)");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(student);
    }

    const groupKeys = Object.keys(grouped).sort((a, b) => {
        if (a.startsWith("Unassigned") || a.startsWith("RFL")) return 1;
        if (b.startsWith("Unassigned") || b.startsWith("RFL")) return -1;
        return a.localeCompare(b);
    });

    const programBadgeColor: Record<string, string> = {
        MRHSS: "bg-blue-100 text-blue-800 border-blue-200",
        MRA: "bg-purple-100 text-purple-800 border-purple-200",
        RFL: "bg-amber-100 text-amber-800 border-amber-200",
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                        {isTrustManager ? "RFL Scholar Directory" : "Global Student Directory"}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {isTrustManager
                            ? "View all Roshni Foundation & Learning scholarship scholars and their profiles."
                            : "Comprehensive listing of all enrolled students across the institution."}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white border border-slate-200 shadow-sm px-4 py-2.5 rounded-xl">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-slate-700">{totalCount}</span>
                    <span className="text-slate-500 font-medium">
                        {isTrustManager ? "RFL scholars" : "total students"}
                    </span>
                </div>
            </div>

            {/* TRUST_MANAGER scoped notice */}
            {isTrustManager && (
                <div className="flex items-start gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-white border border-amber-200/60 rounded-xl shadow-sm">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-900 leading-relaxed">
                        As Trust Manager, you can only view <strong className="font-semibold">RFL (Roshni Foundation & Learning)</strong> scholarship students.
                        Click the <strong className="font-semibold">View</strong> button to see a student's academic performance and disbursement history.
                    </span>
                </div>
            )}

            {/* FEE_DEPT scoped notice */}
            {isFeeDept && (
                <div className="flex items-start gap-3 px-5 py-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200/60 rounded-xl shadow-sm">
                    <Receipt className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-900 leading-relaxed">
                        As Fee Department, you can quickly verify and easily update each student's most recent fee voucher status from this directory.
                    </span>
                </div>
            )}

            {/* Filters (hidden for TM since RFL has no classes) */}
            {!isTrustManager && (
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <Suspense fallback={<div className="h-10 animate-pulse bg-slate-100 rounded" />}>
                            <StudentFilters
                                classes={classes}
                                totalCount={totalCount}
                                filteredCount={students.length}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            )}

            {/* Search for TM (simple, no class filter) */}
            {isTrustManager && (
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <Suspense fallback={<div className="h-10 animate-pulse bg-slate-100 rounded" />}>
                            <StudentFilters
                                classes={[]}
                                totalCount={totalCount}
                                filteredCount={students.length}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            )}

            {/* No results */}
            {students.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No students found.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try adjusting your search filter.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Grouped Sections */}
            {groupKeys.map((groupName) => {
                const groupStudents = grouped[groupName];
                const isRfl = groupName.startsWith("RFL") || groupName.startsWith("Unassigned");

                let paidCount = 0;
                let unpaidCount = 0;

                if (isFeeDept) {
                    groupStudents.forEach(s => {
                        const v = (s as any).feeVouchers?.[0];
                        if (v?.status === "PAID") paidCount++;
                        if (v?.status === "UNPAID") unpaidCount++;
                    });
                }

                return (
                    <Card key={groupName}>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isRfl ? "bg-amber-50" : "bg-blue-50"}`}>
                                        <GraduationCap className={`h-5 w-5 ${isRfl ? "text-amber-600" : "text-blue-600"}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{groupName}</CardTitle>
                                        <CardDescription>
                                            {groupStudents.length} student{groupStudents.length !== 1 ? "s" : ""}
                                        </CardDescription>
                                    </div>
                                </div>
                                {isFeeDept && !isRfl && groupStudents.length > 0 && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex flex-col text-right">
                                            <span className="font-semibold text-green-600">{paidCount} Paid</span>
                                            <span className="text-xs text-muted-foreground">Recent Vouchers</span>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div className="flex flex-col text-left">
                                            <span className="font-semibold text-red-600">{unpaidCount} Pending</span>
                                            <span className="text-xs text-muted-foreground">Recent Vouchers</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Reg ID</th>
                                            <th scope="col" className="px-4 py-3">Student Name</th>
                                            <th scope="col" className="px-4 py-3 hidden sm:table-cell">Email</th>
                                            {isTrustManager ? (
                                                <>
                                                    <th scope="col" className="px-4 py-3">University</th>
                                                    <th scope="col" className="px-4 py-3 text-center">GPA</th>
                                                </>
                                            ) : isFeeDept ? (
                                                <>
                                                    <th scope="col" className="px-4 py-3">Program</th>
                                                    <th scope="col" className="px-4 py-3">Current Fee Status</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th scope="col" className="px-4 py-3">Program</th>
                                                    <th scope="col" className="px-4 py-3">Status</th>
                                                </>
                                            )}
                                            <th scope="col" className="px-4 py-3 text-right">View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupStudents.map((student: any) => {
                                            const program = student.enrollments[0]?.type;
                                            const recentVoucher = student.feeVouchers?.[0]; // Only exists if isFeeDept
                                            return (
                                                <tr
                                                    key={student.id}
                                                    className="bg-white border-b last:border-0 hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-600">
                                                        {student.registrationId}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="font-semibold text-slate-900">{student.name}</div>
                                                        {student.isBeneficiary && (
                                                            <span className="text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                                                Financial Aid
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                                                        {student.user?.email}
                                                    </td>
                                                    {isTrustManager ? (
                                                        <>
                                                            <td className="px-4 py-3 text-xs text-slate-700">
                                                                {student.rflRecord?.universityName ?? (
                                                                    <span className="text-muted-foreground italic">Not recorded</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {student.rflRecord?.gpa ? (
                                                                    <span className={`font-bold text-sm ${Number(student.rflRecord.gpa) >= 3.0 ? "text-green-600" : Number(student.rflRecord.gpa) >= 2.0 ? "text-amber-600" : "text-red-600"}`}>
                                                                        {Number(student.rflRecord.gpa).toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    ) : isFeeDept ? (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                {program ? (
                                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${programBadgeColor[program] ?? "bg-slate-100 text-slate-700"}`}>
                                                                        {program}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {recentVoucher ? (
                                                                    <div className="flex flex-col gap-1 items-start">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                                                            {format(new Date(recentVoucher.month), "MMM yyyy")}
                                                                        </span>
                                                                        <MarkFeeButton voucherId={recentVoucher.id} status={recentVoucher.status} />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">No fee generated</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                {program ? (
                                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${programBadgeColor[program] ?? "bg-slate-100 text-slate-700"}`}>
                                                                        {program}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Badge
                                                                    variant={student.user?.isActive ? "default" : "destructive"}
                                                                    className="text-xs"
                                                                >
                                                                    {student.user?.isActive ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-4 py-3 text-right">
                                                        <Link href={`/dashboard/admin/student/${student.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                                            >
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
