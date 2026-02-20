"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

import { createClass, createSubject, assignTeacher } from "@/actions/academics";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Schemas
const ClassSchema = z.object({ name: z.string().min(2) });
const SubjectSchema = z.object({ name: z.string().min(2) });
const AssignSchema = z.object({
    teacherId: z.string().uuid(),
    classId: z.string().uuid(),
    subjectId: z.string().optional(),
});

interface Props {
    classes: { id: string; name: string }[];
    subjects: { id: string; name: string }[];
    teachers: { id: string; email: string }[];
}

export function AcademicSetupForms({ classes, subjects, teachers }: Props) {
    const [openClass, setOpenClass] = useState(false);
    const [openSubject, setOpenSubject] = useState(false);
    const [openAssign, setOpenAssign] = useState(false);
    const [loading, setLoading] = useState(false);

    const classForm = useForm<z.infer<typeof ClassSchema>>({ resolver: zodResolver(ClassSchema) });
    const subjectForm = useForm<z.infer<typeof SubjectSchema>>({ resolver: zodResolver(SubjectSchema) });
    const assignForm = useForm<z.infer<typeof AssignSchema>>({ resolver: zodResolver(AssignSchema) });

    const onSubmitClass = async (values: z.infer<typeof ClassSchema>) => {
        setLoading(true);
        const fd = new FormData(); fd.append("name", values.name);
        const res = await createClass(null, fd);
        setLoading(false);
        if (res.success) { toast.success(res.message); setOpenClass(false); classForm.reset(); }
        else toast.error(res.message);
    };

    const onSubmitSubject = async (values: z.infer<typeof SubjectSchema>) => {
        setLoading(true);
        const fd = new FormData(); fd.append("name", values.name);
        const res = await createSubject(null, fd);
        setLoading(false);
        if (res.success) { toast.success(res.message); setOpenSubject(false); subjectForm.reset(); }
        else toast.error(res.message);
    };

    const onSubmitAssign = async (values: z.infer<typeof AssignSchema>) => {
        setLoading(true);
        const fd = new FormData();
        fd.append("teacherId", values.teacherId);
        fd.append("classId", values.classId);
        if (values.subjectId && values.subjectId !== "none") fd.append("subjectId", values.subjectId);

        const res = await assignTeacher(null, fd);
        setLoading(false);
        if (res.success) { toast.success(res.message); setOpenAssign(false); assignForm.reset(); }
        else toast.error(res.message);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* Create Class */}
            <Dialog open={openClass} onOpenChange={setOpenClass}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Class</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Class</DialogTitle><DialogDescription>Define a new grade level or section.</DialogDescription></DialogHeader>
                    <Form {...classForm}>
                        <form onSubmit={classForm.handleSubmit(onSubmitClass)} className="space-y-4">
                            <FormField control={classForm.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Class Name</FormLabel><FormControl><Input placeholder="Grade 9-A" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={loading}>Save</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Create Subject */}
            <Dialog open={openSubject} onOpenChange={setOpenSubject}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Subject</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Subject</DialogTitle><DialogDescription>Define a new academic subject.</DialogDescription></DialogHeader>
                    <Form {...subjectForm}>
                        <form onSubmit={subjectForm.handleSubmit(onSubmitSubject)} className="space-y-4">
                            <FormField control={subjectForm.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Subject Name</FormLabel><FormControl><Input placeholder="Mathematics" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={loading}>Save</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Assign Teacher */}
            <Dialog open={openAssign} onOpenChange={setOpenAssign}>
                <DialogTrigger asChild>
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Assign Teacher</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Teacher</DialogTitle><DialogDescription>Map a teacher to a class (and optionally a subject).</DialogDescription></DialogHeader>
                    <Form {...assignForm}>
                        <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
                            <FormField control={assignForm.control} name="teacherId" render={({ field }) => (
                                <FormItem><FormLabel>Teacher</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger></FormControl>
                                        <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.email}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={assignForm.control} name="classId" render={({ field }) => (
                                <FormItem><FormLabel>Class</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={assignForm.control} name="subjectId" render={({ field }) => (
                                <FormItem><FormLabel>Subject (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Leave empty for Class Teacher" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">-- Class Teacher (No Subject) --</SelectItem>
                                            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" disabled={loading}>Assign</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
