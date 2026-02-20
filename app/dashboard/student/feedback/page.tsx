import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitFeedbackForm } from "@/components/qec/submit-feedback-form";

export default async function StudentFeedbackPage() {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
        redirect("/dashboard");
    }

    // 1. Get Student Profile to find their Class and assigned Teachers
    // @ts-ignore
    const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            class: {
                include: {
                    teacherAssignments: {
                        include: {
                            teacher: { select: { id: true, email: true } },
                            subject: { select: { id: true, name: true } }
                        }
                    }
                }
            }
        }
    });

    if (!studentProfile || !studentProfile.class) {
        return <div className="p-8 text-center text-muted-foreground">You are not currently assigned to a class.</div>;
    }

    // 2. Find Active Surveys
    // @ts-ignore
    const surveys = await prisma.survey.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
            // Include feedbacks to see if the student already submitted? 
            // WAIT - Feedback is anonymous, we intentionally don't store studentId.
            // Hence, we can't completely prevent duplicate submissions natively 
            // without a separate tracking table (e.g. SurveySubmission { surveyId, studentId }).
            // For this phase, we'll just allow them to submit.
        }
    });

    const assignedTeachers = (studentProfile as any).class.teacherAssignments.map((ta: any) => ({
        id: ta.teacher.id,
        name: ta.teacher.email,
        subject: ta.subject?.name || "Class Teacher"
    }));

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Teacher Evaluation</h2>
                <p className="text-muted-foreground">
                    Provide anonymous feedback for your assigned teachers based on the active QEC surveys.
                </p>
            </div>

            {surveys.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Surveys</CardTitle>
                        <CardDescription>There are currently no evaluation surveys requiring your feedback.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="space-y-8">
                    {surveys.map((survey: any) => (
                        <Card key={survey.id} className="border-blue-200 shadow-sm">
                            <CardHeader className="bg-blue-50/50 rounded-t-lg border-b">
                                <CardTitle className="text-blue-800">{survey.title}</CardTitle>
                                {survey.description && <CardDescription>{survey.description}</CardDescription>}
                            </CardHeader>
                            <CardContent className="pt-6">
                                <SubmitFeedbackForm
                                    surveyId={survey.id}
                                    metrics={survey.metrics}
                                    teachers={assignedTeachers}
                                />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
