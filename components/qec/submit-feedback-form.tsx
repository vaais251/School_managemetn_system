"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitFeedback } from "@/actions/qec";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Teacher {
    id: string;
    name: string;
    subject: string;
}

interface Props {
    surveyId: string;
    metrics: string[];
    teachers: Teacher[];
}

export function SubmitFeedbackForm({ surveyId, metrics, teachers }: Props) {
    const [loading, setLoading] = useState(false);

    // Dynamically create Zod schema shape based on metrics length
    const zBindings: any = {};
    metrics.forEach((m, idx) => {
        zBindings[`metric_${idx}`] = z.number().min(1).max(5);
    });

    const FormSchema = z.object({
        evaluateeId: z.string().uuid({ message: "Please select a teacher." }),
        comments: z.string().optional(),
        ...zBindings
    });

    const defaultVals: any = { evaluateeId: "", comments: "" };
    metrics.forEach((m, idx) => {
        defaultVals[`metric_${idx}`] = 3; // default to 3 stars
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultVals,
    });

    async function onSubmit(data: any) {
        setLoading(true);
        const formData = new FormData();
        formData.append("surveyId", surveyId);
        formData.append("evaluateeId", data.evaluateeId);
        if (data.comments) formData.append("comments", data.comments);

        // Bundle metric ratings into a single JSON object before sending
        const ratingsMap: Record<string, number> = {};
        metrics.forEach((m, idx) => {
            ratingsMap[m] = data[`metric_${idx}`];
        });

        formData.append("ratings", JSON.stringify(ratingsMap));

        const result = await submitFeedback({}, formData);

        if (result.success) {
            toast.success(result.message);
            // reset form to default values entirely to encourage doing another teacher if needed
            form.reset(defaultVals);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    const StarRating = ({ value }: { value: number }) => {
        return (
            <div className="flex space-x-1 mt-2 justify-end">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        )
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="evaluateeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teacher to Evaluate</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value as string}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your assigned teacher..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {teachers.length === 0 ? (
                                        <SelectItem value="none" disabled>No teachers assigned</SelectItem>
                                    ) : (
                                        teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name} ({t.subject})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-6 mt-6 pt-4 border-t border-dashed">
                    <h3 className="text-lg font-semibold text-slate-800">Rate the Following:</h3>
                    {metrics.map((metricName, index) => (
                        <FormField
                            key={index}
                            control={form.control}
                            name={`metric_${index}`}
                            render={({ field }) => (
                                <FormItem className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <FormLabel className="text-base text-slate-700 font-medium max-w-[70%]">{metricName}</FormLabel>
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-slate-900">{field.value as number}/5</span>
                                            <StarRating value={field.value as number} />
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Slider
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[field.value as number]}
                                            onValueChange={(vals) => field.onChange(vals[0])}
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>

                <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Additional Comments (Invisible to Teacher)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Write any additional qualitative feedback..."
                                    className="resize-none"
                                    {...field}
                                    value={field.value as string}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading} className="w-full h-12 text-md">
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Submit Anonymous Feedback
                </Button>
            </form>
        </Form>
    );
}
