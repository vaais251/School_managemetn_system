import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluationForm } from "@/components/hr/evaluation-form";
import { Users, FileSignature, BarChart4 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { HRTrendChart } from "@/components/hr/trend-chart";

export default async function HRDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const staffList = await prisma.user.findMany({
        where: {
            role: { in: ["TEACHER", "TRUST_MANAGER", "SECTION_HEAD", "FEE_DEPT", "ADMISSION_DEPT", "EXAM_DEPT"] },
            isActive: true
        },
        select: { id: true, email: true, role: true }
    });

    // @ts-ignore
    const evaluations = await prisma.staffEvaluation.findMany({
        include: {
            evaluatee: { select: { email: true, role: true } },
            evaluator: { select: { email: true } }
        },
        orderBy: { date: 'desc' },
        take: 50
    });

    const avgOverallScore = evaluations.length > 0
        ? (evaluations.reduce((acc: any, ev: any) => acc + Number(ev.averageScore), 0) / evaluations.length).toFixed(2)
        : "N/A";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">HR Staff Evaluation</h2>
                <p className="text-muted-foreground">
                    Quarterly review metrics, 5-star rating submissions, and historical staff performance indicators.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eligible Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{staffList.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
                        <FileSignature className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{evaluations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Avg. Rating</CardTitle>
                        <BarChart4 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{avgOverallScore} / 5.0</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Performance Trends</TabsTrigger>
                    <TabsTrigger value="evaluate">Submit Evaluation</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Historical Trend (All Staff)</CardTitle>
                            <CardDescription>Average performance score over time based on 5-star metrics.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2 h-[400px]">
                            <HRTrendChart data={evaluations.map((e: any) => ({
                                date: format(new Date(e.date), "MMM dd, yyyy"),
                                score: Number(e.averageScore),
                                staff: e.evaluatee.email
                            }))} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="evaluate" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Performance Review</CardTitle>
                            <CardDescription>Rate a staff member across standardized metrics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EvaluationForm staffList={staffList as any} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Evaluations</CardTitle>
                            <CardDescription>Log of previously submitted reviews.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {evaluations.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No evaluations recorded yet.</p>
                                ) : (
                                    evaluations.map((ev: any) => (
                                        <div key={ev.id} className="flex justify-between items-center bg-muted/20 p-4 border rounded-lg">
                                            <div>
                                                <p className="font-semibold">{ev.evaluatee.email} <Badge variant="secondary" className="ml-2">{ev.evaluatee.role}</Badge></p>
                                                <p className="text-sm text-muted-foreground">Evaluated by {ev.evaluator?.email} on {format(ev.date, "PP")}</p>
                                                {ev.comments && <p className="text-sm mt-2 italic">"{ev.comments}"</p>}
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-500">
                                                    {Number(ev.averageScore).toFixed(1)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Avg Score</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
