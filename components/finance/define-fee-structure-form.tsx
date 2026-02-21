"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { defineFeeStructure } from "@/actions/finance";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FormSchema = z.object({
    classId: z.string().uuid({ message: "Please select a class." }),
    tuitionFee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
    hostelFee: z.coerce.number().min(0, { message: "Fee cannot be negative" }),
});

interface Props {
    classes: { id: string; name: string; feeStructure: any }[];
}

export function DefineFeeStructureForm({ classes }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<any>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            classId: "",
            tuitionFee: 0,
            hostelFee: 0,
        },
    });

    // Auto-fill form side effect when class changes
    const watchClassId = form.watch("classId");

    // Using onValueChange to update other fields visually
    const handleClassChange = (value: string) => {
        form.setValue("classId", value);
        const selectedClass = classes.find(c => c.id === value);
        if (selectedClass && selectedClass.feeStructure) {
            form.setValue("tuitionFee", Number(selectedClass.feeStructure.tuitionFee));
            form.setValue("hostelFee", Number(selectedClass.feeStructure.hostelFee));
        } else {
            form.setValue("tuitionFee", 0);
            form.setValue("hostelFee", 0);
        }
    };

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const fd = new FormData();
        fd.append("classId", data.classId);
        fd.append("tuitionFee", data.tuitionFee.toString());
        fd.append("hostelFee", data.hostelFee.toString());

        const result = await defineFeeStructure(null, fd);
        setLoading(false);

        if (result.success) toast.success(result.message);
        else toast.error(result.message);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Grade / Class</FormLabel>
                            <Select onValueChange={handleClassChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} {c.feeStructure ? "✓" : ""}
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
                        name="tuitionFee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Tuition Fee</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="hostelFee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Hostel Fee</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    Save Fee Structure
                </Button>
            </form>
        </Form>
    );
}
