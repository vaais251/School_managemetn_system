import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisbursementForm } from "@/components/rfl/disbursement-form";
import { AcademicTrackingForm } from "@/components/rfl/academic-tracking-form";
import { Banknote, GraduationCap, Users } from "lucide-react";

export default async function RflDashboard() {
    const session = await auth();

    if (!session || (session.user.role !== "TRUST_MANAGER" && session.user.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    // Fetch RFL Students (RFL Program Enrollment)
    const rflStudents = await prisma.studentProfile.findMany({
        where: {
            enrollments: {
                some: { type: "RFL" }
            }
        },
        include: {
            rflRecord: true,
            disbursements: {
                orderBy: { transactionDate: 'desc' },
                take: 5
            }
        },
        orderBy: { name: 'asc' }
    });

    const totalDisbursed = rflStudents.reduce((acc, student) => {
        return acc + student.disbursements.reduce((sum, d) => sum + Number(d.amount), 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">RFL Trust Management</h2>
                <p className="text-muted-foreground">
                    Manage Roshni Foundation & Learning scholarships, track disbursements, and monitor university academics.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Scholars</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rflStudents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Funds Disbursed</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {totalDisbursed.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. University GPA</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(rflStudents.reduce((acc, s) => acc + (Number(s.rflRecord?.gpa) || 0), 0) / Math.max(rflStudents.filter(s => s.rflRecord?.gpa).length, 1)).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="disbursement" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="disbursement">Log Disbursement</TabsTrigger>
                    <TabsTrigger value="academics">Academic Tracking</TabsTrigger>
                </TabsList>

                <TabsContent value="disbursement" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Record Outgoing Payment</CardTitle>
                            <CardDescription>Log tuition, stipends, or hostel funds handed to an RFL scholar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DisbursementForm students={rflStudents} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="academics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Update University Academics</CardTitle>
                            <CardDescription>Track the ongoing progress of an RFL student in higher education.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AcademicTrackingForm students={rflStudents} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
