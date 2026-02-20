import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function StudentDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
        redirect("/dashboard");
    }

    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            enrollments: true,
            rflRecord: true,
            disbursements: {
                orderBy: { transactionDate: 'desc' }
            },
            feeVouchers: {
                orderBy: { month: 'desc' },
                take: 12
            }
        }
    });

    if (!studentProfile) {
        return <div className="p-8 text-center text-muted-foreground">Student Profile not found. Please contact administration.</div>;
    }

    const isRfl = studentProfile.enrollments.some(e => e.type === "RFL");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Student Portal</h2>
                <p className="text-muted-foreground">
                    Welcome back, {studentProfile.name}.
                </p>
            </div>

            <Tabs defaultValue={isRfl ? "rfl" : "fees"} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="fees">Fee Vouchers</TabsTrigger>
                    {isRfl && <TabsTrigger value="rfl">RFL Scholarship Ledger</TabsTrigger>}
                </TabsList>

                <TabsContent value="fees" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Fee Vouchers</CardTitle>
                            <CardDescription>Your monthly fee history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Fine</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentProfile.feeVouchers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No vouchers found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        studentProfile.feeVouchers.map((voucher) => (
                                            <TableRow key={voucher.id}>
                                                <TableCell className="font-medium">{format(voucher.month, "MMMM yyyy")}</TableCell>
                                                <TableCell>Rs. {Number(voucher.amount).toLocaleString()}</TableCell>
                                                <TableCell>Rs. {voucher.fineAmount ? Number(voucher.fineAmount).toLocaleString() : "0"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={voucher.status === "PAID" ? "default" : "destructive"}>
                                                        {voucher.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isRfl && (
                    <TabsContent value="rfl" className="space-y-4">
                        {studentProfile.rflRecord && (
                            <Card className="mb-4">
                                <CardHeader>
                                    <CardTitle>University Academic Profile</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">University</div>
                                        <div className="font-semibold">{studentProfile.rflRecord.universityName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Degree</div>
                                        <div className="font-semibold">{studentProfile.rflRecord.degree}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Semester</div>
                                        <div className="font-semibold">{studentProfile.rflRecord.currentSemester}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">GPA</div>
                                        <div className="font-semibold">{studentProfile.rflRecord.gpa ? Number(studentProfile.rflRecord.gpa).toFixed(2) : "N/A"}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Disbursement Ledger</CardTitle>
                                <CardDescription>History of funds provided by the MRT Trust.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount Received</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentProfile.disbursements.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">No disbursements recorded.</TableCell>
                                            </TableRow>
                                        ) : (
                                            studentProfile.disbursements.map((d) => (
                                                <TableRow key={d.id}>
                                                    <TableCell className="font-medium">{format(d.transactionDate, "dd MMM yyyy")}</TableCell>
                                                    <TableCell><Badge variant="outline">{d.purpose}</Badge></TableCell>
                                                    <TableCell className="text-muted-foreground">{d.description || "-"}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">Rs. {Number(d.amount).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
