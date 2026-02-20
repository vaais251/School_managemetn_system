"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ProgramType } from "@prisma/client";
import { useState } from "react";
import { registerStudent } from "@/actions/admissions";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon } from "lucide-react";

// Mirror schema from action
const formSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    registrationId: z.string().min(3, { message: "Reg ID must be at least 3 characters." }),
    isBeneficiary: z.boolean(),
    needsHostel: z.boolean(),
    programType: z.nativeEnum(ProgramType).optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
});

export function RegisterStudentForm() {
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            name: "",
            registrationId: "",
            isBeneficiary: false,
            needsHostel: false,
            guardianName: "",
            guardianPhone: "",
        },
    });

    const watchNeedsHostel = form.watch("needsHostel");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setCredentials(null);

        // Format guardian info to JSON string
        const guardianInfo = JSON.stringify({
            name: values.guardianName,
            phone: values.guardianPhone
        });

        const formData = new FormData();
        formData.append("email", values.email);
        formData.append("name", values.name);
        formData.append("registrationId", values.registrationId);
        formData.append("isBeneficiary", values.isBeneficiary.toString());
        formData.append("needsHostel", values.needsHostel.toString());

        // Server action enforces MRA if needsHostel is true, but we send it anyway
        if (watchNeedsHostel) {
            formData.append("programType", ProgramType.MRA);
        } else if (values.programType) {
            formData.append("programType", values.programType);
        }

        formData.append("guardianInfo", guardianInfo);

        const result = await registerStudent(null, formData);

        if (result.success && result.credentials) {
            toast.success(result.message);
            setCredentials(result.credentials);
            form.reset();
        } else {
            toast.error(result.message || "An error occurred.");
        }

        setLoading(false);
    }

    const copyToClipboard = () => {
        if (credentials) {
            navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
            toast.success("Credentials copied to clipboard");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Register New Student</CardTitle>
                <CardDescription>
                    Create a new student profile and generate login credentials.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {credentials && (
                    <div className="mb-6 p-4 border rounded-md bg-green-50 text-green-900 border-green-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold mb-2">Registration Successful</h4>
                                <p className="font-mono text-sm">Email: {credentials.email}</p>
                                <p className="font-mono text-sm">Password: <span className="font-bold">{credentials.password}</span></p>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="bg-white border-green-300">
                                <CopyIcon className="h-4 w-4 mr-2" />
                                Copy
                            </Button>
                        </div>
                        <p className="text-xs mt-2 text-green-700">Please provide these credentials to the student securely. The password will not be shown again.</p>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="registrationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="STU-2026-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4 rounded-md border p-4 col-span-1 md:col-span-2 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="isBeneficiary"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Beneficiary (Free Tuition)
                                                    </FormLabel>
                                                    <FormDescription>
                                                        This student receives free tuition.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="needsHostel"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={(checked) => {
                                                            field.onChange(checked);
                                                            if (checked === true) {
                                                                form.setValue('programType', ProgramType.MRA);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Hostel Required
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Forces enrollment into MRA program.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {!watchNeedsHostel && (
                                <FormField
                                    control={form.control}
                                    name="programType"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel>Program Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a program" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={ProgramType.MRHSS}>MRHSS</SelectItem>
                                                    <SelectItem value={ProgramType.MRA}>MRA</SelectItem>
                                                    <SelectItem value={ProgramType.RFL}>RFL</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="mb-4 text-sm font-medium">Guardian Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="guardianName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Guardian Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Jane Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="guardianPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Guardian Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1234567890" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Registering..." : "Complete Registration"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
