"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock, Mail } from "lucide-react";

export function LoginForm() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-blue-100 p-3">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">MRT Enterprise ERP</CardTitle>
                <CardDescription>
                    Enter your institutional email and password to access the portal.
                </CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="space-y-4">
                    <div className="space-y-2 relative">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@mrt.edu"
                                required
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="text-sm text-right">
                        <span className="text-blue-600 hover:underline cursor-pointer">Forgot password?</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <LoginButton />
                    {errorMessage && (
                        <div className="flex w-full items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <p>{errorMessage}</p>
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button className="w-full" aria-disabled={pending} disabled={pending}>
            {pending ? "Authenticating..." : "Sign In"}
        </Button>
    );
}
