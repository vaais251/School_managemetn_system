"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { format } from "date-fns";
import { MessageSquareText } from "lucide-react";

export default function StudentDashboardView({ studentData, teacherRemarks = [] }: { studentData: any; teacherRemarks?: any[] }) {
    // Determine if student is University (RFL) or School (MRA/MRHSS) based on active enrollment
    const rflEnrollment = studentData.enrollments?.find((e: any) => e.type === "RFL");
    const isUniversity = !!rflEnrollment;

    // School Derived Data (Attendance)
    const totalDays = studentData.attendance?.length || 0;
    const presentDays = studentData.attendance?.filter((a: any) => a.status === "PRESENT").length || 0;
    const absentDays = studentData.attendance?.filter((a: any) => a.status === "ABSENT").length || 0;
    const leaveDays = studentData.attendance?.filter((a: any) => a.status === "LEAVE").length || 0;

    const attendanceData = [
        { name: "Present", value: presentDays, color: "#10b981" },
        { name: "Absent", value: absentDays, color: "#ef4444" },
        { name: "Leave", value: leaveDays, color: "#f59e0b" },
    ];

    return (
        <Tabs defaultValue="academics" className="space-y-4">
            <TabsList>
                <TabsTrigger value="academics">Overview & Academics</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
            </TabsList>

            {/* ACADEMICS TAB */}
            <TabsContent value="academics" className="space-y-4">
                {isUniversity ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">University</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{studentData.rflRecord?.universityName || "N/A"}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Degree</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{studentData.rflRecord?.degree || "N/A"}</div>
                                <p className="text-xs text-muted-foreground mt-1">Semester {studentData.rflRecord?.currentSemester || "N/A"}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{studentData.rflRecord?.gpa?.toString() || "N/A"}</div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Attendance Chart */}
                        <Card className="col-span-4 md:col-span-3">
                            <CardHeader>
                                <CardTitle>Attendance Overview</CardTitle>
                                <CardDescription>Last 30 Days</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {totalDays > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={attendanceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {attendanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No attendance data available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Marks */}
                        <Card className="col-span-4 lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Recent Marks</CardTitle>
                                <CardDescription>Latest Subject Tests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Exam</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentData.marks?.length > 0 ? (
                                            studentData.marks.map((mark: any) => (
                                                <TableRow key={mark.id}>
                                                    <TableCell>{format(new Date(mark.date), "MMM d, yyyy")}</TableCell>
                                                    <TableCell className="font-medium">{mark.examTitle}</TableCell>
                                                    <TableCell>{mark.subject?.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        {mark.marksObtained} / {mark.totalMarks}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                    No test marks found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        {/* Teacher Remarks & Feedback */}
                        <Card className="col-span-4 lg:col-span-7 mt-4 lg:mt-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquareText className="h-5 w-5" />
                                    Teacher Remarks & Feedback
                                </CardTitle>
                                <CardDescription>Behavioral attributes and academic observations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {teacherRemarks.length > 0 ? (
                                    <div className="space-y-4">
                                        {teacherRemarks.map((remark: any) => (
                                            <div key={remark.id} className="rounded-lg border bg-slate-50 p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-sm">
                                                            {remark.teacher?.email || "Teacher"}
                                                            {remark.subject && <span className="text-muted-foreground font-normal ml-2">({remark.subject})</span>}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {format(new Date(remark.createdAt), "PPP")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm mt-3 whitespace-pre-wrap">{remark.comments}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                                        No teacher remarks available at this time.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </TabsContent>

            {/* FINANCE TAB */}
            <TabsContent value="finance" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{isUniversity ? "Disbursement Ledger" : "Fee Vouchers"}</CardTitle>
                        <CardDescription>
                            {isUniversity
                                ? "Recent university fee disbursements handled by RFL."
                                : "Your recent fee voucher history."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isUniversity ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description / Purpose</TableHead>
                                        <TableHead className="text-right">Amount (PKR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.disbursements?.length > 0 ? (
                                        studentData.disbursements.map((d: any) => (
                                            <TableRow key={d.id}>
                                                <TableCell>{format(new Date(d.transactionDate), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{d.purpose}</div>
                                                    {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600">
                                                    Rs {Number(d.amount).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                No disbursements found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Fine</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.feeVouchers?.length > 0 ? (
                                        studentData.feeVouchers.map((v: any) => (
                                            <TableRow key={v.id}>
                                                <TableCell>{format(new Date(v.month), "MMMM yyyy")}</TableCell>
                                                <TableCell>Rs {Number(v.amount).toLocaleString()}</TableCell>
                                                <TableCell>Rs {Number(v.fineAmount || 0).toLocaleString()}</TableCell>
                                                <TableCell className="font-medium">
                                                    Rs {(Number(v.amount) + Number(v.fineAmount || 0)).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={v.status === "PAID" ? "default" : "destructive"}>
                                                        {v.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                                No fee vouchers found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
