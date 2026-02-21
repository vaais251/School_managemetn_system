import { getTeacherDashboard } from "@/actions/teacher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceTable } from "@/components/teacher/AttendanceTable";
import { SubjectMarksWrapper } from "@/components/teacher/subject-marks-wrapper";
import { StudentDirectory } from "@/components/teacher/student-directory";
import { ClipboardList } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function TeacherDashboard() {
    const res = await getTeacherDashboard();

    if (!res.success || !res.assignments) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTitle>Error Loading Dashboard</AlertTitle>
                    <AlertDescription>{res.message || "Unknown error occurred."}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const { assignments } = res;

    // Separate assignments into Class Teacher (no subject) and Subject Teacher
    const classAssignments = assignments.filter((a: any) => !a.subjectId);
    const subjectAssignments = assignments.filter((a: any) => a.subjectId);

    if (assignments.length === 0) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Teacher Portal</h2>
                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>No Assignments Found</AlertTitle>
                    <AlertDescription>
                        You have not been assigned to any classes or subjects yet. Please contact the Section Head.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Fetch today's attendance for the class assignments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const classIds = classAssignments.map((a: any) => a.class.id);
    const todayAttendance = classIds.length > 0 ? await prisma.attendance.findMany({
        where: {
            date: today,
            student: { classId: { in: classIds } }
        },
        select: { studentId: true, status: true }
    }) : [];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Teacher Portal</h2>
            </div>

            <Tabs defaultValue="directory" className="space-y-4">
                <TabsList className="bg-slate-100 flex-wrap h-auto p-1">
                    {classAssignments.length > 0 && (
                        <TabsTrigger value="attendance" className="data-[state=active]:bg-white">
                            <Users className="h-4 w-4 mr-2" />
                            Daily Attendance
                        </TabsTrigger>
                    )}
                    {subjectAssignments.length > 0 && (
                        <TabsTrigger value="marks" className="data-[state=active]:bg-white">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Subject Marks
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="directory" className="data-[state=active]:bg-white">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Student Directory & Remarks
                    </TabsTrigger>
                </TabsList>

                {/* 
                  * CLASS TEACHER VIEW: Daily Attendance
                  */}
                <TabsContent value="attendance" className="space-y-4">
                    {classAssignments.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-1">
                            {classAssignments.map((assignment: any) => (
                                <Card key={assignment.id}>
                                    <CardHeader>
                                        <CardTitle>Class: {assignment.class.name}</CardTitle>
                                        <CardDescription>
                                            Manage daily attendance for your assigned homeroom class. ({assignment.class.studentProfiles.length} students)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AttendanceTable
                                            classId={assignment.class.id}
                                            students={assignment.class.studentProfiles}
                                            initialAttendance={todayAttendance}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* 
                  * SUBJECT TEACHER VIEW: Marks Upload
                  */}
                <TabsContent value="marks" className="space-y-4">
                    {subjectAssignments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Subject Marks</CardTitle>
                                <CardDescription>
                                    Upload marks for exams or quizzes across all your assigned subjects.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SubjectMarksWrapper assignments={subjectAssignments} />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* 
                  * STUDENT DIRECTORY VIEW: Remarks
                  */}
                <TabsContent value="directory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Directory & Remarks</CardTitle>
                            <CardDescription>
                                A consolidated list of all students from your assigned classes and subjects.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StudentDirectory assignments={assignments} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
