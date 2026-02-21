"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaveRemarkDialog } from "@/components/teacher/leave-remark-dialog";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
    assignments: any[];
}

export function StudentDirectory({ assignments }: Props) {
    const [searchTerm, setSearchTerm] = useState("");

    // Extract a unique list of students from all assignments
    const students = useMemo(() => {
        const studentMap = new Map();

        assignments.forEach((assignment) => {
            assignment.class.studentProfiles.forEach((student: any) => {
                if (!studentMap.has(student.id)) {
                    studentMap.set(student.id, {
                        ...student,
                        classes: new Set([assignment.class.name]),
                        subjects: assignment.subjectId ? new Set([assignment.subject.name]) : new Set(),
                    });
                } else {
                    const existing = studentMap.get(student.id);
                    existing.classes.add(assignment.class.name);
                    if (assignment.subjectId) {
                        existing.subjects.add(assignment.subject.name);
                    }
                }
            });
        });

        return Array.from(studentMap.values()).map(s => ({
            ...s,
            classes: Array.from(s.classes),
            subjects: Array.from(s.subjects),
        }));
    }, [assignments]);

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.registrationId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or registration ID..."
                    className="pl-8 max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Reg ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Class Context</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-mono text-xs">{student.registrationId}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {student.classes.map((c: string) => (
                                                <Badge key={c} variant="secondary" className="text-xs">
                                                    {c}
                                                </Badge>
                                            ))}
                                            {student.subjects.map((s: string) => (
                                                <Badge key={s} variant="outline" className="text-xs">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <LeaveRemarkDialog studentId={student.id} studentName={student.name} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No students found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
