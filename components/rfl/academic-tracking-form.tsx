"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateAcademicTracking } from "@/actions/rfl";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const FormSchema = z.object({
    studentId: z.string().uuid({ message: "Please select an RFL student." }),
    universityName: z.string().min(2, "University Name must be at least 2 characters."),
    degree: z.string().min(2, "Degree must be at least 2 characters."),
    currentSemester: z.coerce.number().min(1, "Must be at least Semester 1").max(12),
    gpa: z.coerce.number().min(0).max(4.0).optional(),
});

interface Props {
    students: any[]; // Using any to inherit massive payload from page easily
}

export function AcademicTrackingForm({ students }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            studentId: "",
            universityName: "",
            degree: "",
            currentSemester: 1,
            gpa: undefined,
        },
    });

    const handleStudentChange = (studentId: string) => {
        form.setValue("studentId", studentId);

        // Auto-fill existing records if available
        const student = students.find(s => s.id === studentId);
        if (student?.rflRecord) {
            form.setValue("universityName", student.rflRecord.universityName);
            form.setValue("degree", student.rflRecord.degree);
            form.setValue("currentSemester", student.rflRecord.currentSemester);
            if (student.rflRecord.gpa) {
                form.setValue("gpa", Number(student.rflRecord.gpa));
            }
        } else {
            form.setValue("universityName", "");
            form.setValue("degree", "");
            form.setValue("currentSemester", 1);
            form.setValue("gpa", undefined as any);
        }
    };

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("studentId", data.studentId);
        formData.append("universityName", data.universityName);
        formData.append("degree", data.degree);
        formData.append("currentSemester", data.currentSemester.toString());

        if (data.gpa) formData.append("gpa", data.gpa.toString());

        const result = await updateAcademicTracking({}, formData);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
                <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Student</FormLabel>
                            <Select onValueChange={handleStudentChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select RFL Student..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name} ({student.registrationId})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="universityName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>University Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. LUMS" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="degree"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Degree Program</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. BSCS" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="currentSemester"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Semester</FormLabel>
                                <FormControl>
                                    <Input type="number" min="1" max="12" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gpa"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cumulative GPA (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" max="4.0" step="0.01" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Academic Record
                </Button>
            </form>
        </Form>
    );
}
