"use client";

import { useState } from "react";
import { MoreHorizontal, ShieldOff, ShieldAlert, KeyRound, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deactivateUser, reactivateUser, resetPassword, updateUserRole } from "@/actions/users";
import { toast } from "sonner";
import { Role } from "@prisma/client";

interface UserActionsDropdownProps {
    user: {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
    };
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<string>(user.role);
    const [isPending, setIsPending] = useState(false);

    const handleToggleActive = async () => {
        try {
            if (user.isActive) {
                await deactivateUser(user.id);
                toast.success("User deactivated successfully.");
            } else {
                await reactivateUser(user.id);
                toast.success("User reactivated successfully.");
            }
        } catch (e) {
            toast.error("Failed to update user status.");
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setIsPending(true);
        try {
            await resetPassword(user.id, newPassword);
            toast.success("Password reset successfully.");
            setIsPasswordOpen(false);
            setNewPassword("");
        } catch (e) {
            toast.error("Failed to reset password.");
        } finally {
            setIsPending(false);
        }
    };

    const handleUpdateRole = async () => {
        if (newRole === user.role) {
            setIsRoleOpen(false);
            return;
        }
        setIsPending(true);
        try {
            await updateUserRole(user.id, newRole as Role);
            toast.success("User role updated successfully.");
            setIsRoleOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to update role.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                        Copy user ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleToggleActive}>
                        {user.isActive ? (
                            <><ShieldOff className="mr-2 h-4 w-4" /> Deactivate Account</>
                        ) : (
                            <><ShieldAlert className="mr-2 h-4 w-4" /> Reactivate Account</>
                        )}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setIsPasswordOpen(true)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                    </DropdownMenuItem>

                    {user.role !== "STUDENT" && (
                        <DropdownMenuItem onClick={() => setIsRoleOpen(true)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> Change Role
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Password Reset Dialog */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new secure password for {user.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-pass" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="new-pass"
                                type="password"
                                className="col-span-3"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={isPending} onClick={handleResetPassword}>Save Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Role Dialog */}
            <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Assign a new administrative or staff role to {user.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
                            <div className="col-span-3">
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                                        <SelectItem value="SECTION_HEAD">SECTION_HEAD</SelectItem>
                                        <SelectItem value="TRUST_MANAGER">TRUST_MANAGER</SelectItem>
                                        <SelectItem value="FEE_DEPT">FEE_DEPT</SelectItem>
                                        <SelectItem value="ADMISSION_DEPT">ADMISSION_DEPT</SelectItem>
                                        <SelectItem value="EXAM_DEPT">EXAM_DEPT</SelectItem>
                                        <SelectItem value="TEACHER">TEACHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button disabled={isPending} onClick={handleUpdateRole}>Update Role</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
