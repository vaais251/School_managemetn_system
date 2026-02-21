"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";

export function LoginForm() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="w-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 text-center lg:text-left">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30 mb-6 lg:mx-0 mx-auto">
                    <KeyRound className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                <p className="text-slate-500 mt-2 text-lg">Sign in to your MRT Enterprise account</p>
            </div>

            <form action={dispatch} className="space-y-6">
                <div className="space-y-5">
                    <div className="space-y-2 relative group">
                        <Label htmlFor="email" className="text-slate-700 font-semibold tracking-wide text-sm uppercase">Email Address</Label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@mrt.edu"
                                required
                                className="pl-11 h-14 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-base rounded-xl font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 relative group">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-slate-700 font-semibold tracking-wide text-sm uppercase">Password</Label>
                            <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="pl-11 h-14 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-base rounded-xl font-medium tracking-widest placeholder:tracking-normal"
                            />
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 animate-in zoom-in-95 duration-200">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="font-semibold">{errorMessage}</p>
                    </div>
                )}

                <LoginButton />
            </form>

            <div className="mt-10 text-center text-sm text-slate-500 font-medium">
                <p>Protected by enterprise-grade security.</p>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            className="w-full h-14 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all relative overflow-hidden group bg-transparent border-0 mt-4"
            aria-disabled={pending}
            disabled={pending}
        >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all group-hover:scale-105"></span>

            <div className="relative flex items-center justify-center gap-2 text-white">
                {pending ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Authenticating...
                    </>
                ) : (
                    <>
                        Sign In to Dashboard <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                    </>
                )}
            </div>
        </Button>
    );
}
