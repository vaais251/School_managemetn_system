import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardOverview() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const role = session.user.role;

    // Optional: Auto-redirect based on role if they shouldn't see a generic overview
    if (role === "SUPER_ADMIN") redirect("/dashboard/admin");
    if (role === "STUDENT") redirect("/dashboard/student");
    if (role === "TEACHER") redirect("/dashboard/teacher");
    if (role === "HR") redirect("/dashboard/hr");
    if (role === "TRUST_MANAGER") redirect("/dashboard/rfl");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Welcome to MRT Enterprise ERP</h2>
                <p className="text-muted-foreground">Select a module from the sidebar to begin.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Session Information</CardTitle>
                        <CardDescription>You are logged in as {session.user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium p-2 bg-slate-100 rounded">
                            Role: {role}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
