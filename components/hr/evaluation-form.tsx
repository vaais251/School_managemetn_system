"use client";

import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitEvaluation } from "@/actions/hr";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const FormSchema = z.object({
    evaluateeId: z.string().uuid({ message: "Please select a staff member." }),
    punctuality: z.number().min(1).max(5),
    qualityOfWork: z.number().min(1).max(5),
    teamwork: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    initiative: z.number().min(1).max(5),
    comments: z.string().optional(),
});

interface Props {
    staffList: { id: string; name: string; role: string }[];
}

export function EvaluationForm({ staffList }: Props) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            evaluateeId: "",
            punctuality: 3,
            qualityOfWork: 3,
            teamwork: 3,
            communication: 3,
            initiative: 3,
            comments: "",
        },
    });

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setLoading(true);
        const formData = new FormData();
        formData.append("evaluateeId", data.evaluateeId);
        formData.append("punctuality", data.punctuality.toString());
        formData.append("qualityOfWork", data.qualityOfWork.toString());
        formData.append("teamwork", data.teamwork.toString());
        formData.append("communication", data.communication.toString());
        formData.append("initiative", data.initiative.toString());

        if (data.comments) formData.append("comments", data.comments);

        const result = await submitEvaluation({}, formData);

        if (result.success) {
            toast.success(result.message);
            form.reset();
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    const StarRating = ({ value }: { value: number }) => {
        return (
            <div className="flex space-x-1 mt-2">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
                <FormField
                    control={form.control}
                    name="evaluateeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Staff Member</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select staff to evaluate..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {staffList.map((staff) => (
                                        <SelectItem key={staff.id} value={staff.id}>
                                            {staff.name} ({staff.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                    {['punctuality', 'qualityOfWork', 'teamwork', 'communication', 'initiative'].map((metric) => (
                        <FormField
                            key={metric}
                            control={form.control}
                            name={metric as keyof z.infer<typeof FormSchema>}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center mb-2">
                                        <FormLabel className="capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</FormLabel>
                                        <span className="font-bold">{field.value as number}/5</span>
                                    </div>
                                    <FormControl>
                                        <Slider
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[field.value as number]}
                                            onValueChange={(vals) => field.onChange(vals[0])}
                                            className="py-4"
                                        />
                                    </FormControl>
                                    <StarRating value={field.value as number} />
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
                                <Textarea
                                    placeholder="Provide any qualitative feedback here..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                These comments will be stored alongside the computed average score.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Evaluation
                </Button>
            </form>
        </Form>
    );
}
