import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateSurveyForm } from "@/components/qec/create-survey-form";
import { ClipboardList, MessageSquareText, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function QECDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    // @ts-ignore
    const surveys = await prisma.survey.findMany({
        include: {
            feedbacks: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const totalFeedbacks = surveys.reduce((acc: any, s: any) => acc + s.feedbacks.length, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Quality Enhancement Cell (QEC)</h2>
                <p className="text-muted-foreground">
                    Create student feedback surveys and review anonymous aggregated teacher ratings.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{surveys.filter((s: any) => s.isActive).length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedbacks Submitted</CardTitle>
                        <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFeedbacks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {/* Mock engagement rate since we don't track total views vs submits */}
                            {totalFeedbacks > 0 ? "High" : "Low"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="surveys" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="surveys">Active Surveys</TabsTrigger>
                    <TabsTrigger value="create">Survey Builder</TabsTrigger>
                    <TabsTrigger value="reports">Aggregated Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="surveys" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Survey Management</CardTitle>
                            <CardDescription>All surveys currently collecting anonymous feedback.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {surveys.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No surveys created yet.</p>
                                ) : (
                                    surveys.map((s: any) => (
                                        <div key={s.id} className="flex justify-between items-center bg-muted/20 p-4 border rounded-lg">
                                            <div>
                                                <p className="font-semibold">{s.title}</p>
                                                <p className="text-sm text-muted-foreground">{s.description}</p>
                                                <div className="mt-2 text-xs text-muted-foreground space-x-2">
                                                    <span>Created {format(s.createdAt, "PP")}</span>
                                                    <span>•</span>
                                                    <span>{s.metrics.length} Metrics</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <Badge variant={s.isActive ? "default" : "secondary"}>
                                                    {s.isActive ? "ACTIVE" : "CLOSED"}
                                                </Badge>
                                                <div className="text-sm font-medium">{s.feedbacks.length} Responses</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="create" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Survey</CardTitle>
                            <CardDescription>Define custom metrics (e.g., 'Teaching Methodology', 'Punctuality') for students to rate from 1 to 5 stars.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CreateSurveyForm />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Feedback Aggregation (WIP)</CardTitle>
                            <CardDescription>Principal View: Global teacher averages based on anonymous submissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Aggregated reporting tables will populate here as students complete the active Surveys.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
