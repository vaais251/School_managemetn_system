"use client";

import { useActionState, useEffect } from "react";
import { setStudentAcademicPerformance } from "@/actions/trust";
import { toast } from "sonner";
import { Loader2, Save, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";

interface Mark {
    id: string;
    examTitle: string;
    marksObtained: number | string;
    totalMarks: number | string;
    date: Date | string;
    subject: { id: string; name: string };
}

interface Subject {
    id: string;
    name: string;
}

interface Props {
    studentId: string;
    studentName: string;
    subjects: Subject[];
    existingMarks: Mark[];
}

export function SetPerformanceForm({ studentId, studentName, subjects, existingMarks }: Props) {
    const [state, formAction, isPending] = useActionState(setStudentAcademicPerformance, null);
    const [subjectId, setSubjectId] = useState("");

    useEffect(() => {
        if (!state) return;
        if (state.success) {
            toast.success(state.message);
        } else {
            toast.error(state.message);
        }
    }, [state]);

    const getGradeColor = (obtained: number, total: number) => {
        const pct = (obtained / total) * 100;
        if (pct >= 80) return "text-green-600";
        if (pct >= 60) return "text-blue-600";
        if (pct >= 40) return "text-amber-600";
        return "text-red-600";
    };

    const getGradeLetter = (obtained: number, total: number) => {
        const pct = (obtained / total) * 100;
        if (pct >= 90) return "A+";
        if (pct >= 80) return "A";
        if (pct >= 70) return "B";
        if (pct >= 60) return "C";
        if (pct >= 50) return "D";
        return "F";
    };

    return (
        <div className="space-y-6">
            {/* Add / Update Mark Form */}
            <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Set Academic Performance
                    </CardTitle>
                    <CardDescription>
                        Add or update an exam mark for{" "}
                        <span className="font-semibold text-slate-700">{studentName}</span>. If the same
                        exam already exists for the selected subject, it will be overwritten.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {/* Hidden student ID */}
                        <input type="hidden" name="studentId" value={studentId} />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subjectId">Subject</Label>
                                <Select
                                    name="subjectId"
                                    value={subjectId}
                                    onValueChange={setSubjectId}
                                    required
                                >
                                    <SelectTrigger id="subjectId">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Exam Title */}
                            <div className="space-y-2">
                                <Label htmlFor="examTitle">Exam / Assessment Title</Label>
                                <Input
                                    id="examTitle"
                                    name="examTitle"
                                    placeholder="e.g. Midterm 2026"
                                    required
                                    minLength={2}
                                />
                            </div>

                            {/* Marks Obtained */}
                            <div className="space-y-2">
                                <Label htmlFor="marksObtained">Marks Obtained</Label>
                                <Input
                                    id="marksObtained"
                                    name="marksObtained"
                                    type="number"
                                    min={0}
                                    defaultValue={0}
                                    required
                                />
                            </div>

                            {/* Total Marks */}
                            <div className="space-y-2">
                                <Label htmlFor="totalMarks">Total Marks</Label>
                                <Input
                                    id="totalMarks"
                                    name="totalMarks"
                                    type="number"
                                    min={1}
                                    defaultValue={100}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error message */}
                        {state && !state.success && (
                            <p className="text-sm text-red-600 font-medium">{state.message}</p>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending || !subjectId} className="min-w-[140px]">
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Performance
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Existing Marks History */}
            <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                    Performance History
                </h3>
                {existingMarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic px-1">
                        No academic records found for this student yet.
                    </p>
                ) : (
                    <div className="rounded-md border overflow-x-auto bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Exam</th>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {existingMarks.map((m) => {
                                    const obtained = Number(m.marksObtained);
                                    const total = Number(m.totalMarks);
                                    const pct = ((obtained / total) * 100).toFixed(1);
                                    const grade = getGradeLetter(obtained, total);
                                    const color = getGradeColor(obtained, total);
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {format(new Date(m.date), "MMM dd, yyyy")}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {m.examTitle}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{m.subject.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${color}`}>{obtained}</span>
                                                <span className="text-muted-foreground text-xs"> / {total}</span>
                                                <div className="text-[10px] text-muted-foreground">{pct}%</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    className={`text-xs font-bold ${grade === "F"
                                                            ? "bg-red-100 text-red-700 border-red-200"
                                                            : grade === "A+" || grade === "A"
                                                                ? "bg-green-100 text-green-700 border-green-200"
                                                                : "bg-blue-100 text-blue-700 border-blue-200"
                                                        }`}
                                                    variant="outline"
                                                >
                                                    {grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
