import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { UserActionsDropdown } from "@/components/admin/user-actions-dropdown";

export default async function UsersManagementPage() {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            studentProfile: { select: { name: true } },
            teacherAssignments: { select: { id: true } }
        }
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">Master User Directory</h2>
                    <p className="text-slate-500 mt-1">Manage system access, roles, and administrative commands.</p>
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 mb-4 bg-slate-50/50 rounded-t-xl">
                    <CardTitle>System Accounts</CardTitle>
                    <CardDescription>Comprehensive listing of all registered users across the hierarchy.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    <div className="rounded-xl border border-slate-200/60 overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Account</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Created</th>
                                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">{user.studentProfile ? user.studentProfile.name : user.email}</div>
                                            <div className="text-xs text-muted-foreground">{user.studentProfile ? user.email : "Staff Member"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                                                {user.role.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={user.isActive ? "default" : "destructive"} className="shadow-none">
                                                {user.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <UserActionsDropdown user={{ id: user.id, email: user.email, role: user.role, isActive: user.isActive }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
