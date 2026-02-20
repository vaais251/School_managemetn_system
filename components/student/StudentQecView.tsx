"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitQECFeedback } from "@/actions/student";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Base schema assuming we build a record of string -> number
const formSchema = z.object({
    ratings: z.any(),
    comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function SurveyCard({
    surveyItem,
    onComplete,
}: {
    surveyItem: any;
    onComplete: (id: string) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ratings: {} as Record<string, number>,
            comments: "",
        },
    });

    const { survey, teacherId, teacherEmail, subjectName } = surveyItem;
    const metrics = survey.metrics || [];

    async function onSubmit(data: FormValues) {
        // Validate all metrics are rated
        const unrated = metrics.filter((m: string) => !data.ratings[m]);
        if (unrated.length > 0) {
            toast.error(`Please rate all metrics. Missing: ${unrated.join(", ")}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await submitQECFeedback({
                surveyId: survey.id,
                evaluateeId: teacherId,
                ratings: data.ratings,
                comments: data.comments,
            });
            toast.success("Feedback submitted successfully. Thank you!");
            onComplete(`${survey.id}-${teacherId}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit feedback");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
                <CardDescription>
                    Evaluating: <span className="font-semibold text-foreground">{teacherEmail}</span> for{" "}
                    <span className="font-semibold text-foreground">{subjectName}</span>
                    {survey.description && <div className="mt-2 text-sm italic">{survey.description}</div>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            {metrics.map((metric: string) => (
                                <FormField
                                    key={metric}
                                    control={form.control}
                                    name={`ratings.${metric}` as any}
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-base">{metric}</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(val: string) => field.onChange(val)}
                                                    value={field.value?.toString() || ""}
                                                    className="flex space-x-4"
                                                >
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <FormItem key={rating} className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={rating.toString()} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{rating}</FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
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
                                    <FormLabel>Additional Comments (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Any other feedback?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting
                                </>
                            ) : (
                                "Submit Anonymous Feedback"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function StudentQecView({ pendingSurveys }: { pendingSurveys: any[] }) {
    const [surveys, setSurveys] = useState(pendingSurveys);

    const handleComplete = (key: string) => {
        setSurveys((prev) =>
            prev.filter((s) => `${s.survey.id}-${s.teacherId}` !== key)
        );
    };

    if (surveys.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>All caught up!</CardTitle>
                    <CardDescription>You have no pending surveys to complete.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="max-w-3xl space-y-8">
            {surveys.map((surveyItem) => (
                <SurveyCard
                    key={`${surveyItem.survey.id}-${surveyItem.teacherId}`}
                    surveyItem={surveyItem}
                    onComplete={handleComplete}
                />
            ))}
        </div>
    );
}
