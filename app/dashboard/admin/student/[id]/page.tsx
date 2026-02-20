import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { User, GraduationCap, Banknote, ShieldAlert } from "lucide-react";

export default async function Student360View({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

    const student = await prisma.studentProfile.findUnique({
        where: { id: params.id },
        include: {
            class: true,
            enrollments: true,
            attendance: true,
            marks: { include: { subject: true }, orderBy: { date: 'desc' } },
            feeVouchers: { orderBy: { month: 'desc' } },
            disbursements: { orderBy: { transactionDate: 'desc' } },
            rflRecord: true,
            user: { select: { email: true, isActive: true, createdAt: true } }
        }
    });

    if (!student) {
        return <div className="p-8 text-center text-muted-foreground">Student record not found.</div>;
    }

    // Calculations
    const totalDays = student.attendance.length;
    const presentDays = student.attendance.filter((a: any) => a.status === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "N/A";

    // @ts-ignore
    const unpaidFees = student.feeVouchers.filter((v: any) => v.status === "UNPAID").reduce((acc: any, v: any) => acc + Number(v.amount) + Number(v.fineAmount || 0), 0);
    const totalDisbursed = student.disbursements.reduce((acc: any, d: any) => acc + Number(d.amount), 0);

    const activeProgram = student.enrollments.find((e: any) => e.status === "ACTIVE")?.type || "None";
    const guardianInfo = student.guardianInfo as any;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">{student.name}</h2>
                    <p className="text-muted-foreground">Registration ID: {student.registrationId}</p>
                </div>
                <Badge variant={student.user.isActive ? "default" : "destructive"} className="text-sm">
                    {student.user.isActive ? "Active Account" : "Suspended"}
                </Badge>
            </div>

            <Tabs defaultValue="identity" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="identity" className="flex items-center gap-2"><User size={16} /> Identity</TabsTrigger>
                    <TabsTrigger value="academic" className="flex items-center gap-2"><GraduationCap size={16} /> Academic</TabsTrigger>
                    <TabsTrigger value="finance" className="flex items-center gap-2"><Banknote size={16} /> Finance</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Details</CardTitle>
                            </CardHeader>
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
                                    <span className="col-span-2 flex gap-2">
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

                <TabsContent value="academic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${Number(attendancePercentage) < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                    {attendancePercentage}%
                                </div>
                                <p className="text-xs text-muted-foreground">{presentDays} / {totalDays} days present</p>
                            </CardContent>
                        </Card>
                        {student.rflRecord && (
                            <Card className="col-span-2 bg-blue-50 border-blue-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-900">RFL University Tracker</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">University:</span> <span className="font-semibold text-blue-900">{student.rflRecord.universityName}</span></div>
                                        <div><span className="text-muted-foreground">Degree:</span> <span className="font-semibold text-blue-900">{student.rflRecord.degree}</span></div>
                                        <div><span className="text-muted-foreground">GPA:</span> <span className="font-semibold text-blue-900">{student.rflRecord.gpa ? Number(student.rflRecord.gpa).toFixed(2) : "N/A"}</span></div>
                                        <div><span className="text-muted-foreground">Semester:</span> <span className="font-semibold text-blue-900">{student.rflRecord.currentSemester}</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Exam Grades</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {student.marks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent exam records.</p>
                            ) : (
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
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance" className="space-y-4">
                    {activeProgram !== "RFL" ? (
                        <Card className={unpaidFees > 0 ? "border-red-200 shadow-sm" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Fee Vouchers</CardTitle>
                                    <CardDescription>Billing history for standard school programs.</CardDescription>
                                </div>
                                {unpaidFees > 0 && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-semibold">
                                        <ShieldAlert size={16} /> ${unpaidFees.toLocaleString()} Due
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
                                                    <Badge variant={v.status === "PAID" ? "default" : "destructive"} className="mt-1">
                                                        {v.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">${Number(v.amount).toLocaleString()}</div>
                                                    {v.fineAmount && Number(v.fineAmount) > 0 && (
                                                        <div className="text-xs text-red-500">+${Number(v.fineAmount)} fine</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-blue-200 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>RFL Scholarship Ledger</CardTitle>
                                    <CardDescription>History of financial disbursements granted to this student.</CardDescription>
                                </div>
                                <div className="text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-sm font-semibold">
                                    Total Granted: ${totalDisbursed.toLocaleString()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {student.disbursements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No disbursements recorded yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {student.disbursements.map((d: any) => (
                                            <div key={d.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                                                <div>
                                                    <p className="font-medium">{d.purpose}</p>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                        <span>{format(new Date(d.transactionDate), "PP")}</span>
                                                        {d.description && (
                                                            <>
                                                                <span>&bull;</span>
                                                                <span className="italic">{d.description}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="font-bold text-lg text-blue-600">
                                                    ${Number(d.amount).toLocaleString()}
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
