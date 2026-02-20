import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: { query?: string; type?: string };
}) {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const { query, type } = searchParams;

    const whereClause: any = {};
    if (query) {
        whereClause.actor = { email: { contains: query, mode: "insensitive" } };
    }
    if (type && type !== "ALL") {
        whereClause.actionType = { contains: type, mode: "insensitive" };
    }

    const logs = await prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: "desc" },
        take: 100,
        include: {
            actor: {
                select: { email: true, role: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">System Audit Logs</h2>
                <p className="text-muted-foreground">Monitor security events and critical system mutations.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-end justify-between">
                    <div>
                        <CardTitle>Recent Activity Overview</CardTitle>
                        <CardDescription>Chronological log of system actions (limit 100 on initial view).</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Basic Server Forms via Tailwind/Shadcn forms would go here to power the 'searchParams' queries */}
                    <form className="flex gap-4 mb-6">
                        <div className="max-w-xs w-full">
                            <Input name="query" placeholder="Filter by actor email..." defaultValue={query || ""} />
                        </div>
                        <div className="w-[180px]">
                            <Select name="type" defaultValue={type || "ALL"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Action Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="REACTIVATE_USER">User Re-activations</SelectItem>
                                    <SelectItem value="DEACTIVATE_USER">User De-activations</SelectItem>
                                    <SelectItem value="CREATE_USER">User Creations</SelectItem>
                                    <SelectItem value="RESET_PASSWORD">Password Resets</SelectItem>
                                    <SelectItem value="CHANGE_ROLE">Role Mutations</SelectItem>
                                    <SelectItem value="PAYMENT">Financial Generation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" variant="secondary">Filter / Search</Button>
                        <Link href="/dashboard/admin/audit-logs">
                            <Button variant="ghost">Clear</Button>
                        </Link>
                    </form>

                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No audit logs matching this filter found.</p>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Timestamp</th>
                                        <th scope="col" className="px-6 py-3">Actor</th>
                                        <th scope="col" className="px-6 py-3">Action Type</th>
                                        <th scope="col" className="px-6 py-3">Target Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{log.actor.email}</div>
                                                <div className="text-xs text-muted-foreground">{log.actor.role}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {log.actionType}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                {log.targetId || "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
