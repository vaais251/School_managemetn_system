"use client";

import { useState } from "react";
import { format } from "date-fns";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addDisbursement } from "@/actions/rfl";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const FormSchema = z.object({
    studentId: z.string().uuid({ message: "Please select an RFL student." }),
    amount: z.coerce.number().min(0.01),
    purpose: z.string().min(1, "Purpose is required"),
    transactionDate: z.string().min(1, "Date is required"),
    description: z.string().optional(),
});

interface Props {
    students: { id: string; name: string; registrationId: string }[];
}

export function DisbursementForm({ students }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            studentId: "",
            amount: 0,
            purpose: "",
            transactionDate: format(new Date(), "yyyy-MM-dd"), // Setting default to today as HTML string
            description: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("studentId", data.studentId);
        formData.append("amount", data.amount.toString());
        formData.append("purpose", data.purpose);
        formData.append("transactionDate", new Date(data.transactionDate).toISOString());

        if (data.description) formData.append("description", data.description);

        const result = await addDisbursement({}, formData);

        if (result.success) {
            toast.success(result.message);
            form.reset();
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (Rs.)</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="transactionDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Purpose</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select purpose..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="TUITION">Tuition Fee</SelectItem>
                                    <SelectItem value="HOSTEL">Hostel Fee</SelectItem>
                                    <SelectItem value="STIPEND">Stipend</SelectItem>
                                    <SelectItem value="OTHER">Other Expenses</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Additional details about this disbursement..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Disbursement
                </Button>
            </form>
        </Form>
    );
}
