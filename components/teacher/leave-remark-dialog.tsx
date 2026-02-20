"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitStudentRemark } from "@/actions/feedback";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";

const formSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    subject: z.string().optional(),
    comments: z.string().min(3, "Remarks must be at least 3 characters").max(1000, "Remarks are too long"),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaveRemarkDialogProps {
    studentId: string;
    studentName: string;
    defaultSubject?: string;
}

export function LeaveRemarkDialog({ studentId, studentName, defaultSubject }: LeaveRemarkDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: studentId,
            subject: defaultSubject || "",
            comments: "",
        },
    });

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true);
        try {
            await submitStudentRemark(data);
            toast.success("Remark submitted successfully");
            form.reset();
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit remark");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 flex gap-2">
                    <MessageSquarePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Leave Remark</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Leave a Remark</DialogTitle>
                    <DialogDescription>
                        Write feedback for <span className="font-semibold text-foreground">{studentName}</span>.
                        This will be visible on their student portal.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* hidden field to pass studentId within form implicitly or just use defaultValues */}
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Mathematics" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="comments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Remarks</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter constructive feedback or observations here..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Remark
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
