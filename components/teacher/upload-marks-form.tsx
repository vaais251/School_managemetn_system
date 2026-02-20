"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadMarks } from "@/actions/teacher";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FormSchema = z.object({
    examTitle: z.string().min(2, "Exam title is required."),
    totalMarks: z.number().min(1, "Total marks must be > 0"),
    marks: z.array(z.object({
        studentId: z.string().uuid(),
        marksObtained: z.number().min(0),
    })),
});

interface Props {
    classId: string;
    subjectId: string;
    students: { id: string; name: string; registrationId: string }[];
}

export function UploadMarksForm({ classId, subjectId, students }: Props) {
    const [loading, setLoading] = useState(false);

    // Initialize empty form mapping to all students
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            examTitle: "",
            totalMarks: 100,
            marks: students.map(s => ({ studentId: s.id, marksObtained: 0 })),
        } as any,
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "marks",
    });

    const watchTotalMarks = form.watch("totalMarks");

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        // Front-end check to ensure marksObtained <= totalMarks
        const hasInvalidMarks = data.marks.some(m => m.marksObtained > data.totalMarks);
        if (hasInvalidMarks) {
            toast.error(`Marks obtained cannot exceed total marks (${data.totalMarks}).`);
            return;
        }

        setLoading(true);

        const payload = {
            classId,
            subjectId,
            examTitle: data.examTitle,
            totalMarks: data.totalMarks,
            marks: data.marks,
        };

        const fd = new FormData();
        fd.append("payload", JSON.stringify(payload));

        const result = await uploadMarks(null, fd);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            // Optionally clear the exam title to ready for the next one, but keep marks around.
            form.setValue("examTitle", "");
        } else {
            toast.error(result.message);
        }
    }

    if (students.length === 0) {
        return <p className="text-muted-foreground text-sm">No students enrolled in this class yet.</p>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 bg-slate-50 rounded-md">
                    <FormField
                        control={form.control}
                        name="examTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exam / Quiz Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Midterm Exam 1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="totalMarks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Maximum Marks</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Reg ID</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="w-[150px] text-right">Marks Obtained</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field: any, index: number) => {
                                const student = students.find(s => s.id === field.studentId);
                                if (!student) return null;

                                return (
                                    <TableRow key={field.id} className="hover:bg-transparent">
                                        <TableCell className="font-mono text-xs">{student.registrationId}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell className="text-right">
                                            <FormField
                                                control={form.control}
                                                name={`marks.${index}.marksObtained` as any}
                                                render={({ field }) => (
                                                    <FormItem className="mb-0">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                className="h-8 text-right font-mono"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Marks
                    </Button>
                </div>
            </form>
        </Form>
    );
}
