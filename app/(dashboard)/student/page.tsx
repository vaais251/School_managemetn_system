import { getStudentDashboardData, getPendingSurveys } from "@/actions/student";
import { getRemarksForStudent } from "@/actions/feedback";
import StudentDashboardView from "@/components/student/StudentDashboardView";
import { Metadata } from "next";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Student Portal - MRT Enterprise ERP",
    description: "View your academic and financial details.",
};

export default async function StudentDashboardPage() {
    const session = await auth();
    const studentDataRaw = await getStudentDashboardData();
    const studentData = JSON.parse(JSON.stringify(studentDataRaw));

    const pendingSurveysRaw = await getPendingSurveys();
    const pendingSurveys = JSON.parse(JSON.stringify(pendingSurveysRaw));

    const teacherRemarksRaw = session?.user?.id ? await getRemarksForStudent(session.user.id) : [];
    const teacherRemarks = JSON.parse(JSON.stringify(teacherRemarksRaw));

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Student Portal</h2>
            </div>

            {pendingSurveys.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                    <ClipboardCheck className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-semibold mb-1">
                        Pending QEC Evaluations
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-3">
                        <span>You have {pendingSurveys.length} pending survey(s) to complete for your teachers.</span>
                        <Button asChild size="sm" variant="outline" className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
                            <Link href="/student/qec">Complete Now</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <StudentDashboardView studentData={studentData} teacherRemarks={teacherRemarks} />
        </div>
    );
}
