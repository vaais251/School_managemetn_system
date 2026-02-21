"use client";

import { useState } from "react";
import { UploadMarksForm } from "@/components/teacher/upload-marks-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
    assignments: any[];
}

export function SubjectMarksWrapper({ assignments }: Props) {
    const [selectedId, setSelectedId] = useState<string>(assignments[0]?.id || "");

    if (assignments.length === 0) {
        return <p className="text-muted-foreground text-sm">No subjects assigned.</p>;
    }

    const selectedAssignment = assignments.find((a) => a.id === selectedId) || assignments[0];

    return (
        <div className="space-y-6">
            {assignments.length > 1 && (
                <div className="flex flex-col space-y-2 sm:max-w-xs">
                    <Label htmlFor="subject-select">Select Subject / Class</Label>
                    <Select value={selectedId} onValueChange={setSelectedId}>
                        <SelectTrigger id="subject-select">
                            <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {assignments.map((assignment) => (
                                <SelectItem key={assignment.id} value={assignment.id}>
                                    {assignment.subject?.name} - {assignment.class.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <UploadMarksForm
                key={selectedAssignment.id} // Re-mount the form when assignment changes
                classId={selectedAssignment.class.id}
                subjectId={selectedAssignment.subjectId!}
                subjectName={selectedAssignment.subject?.name}
                students={selectedAssignment.class.studentProfiles}
            />
        </div>
    );
}
