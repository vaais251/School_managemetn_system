"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { markDailyAttendance } from "@/actions/attendance";
import { AttendanceStatus } from "@prisma/client";
import { toast } from "sonner";
import { CalendarIcon, CheckSquare, Save, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LeaveRemarkDialog } from "@/components/teacher/leave-remark-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    initialAttendance: { studentId: string; status: AttendanceStatus }[];
}

export function AttendanceTable({ classId, students, initialAttendance }: Props) {
    const [loading, setLoading] = useState(false);

    // Initialize submitted dates with today if there's initial attendance
    const [submittedDates, setSubmittedDates] = useState<string[]>(
        initialAttendance.length > 0 ? [new Date().toDateString()] : []
    );

    // Initialize form, prioritizing existing records from the database
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            date: new Date(),
            attendance: students.map(s => {
                const existing = initialAttendance.find(a => a.studentId === s.id);
                return { studentId: s.id, status: existing ? existing.status : AttendanceStatus.PRESENT };
            }),
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "attendance",
    });

    const selectedDate = form.watch("date");
    const isAttendanceDone = selectedDate && submittedDates.includes(selectedDate.toDateString());

    const markAllPresent = () => {
        if (isAttendanceDone) return;
        const resetData = students.map(s => ({
            studentId: s.id,
            status: AttendanceStatus.PRESENT
        }));
        replace(resetData);
        toast.success("All students marked as Present.");
    };

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (isAttendanceDone) return;

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

        if (result.success) {
            toast.success(result.message);
            // Mark this date as submitted
            if (!submittedDates.includes(data.date.toDateString())) {
                setSubmittedDates(prev => [...prev, data.date.toDateString()]);
            }
        } else {
            toast.error(result.message);
        }
    }

    if (students.length === 0) {
        return <p className="text-muted-foreground text-sm">No students enrolled in this class yet.</p>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isAttendanceDone && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle>Attendance Completed</AlertTitle>
                        <AlertDescription>
                            Attendance for {format(selectedDate, "PPP")} has already been marked. You cannot modify it further.
                        </AlertDescription>
                    </Alert>
                )}

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
                        <Button type="button" variant="secondary" onClick={markAllPresent} disabled={isAttendanceDone || loading}>
                            <CheckSquare className="mr-2 h-4 w-4" /> Mark All Present
                        </Button>
                        <Button type="submit" disabled={isAttendanceDone || loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Attendance
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
                                    <TableRow key={field.id} className={isAttendanceDone ? "opacity-75 bg-slate-50" : ""}>
                                        <TableCell className="font-mono text-xs">{student.registrationId}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>
                                            <FormField
                                                control={form.control}
                                                name={`attendance.${index}.status`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                disabled={isAttendanceDone}
                                                                className="flex items-center gap-1 sm:gap-2"
                                                            >
                                                                <div className="flex items-center space-x-1">
                                                                    <RadioGroupItem value="PRESENT" id={`present-${index}`} className="peer sr-only" disabled={isAttendanceDone} />
                                                                    <Label
                                                                        htmlFor={`present-${index}`}
                                                                        className={cn(
                                                                            "rounded-md border-2 border-transparent bg-slate-100 px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                                                                            isAttendanceDone ? "cursor-not-allowed opacity-70" : "hover:bg-slate-200 cursor-pointer",
                                                                            "peer-data-[state=checked]:border-green-600 peer-data-[state=checked]:bg-green-50 peer-data-[state=checked]:text-green-700"
                                                                        )}
                                                                    >
                                                                        P<span className="hidden sm:inline">resent</span>
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <RadioGroupItem value="ABSENT" id={`absent-${index}`} className="peer sr-only" disabled={isAttendanceDone} />
                                                                    <Label
                                                                        htmlFor={`absent-${index}`}
                                                                        className={cn(
                                                                            "rounded-md border-2 border-transparent bg-slate-100 px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                                                                            isAttendanceDone ? "cursor-not-allowed opacity-70" : "hover:bg-slate-200 cursor-pointer",
                                                                            "peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50 peer-data-[state=checked]:text-red-700"
                                                                        )}
                                                                    >
                                                                        A<span className="hidden sm:inline">bsent</span>
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <RadioGroupItem value="LEAVE" id={`leave-${index}`} className="peer sr-only" disabled={isAttendanceDone} />
                                                                    <Label
                                                                        htmlFor={`leave-${index}`}
                                                                        className={cn(
                                                                            "rounded-md border-2 border-transparent bg-slate-100 px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                                                                            isAttendanceDone ? "cursor-not-allowed opacity-70" : "hover:bg-slate-200 cursor-pointer",
                                                                            "peer-data-[state=checked]:border-yellow-600 peer-data-[state=checked]:bg-yellow-50 peer-data-[state=checked]:text-yellow-700"
                                                                        )}
                                                                    >
                                                                        L<span className="hidden sm:inline">eave</span>
                                                                    </Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
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
