import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">System Settings</h2>
                <p className="text-muted-foreground">Manage global application configurations and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Configuration</CardTitle>
                    <CardDescription>Update general settings for the MRT Enterprise ERP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="institutionName">Institution Name</Label>
                        <Input id="institutionName" defaultValue="MRT Enterprise Education" disabled />
                        <p className="text-xs text-muted-foreground">To change the registered institution name, contact technical support.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="academicYear">Current Academic Year</Label>
                        <Input id="academicYear" defaultValue="2026-2027" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Global Contact Email</Label>
                        <Input id="contactEmail" type="email" defaultValue="contact@mrt.edu" />
                    </div>

                    <Button className="mt-4">Save Configuration</Button>
                </CardContent>
            </Card>
        </div>
    );
}
