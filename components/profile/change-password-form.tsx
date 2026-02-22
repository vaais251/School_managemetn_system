"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePassword } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";

export function ChangePasswordForm() {
    const [state, dispatch] = useFormState(changePassword, null);

    return (
        <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                />
            </div>

            {state && (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-sm border ${state.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                    {state.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <p className="font-medium">{state.message}</p>
                </div>
            )}

            <SubmitButton />
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending} className="w-full gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {pending ? "Updating..." : "Update Password"}
        </Button>
    );
}
