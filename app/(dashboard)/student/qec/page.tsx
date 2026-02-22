import { getPendingSurveys } from "@/actions/student";
import StudentQecView from "@/components/student/StudentQecView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "QEC Feedback - MRT Enterprise ERP",
    description: "Submit your pending QEC evaluations.",
};

export default async function StudentQecPage() {
    const pendingSurveysRaw = await getPendingSurveys();
    const pendingSurveys = JSON.parse(JSON.stringify(pendingSurveysRaw));

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Pending Evaluations</h2>
            </div>
            <p className="text-muted-foreground">
                Please complete the following anonymous surveys for your assigned teachers.
            </p>
            <StudentQecView pendingSurveys={pendingSurveys} />
        </div>
    );
}
