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
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-800">System Audit Logs</h2>
                    <p className="text-slate-500 mt-1">Monitor security events and critical system mutations.</p>
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 mb-4 bg-slate-50/50 rounded-t-xl">
                    <CardTitle>Recent Activity Overview</CardTitle>
                    <CardDescription>Chronological log of system actions (limit 100 on initial view).</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">

                    <form className="flex flex-wrap gap-4 mb-6 px-4 py-2 sm:px-0 sm:py-0">
                        <div className="w-full sm:max-w-xs">
                            <Input name="query" placeholder="Filter by actor email..." defaultValue={query || ""} className="bg-white" />
                        </div>
                        <div className="w-full sm:w-[180px]">
                            <Select name="type" defaultValue={type || "ALL"}>
                                <SelectTrigger className="bg-white">
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
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Filter</Button>
                        <Link href="/dashboard/admin/audit-logs">
                            <Button variant="outline" className="bg-white">Clear</Button>
                        </Link>
                    </form>

                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No audit logs matching this filter found.</p>
                    ) : (
                        <div className="rounded-xl border border-slate-200/60 overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-semibold">Timestamp</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Actor</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Action Type</th>
                                        <th scope="col" className="px-6 py-3 font-semibold">Target Reference</th>
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
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-xs">
                                                    {log.actionType}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
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
