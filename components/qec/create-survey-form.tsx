"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createSurvey } from "@/actions/qec";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";

// The schema must match the server expectations
const FormSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    description: z.string().optional(),
    metrics: z.array(z.object({ value: z.string().min(2, "Metric name is too short") })).min(1, "Add at least one metric."),
});

export function CreateSurveyForm() {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            title: "",
            description: "",
            metrics: [{ value: "Teacher's Knowledge" }, { value: "Punctuality" }, { value: "Communication Skills" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "metrics",
        control: form.control,
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("title", data.title);
        if (data.description) formData.append("description", data.description);

        // Append array fields for FormData
        data.metrics.forEach(m => {
            formData.append("metrics[]", m.value);
        });

        const result = await createSurvey({}, formData);

        if (result.success) {
            toast.success(result.message);
            form.reset({
                title: "",
                description: "",
                metrics: [{ value: "Teacher's Knowledge" }, { value: "Punctuality" }, { value: "Communication Skills" }]
            });
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Survey Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Mid-Term Faculty Review 2026" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Instructions for the students..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel>Evaluation Metrics</FormLabel>
                    <div className="text-sm text-muted-foreground mb-4">
                        Define the areas students will rate out of 5 stars.
                    </div>
                    {fields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`metrics.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="flex items-center space-x-2">
                                            <Input {...field} />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => append({ value: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Metric
                    </Button>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Publish Survey
                </Button>
            </form>
        </Form>
    );
}
