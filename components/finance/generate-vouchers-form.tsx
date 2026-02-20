"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { generateBulkFeeVouchers } from "@/actions/finance";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FormSchema = z.object({
    classId: z.string().uuid({ message: "Please select a class." }),
    month: z.coerce.date(),
    fineAmount: z.number().min(0).default(0),
});

interface Props {
    classes: { id: string; name: string; feeStructure: any }[];
}

export function GenerateVouchersForm({ classes }: Props) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const form = useForm<any>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            classId: "",
            month: new Date(),
            fineAmount: 0,
        },
    });

    const watchClassId = form.watch("classId");
    const selectedClass = classes.find(c => c.id === watchClassId);
    const hasStructure = selectedClass?.feeStructure != null;

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (!hasStructure) {
            toast.error("Please define a Fee Structure for this class first.");
            return;
        }

        setLoading(true);
        setResult(null);

        const fd = new FormData();
        fd.append("classId", data.classId);
        // Force the date to the 1st of the selected month
        const firstOfMonth = new Date(data.month.getFullYear(), data.month.getMonth(), 1);
        fd.append("month", firstOfMonth.toISOString());
        fd.append("fineAmount", data.fineAmount.toString());

        const res = await generateBulkFeeVouchers(null, fd);
        setLoading(false);
        setResult(res);

        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {result && !result.success && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                )}

                {result && result.success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                )}

                <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {watchClassId && !hasStructure && (
                                    <span className="text-destructive font-semibold text-xs">
                                        Warning: Fee Structure not defined for this class.
                                    </span>
                                )}
                                {watchClassId && hasStructure && (
                                    <span className="text-green-600 text-xs">
                                        Fee Structure OK (Tuition: Rs. {selectedClass.feeStructure.tuitionFee}, Hostel: Rs. {selectedClass.feeStructure.hostelFee})
                                    </span>
                                )}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="month"
                        render={({ field }) => (
                            <FormItem className="flex flex-col mt-2">
                                <FormLabel>Billing Month</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                                {field.value ? format(field.value, "MMMM yyyy") : <span>Pick a month</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date("2020-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>Any date inside the target month.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fineAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Late Fine (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>Added to all vouchers if specified.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading || (watchClassId !== "" && !hasStructure)}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Bulk Vouchers
                </Button>
            </form>
        </Form>
    );
}
