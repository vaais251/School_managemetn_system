"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { markDailyAttendance } from "@/actions/teacher";
import { AttendanceStatus } from "@prisma/client";
import { toast } from "sonner";
import { CalendarIcon, CheckSquare, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeaveRemarkDialog } from "@/components/teacher/leave-remark-dialog";

const FormSchema = z.object({
    date: z.date(),
    attendance: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
    })),
});

interface Props {
    classId: string;
    students: { id: string; name: string; registrationId: string }[];
}

export function DailyAttendanceForm({ classId, students }: Props) {
    const [loading, setLoading] = useState(false);

    // Initialize form with default PRESENT for all students
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            date: new Date(),
            attendance: students.map(s => ({ studentId: s.id, status: AttendanceStatus.PRESENT })),
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "attendance",
    });

    const markAllPresent = () => {
        const resetData = students.map(s => ({
            studentId: s.id,
            status: AttendanceStatus.PRESENT
        }));
        replace(resetData);
        toast.success("All students marked as Present.");
    };

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const payload = {
            classId,
            date: data.date.toISOString(),
            attendance: data.attendance,
        };

        const fd = new FormData();
        fd.append("payload", JSON.stringify(payload));

        const result = await markDailyAttendance(null, fd);
        setLoading(false);

        if (result.success) toast.success(result.message);
        else toast.error(result.message);
    }

    if (students.length === 0) {
        return <p className="text-muted-foreground text-sm">No students enrolled in this class yet.</p>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={markAllPresent}>
                            <CheckSquare className="mr-2 h-4 w-4" /> Mark All Present
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save className="mr-2 h-4 w-4" /> Save Attendance
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Reg ID</TableHead>
                                <TableHead>Student Name</TableHead>
                                <TableHead className="w-[200px]">Status</TableHead>
                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => {
                                const student = students.find(s => s.id === field.studentId);
                                if (!student) return null;

                                return (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-mono text-xs">{student.registrationId}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`attendance.${index}.status`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className={cn(
                                                                    "h-8 text-xs",
                                                                    field.value === "PRESENT" && "bg-green-50 text-green-700 border-green-200",
                                                                    field.value === "ABSENT" && "bg-red-50 text-red-700 border-red-200",
                                                                    field.value === "LEAVE" && "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                                )}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="PRESENT">Present</SelectItem>
                                                                <SelectItem value="ABSENT">Absent</SelectItem>
                                                                <SelectItem value="LEAVE">Leave</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <LeaveRemarkDialog studentId={student.id} studentName={student.name} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </form>
        </Form>
    );
}
