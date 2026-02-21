import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, GraduationCap, Banknote, ShieldAlert } from "lucide-react";

const AUTHORIZED_ROLES = ["SUPER_ADMIN", "SECTION_HEAD", "TRUST_MANAGER", "ADMISSION_DEPT"];

export default async function Student360View({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || !AUTHORIZED_ROLES.includes(session.user.role)) redirect("/dashboard");

    const isTrustManager = session.user.role === "TRUST_MANAGER";

    const student = await prisma.studentProfile.findUnique({
        where: { id: params.id },
        include: {
            class: true,
            enrollments: true,
            attendance: true,
            marks: { include: { subject: true }, orderBy: { date: "desc" } },
            feeVouchers: { orderBy: { month: "desc" } },
            disbursements: { orderBy: { transactionDate: "desc" } },
            rflRecord: true,
            user: { select: { email: true, isActive: true, createdAt: true } },
        },
    });

    if (!student) {
        return <div className="p-8 text-center text-muted-foreground">Student record not found.</div>;
    }

    const activeProgram = student.enrollments.find((e: any) => e.status === "ACTIVE")?.type || "None";

    // TRUST_MANAGER can only view RFL students
    if (isTrustManager && activeProgram !== "RFL") {
        redirect("/dashboard/students");
    }

    // Calculations
    const totalDays = student.attendance.length;
    const presentDays = student.attendance.filter((a: any) => a.status === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "N/A";
    // @ts-ignore
    const unpaidFees = student.feeVouchers.filter((v: any) => v.status === "UNPAID").reduce((acc: any, v: any) => acc + Number(v.amount) + Number(v.fineAmount || 0), 0);
    const totalDisbursed = student.disbursements.reduce((acc: any, d: any) => acc + Number(d.amount), 0);
    const guardianInfo = student.guardianInfo as any;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">{student.name}</h2>
                    <p className="text-muted-foreground">Registration ID: {student.registrationId}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isTrustManager && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs" variant="outline">
                            RFL Scholar
                        </Badge>
                    )}
                    <Badge variant={student.user.isActive ? "default" : "destructive"} className="text-sm">
                        {student.user.isActive ? "Active Account" : "Suspended"}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="identity" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="identity" className="flex items-center gap-2">
                        <User size={16} /> Identity
                    </TabsTrigger>
                    <TabsTrigger value="academic" className="flex items-center gap-2">
                        <GraduationCap size={16} /> Academic Performance
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="flex items-center gap-2">
                        <Banknote size={16} />
                        {isTrustManager ? "Disbursements" : "Finance"}
                    </TabsTrigger>
                </TabsList>

                {/* ─── Identity Tab ─── */}
                <TabsContent value="identity" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-3 py-1 border-b text-sm">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="col-span-2 font-medium">{student.user.email}</span>
                                </div>
                                <div className="grid grid-cols-3 py-1 border-b text-sm">
                                    <span className="text-muted-foreground">Class:</span>
                                    <span className="col-span-2 font-medium">{student.class?.name || "Unassigned"}</span>
                                </div>
                                <div className="grid grid-cols-3 py-1 border-b text-sm">
                                    <span className="text-muted-foreground">Program:</span>
                                    <span className="col-span-2 font-medium"><Badge>{activeProgram}</Badge></span>
                                </div>
                                <div className="grid grid-cols-3 py-1 border-b text-sm">
                                    <span className="text-muted-foreground">Joined:</span>
                                    <span className="col-span-2 font-medium">{format(student.user.createdAt, "PP")}</span>
                                </div>
                                <div className="grid grid-cols-3 py-1 text-sm">
                                    <span className="text-muted-foreground">Flags:</span>
                                    <span className="col-span-2 flex gap-2 flex-wrap">
                                        {student.isBeneficiary && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Financial Aid</Badge>}
                                        {student.needsHostel && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Hostel</Badge>}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Guardian Information</CardTitle>
                                <CardDescription>Emergency contact and relationship details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {guardianInfo ? (
                                    <>
                                        <div className="grid grid-cols-3 py-1 border-b text-sm">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="col-span-2 font-medium">{guardianInfo.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 py-1 border-b text-sm">
                                            <span className="text-muted-foreground">Relation:</span>
                                            <span className="col-span-2 font-medium">{guardianInfo.relationship}</span>
                                        </div>
                                        <div className="grid grid-cols-3 py-1 border-b text-sm">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span className="col-span-2 font-medium">{guardianInfo.phone}</span>
                                        </div>
                                        <div className="grid grid-cols-3 py-1 text-sm">
                                            <span className="text-muted-foreground">Address:</span>
                                            <span className="col-span-2 font-medium">{guardianInfo.address}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No guardian information provided.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ─── Academic Performance Tab ─── */}
                <TabsContent value="academic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${Number(attendancePercentage) < 75 ? "text-red-500" : "text-green-600"}`}>
                                    {attendancePercentage}%
                                </div>
                                <p className="text-xs text-muted-foreground">{presentDays} / {totalDays} days present</p>
                            </CardContent>
                        </Card>

                        {/* RFL Academic Record */}
                        {student.rflRecord && (
                            <Card className="col-span-2 bg-amber-50 border-amber-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-amber-900">RFL University Tracker</CardTitle>
                                    {isTrustManager && (
                                        <CardDescription className="text-amber-700 text-xs">
                                            Update this student's university progress from the{" "}
                                            <a href="/dashboard/rfl" className="underline font-medium">RFL Trust Dashboard</a>.
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">University</p>
                                            <p className="font-semibold text-amber-900">{student.rflRecord.universityName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Degree</p>
                                            <p className="font-semibold text-amber-900">{student.rflRecord.degree}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">GPA</p>
                                            <p className={`text-2xl font-bold ${Number(student.rflRecord.gpa) >= 3.0 ? "text-green-600" : "text-amber-700"}`}>
                                                {student.rflRecord.gpa ? Number(student.rflRecord.gpa).toFixed(2) : "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Current Semester</p>
                                            <p className="text-2xl font-bold text-amber-900">Sem {student.rflRecord.currentSemester}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* No RFL Record */}
                        {!student.rflRecord && activeProgram === "RFL" && (
                            <Card className="col-span-2 border-dashed">
                                <CardContent className="py-6 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No university record on file.{" "}
                                        {isTrustManager && (
                                            <a href="/dashboard/rfl" className="underline text-amber-700 font-medium">
                                                Add one in the RFL Trust Dashboard.
                                            </a>
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Exam Marks (if any - mainly for MRHSS/MRA) */}
                    {student.marks.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Exam Grades</CardTitle></CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-500">Exam Name</th>
                                                <th className="px-4 py-3 text-left font-medium text-slate-500">Subject</th>
                                                <th className="px-4 py-3 text-right font-medium text-slate-500">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {student.marks.map((m: any) => (
                                                <tr key={m.id}>
                                                    <td className="px-4 py-3">{format(new Date(m.date), "MMM dd, yyyy")}</td>
                                                    <td className="px-4 py-3">{m.examTitle}</td>
                                                    <td className="px-4 py-3">{m.subject.name}</td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        <span className={Number(m.marksObtained) < Number(m.totalMarks) * 0.4 ? "text-red-500" : "text-green-600"}>
                                                            {Number(m.marksObtained)}
                                                        </span>
                                                        <span className="text-muted-foreground"> / {Number(m.totalMarks)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ─── Finance Tab ─── */}
                <TabsContent value="finance" className="space-y-4">
                    {/* TRUST_MANAGER sees Disbursements (money sent TO students) */}
                    {isTrustManager || activeProgram === "RFL" ? (
                        <Card className="border-amber-200">
                            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                                <div>
                                    <CardTitle>RFL Scholarship Disbursements</CardTitle>
                                    <CardDescription>
                                        History of funds handed out to this scholar (tuition, stipends, hostel, etc.)
                                    </CardDescription>
                                </div>
                                <div className="text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-semibold border border-amber-200">
                                    Total: Rs. {totalDisbursed.toLocaleString()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {student.disbursements.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Banknote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No disbursements recorded for this student yet.</p>
                                        {isTrustManager && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Use the{" "}
                                                <a href="/dashboard/rfl" className="underline text-amber-700 font-medium">RFL Trust Dashboard</a>
                                                {" "}to record a new disbursement.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {student.disbursements.map((d: any) => (
                                            <div key={d.id} className="flex justify-between items-center p-4 border rounded-lg bg-amber-50/50 hover:bg-amber-50 transition-colors">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800">{d.purpose}</p>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                                        <span className="bg-white border px-2 py-0.5 rounded-full">
                                                            {format(new Date(d.transactionDate), "PP")}
                                                        </span>
                                                        {d.description && (
                                                            <span className="italic">{d.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="font-bold text-xl text-amber-700 ml-4">
                                                    Rs. {Number(d.amount).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* Other roles see fee vouchers for MRHSS/MRA */
                        <Card className={unpaidFees > 0 ? "border-red-200 shadow-sm" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                                <div>
                                    <CardTitle>Fee Vouchers</CardTitle>
                                    <CardDescription>Billing history for standard school programs.</CardDescription>
                                </div>
                                {unpaidFees > 0 && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-semibold">
                                        <ShieldAlert size={16} /> Rs.{unpaidFees.toLocaleString()} Due
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {student.feeVouchers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No fee records found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {student.feeVouchers.map((v: any) => (
                                            <div key={v.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                                                <div>
                                                    <p className="font-medium">{format(new Date(v.month), "MMMM yyyy")}</p>
                                                    <Badge variant={v.status === "PAID" ? "default" : "destructive"} className="mt-1">{v.status}</Badge>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">Rs. {Number(v.amount).toLocaleString()}</div>
                                                    {v.fineAmount && Number(v.fineAmount) > 0 && (
                                                        <div className="text-xs text-red-500">+Rs. {Number(v.fineAmount)} fine</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
