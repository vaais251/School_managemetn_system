import { getTeacherDashboard } from "@/actions/teacher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyAttendanceForm } from "@/components/teacher/daily-attendance-form";
import { UploadMarksForm } from "@/components/teacher/upload-marks-form";

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

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Teacher Portal</h2>
            </div>

            <Tabs defaultValue={classAssignments.length > 0 ? "attendance" : "marks"} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="attendance" disabled={classAssignments.length === 0}>
                        <Users className="h-4 w-4 mr-2" />
                        Daily Attendance
                    </TabsTrigger>
                    <TabsTrigger value="marks" disabled={subjectAssignments.length === 0}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Upload Marks
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
                                        <DailyAttendanceForm
                                            classId={assignment.class.id}
                                            students={assignment.class.studentProfiles}
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
                        <div className="grid gap-4 md:grid-cols-1">
                            {subjectAssignments.map((assignment: any) => (
                                <Card key={assignment.id}>
                                    <CardHeader>
                                        <CardTitle>{assignment.subject?.name} - {assignment.class.name}</CardTitle>
                                        <CardDescription>
                                            Upload marks for exams or quizzes. ({assignment.class.studentProfiles.length} students)
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <UploadMarksForm
                                            classId={assignment.class.id}
                                            subjectId={assignment.subjectId!}
                                            subjectName={assignment.subject?.name}
                                            students={assignment.class.studentProfiles}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
