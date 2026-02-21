import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default async function StudentsDirectoryPage() {
    const session = await auth();
    const authorizedRoles = ["SUPER_ADMIN", "TRUST_MANAGER", "SECTION_HEAD", "ADMISSION_DEPT"];

    if (!session || !authorizedRoles.includes(session.user.role)) {
        if (session?.user?.role === "TEACHER") {
            redirect("/dashboard/teacher");
        }
        redirect("/dashboard");
    }

    const students = await prisma.studentProfile.findMany({
        orderBy: { name: 'asc' },
        include: {
            class: true,
            user: { select: { email: true, isActive: true } },
            enrollments: true,
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Global Student Directory</h2>
                <p className="text-muted-foreground">Comprehensive listing of all enrolled students across the institution.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>View all student records and their current academic standing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Registration ID</th>
                                    <th scope="col" className="px-6 py-3">Student Info</th>
                                    <th scope="col" className="px-6 py-3">Class / Program</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                                            {student.registrationId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">{student.name}</div>
                                            <div className="text-xs text-muted-foreground">{student.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {student.class ? (
                                                    <Badge variant="outline" className="w-fit">{student.class.name}</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Unassigned</span>
                                                )}
                                                {student.enrollments.map(e => (
                                                    <span key={e.id} className="text-xs text-slate-500">{e.type} ({e.status})</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={student.user?.isActive ? "default" : "destructive"}>
                                                {student.user?.isActive ? "Active Account" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/dashboard/admin/student/${student.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            No students found in the system.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
