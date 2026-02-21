import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AcademicSetupForms } from "@/components/academics/academic-setup-forms";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AcademicsPage() {
    const session = await auth();
    // Hard server-side protection to prevent teachers or students from accessing setup
    if (!session || ["TEACHER", "STUDENT"].includes(session.user.role)) {
        redirect("/dashboard");
    }

    const classes = await prisma.class.findMany();
    const subjects = await prisma.subject.findMany();

    // Fetch teachers for the assignment dropdown
    const teachers = await prisma.user.findMany({
        where: { role: "TEACHER" },
        select: { id: true, email: true } // Name will be pulled when user model extended, use email for now if name is null
    });

    const assignments = await prisma.teacherAssignment.findMany({
        include: {
            teacher: true,
            class: true,
            subject: true,
        }
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Academic Setup</h2>
                <AcademicSetupForms classes={classes} subjects={subjects} teachers={teachers} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Teacher Assignments Matrix</CardTitle>
                        <CardDescription>
                            Overview of all assigned teachers (Class Teachers & Subject Teachers)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Role Type</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Subject</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No assignments found.</TableCell>
                                    </TableRow>
                                ) : (
                                    assignments.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            {/* Assuming name exists eventually. Fallback to extracting from email. */}
                                            <TableCell className="font-medium">{assignment.teacher.email}</TableCell>
                                            <TableCell>
                                                {assignment.subjectId
                                                    ? <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Subject Teacher</span>
                                                    : <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Class Teacher</span>}
                                            </TableCell>
                                            <TableCell>{assignment.class.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{assignment.subject?.name || "N/A"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Supporting Data Cards */}
                <Card className="col-span-1 md:col-span-3 mt-4">
                    <CardHeader>
                        <CardTitle>Classes ({classes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5">
                            {classes.map(c => <li key={c.id} className="text-sm">{c.name}</li>)}
                            {classes.length === 0 && <span className="text-xs text-muted-foreground">No classes created.</span>}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-4 mt-4">
                    <CardHeader>
                        <CardTitle>Subjects ({subjects.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(s => <span key={s.id} className="text-xs bg-slate-100 border px-2 py-1 rounded">{s.name}</span>)}
                            {subjects.length === 0 && <span className="text-xs text-muted-foreground">No subjects created.</span>}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
