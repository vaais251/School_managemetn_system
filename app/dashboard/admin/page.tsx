import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExecutiveDashboardMetrics } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "./dashboard-charts";
import { Building2, Landmark, Wallet } from "lucide-react";

export default async function ExecutiveDashboard() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

    const metrics = await getExecutiveDashboardMetrics();

    const totalEnrolled = metrics.studentsVsCapacity.reduce((acc, curr) => acc + curr.enrolled, 0);
    const totalCapacity = metrics.studentsVsCapacity.reduce((acc, curr) => acc + curr.capacity, 0);

    const totalPaid = metrics.financialCollection.find(f => f.status === "PAID")?.total || 0;
    const totalUnpaid = metrics.financialCollection.find(f => f.status === "UNPAID")?.total || 0;

    const totalDisbursed = metrics.rflVolume.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Executive Command Center</h2>
                <p className="text-muted-foreground">High-level overview of Academic, Financial, and Trust operations.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrolled} / {totalCapacity}</div>
                        <p className="text-xs text-muted-foreground">Active students across all programs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Collection Rate</CardTitle>
                        <Landmark className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">${totalUnpaid.toLocaleString()} pending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">RFL Disbursed YTD</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">${totalDisbursed.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total funds allocated</p>
                    </CardContent>
                </Card>
            </div>

            <DashboardCharts metrics={metrics} />
        </div>
    );
}
