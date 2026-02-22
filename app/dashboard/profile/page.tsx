import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import {
    User, GraduationCap, BookOpen, Users,
    Mail, ShieldCheck, Calendar, Home,
    Banknote, Building2, Key
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: "Super Administrator",
    TRUST_MANAGER: "Trust Manager",
    SECTION_HEAD: "Section Head",
    FEE_DEPT: "Fee Department",
    ADMISSION_DEPT: "Admissions Department",
    EXAM_DEPT: "Examinations Department",
    TEACHER: "Class Teacher",
    STUDENT: "Student",
};

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200",
    TRUST_MANAGER: "bg-amber-100 text-amber-800 border-amber-200",
    SECTION_HEAD: "bg-indigo-100 text-indigo-800 border-indigo-200",
    FEE_DEPT: "bg-green-100 text-green-800 border-green-200",
    ADMISSION_DEPT: "bg-sky-100 text-sky-800 border-sky-200",
    EXAM_DEPT: "bg-purple-100 text-purple-800 border-purple-200",
    TEACHER: "bg-blue-100 text-blue-800 border-blue-200",
    STUDENT: "bg-slate-100 text-slate-800 border-slate-200",
};

export default async function ProfilePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            studentProfile: {
                include: {
                    class: true,
                    enrollments: { where: { status: "ACTIVE" }, take: 1 },
                    rflRecord: true,
                    disbursements: { orderBy: { transactionDate: "desc" }, take: 3 },
                }
            },
            teacherAssignments: {
                include: {
                    class: true,
                    subject: true,
                }
            },
        }
    });

    if (!user) redirect("/login");

    const role = session.user.role;
    const initials = (user.email ?? "U").substring(0, 2).toUpperCase();
    const studentProfile = user.studentProfile as any;
    const guardianInfo = studentProfile?.guardianInfo as any;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Page header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">My Profile</h2>
                <p className="text-muted-foreground mt-1">Your account information and security settings.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN — Identity card */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Avatar + Identity */}
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-400/30">
                                {initials}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {studentProfile?.name ?? user.email?.split("@")[0]}
                                </h3>
                                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {user.email}
                                </div>
                            </div>
                            <Badge className={`text-xs font-semibold border ${ROLE_COLORS[role]}`} variant="outline">
                                {ROLE_LABELS[role] ?? role}
                            </Badge>
                            <Badge
                                variant={user.isActive ? "default" : "destructive"}
                                className="text-xs"
                            >
                                {user.isActive ? "Active Account" : "Suspended"}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Account details */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-slate-500" /> Account Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-semibold">{ROLE_LABELS[role]}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground">Member since</span>
                                <span className="font-semibold">
                                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Account status</span>
                                <span className={`font-semibold ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                                    {user.isActive ? "Active" : "Suspended"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN — Role-specific info + Password */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ─── STUDENT INFO ─── */}
                    {role === "STUDENT" && studentProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-blue-600" /> Student Information
                                </CardTitle>
                                <CardDescription>Your academic and personal details on file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-0 divide-y text-sm">
                                <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={studentProfile.name} />
                                <InfoRow icon={<Key className="h-4 w-4" />} label="Registration ID" value={studentProfile.registrationId} mono />
                                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Class / Grade" value={studentProfile.class?.name ?? "Not Assigned"} />
                                <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Program" value={studentProfile.enrollments?.[0]?.type ?? "None"} />
                                <InfoRow icon={<Home className="h-4 w-4" />} label="Needs Hostel" value={studentProfile.needsHostel ? "Yes" : "No"} />
                                <InfoRow icon={<Banknote className="h-4 w-4" />} label="Financial Aid (Beneficiary)" value={studentProfile.isBeneficiary ? "Yes — Fee Waived" : "No"} />
                                {guardianInfo && (
                                    <>
                                        <div className="pt-4 pb-2">
                                            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Guardian Details</p>
                                        </div>
                                        <InfoRow icon={<User className="h-4 w-4" />} label="Father/Guardian Name" value={guardianInfo.name} />
                                        <InfoRow icon={<Users className="h-4 w-4" />} label="Relationship" value={guardianInfo.relationship} />
                                        <InfoRow icon={<Mail className="h-4 w-4" />} label="Guardian Phone" value={guardianInfo.phone} />
                                    </>
                                )}
                                {studentProfile.rflRecord && (
                                    <>
                                        <div className="pt-4 pb-2">
                                            <p className="text-xs uppercase font-bold tracking-widest text-amber-600">RFL Scholarship Info</p>
                                        </div>
                                        <InfoRow icon={<Building2 className="h-4 w-4" />} label="University" value={studentProfile.rflRecord.universityName} />
                                        <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Degree" value={studentProfile.rflRecord.degree} />
                                        <InfoRow icon={<Calendar className="h-4 w-4" />} label="Current Semester" value={`Semester ${studentProfile.rflRecord.currentSemester}`} />
                                        <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="GPA" value={studentProfile.rflRecord.gpa ? `${Number(studentProfile.rflRecord.gpa).toFixed(2)} / 4.00` : "Not recorded"} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ─── TEACHER INFO ─── */}
                    {role === "TEACHER" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" /> Teaching Assignments
                                </CardTitle>
                                <CardDescription>Classes and subjects you are currently assigned to.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.teacherAssignments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No class assignments on file.</p>
                                ) : (
                                    <div className="rounded-md border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Class</th>
                                                    <th className="px-4 py-3 text-left">Subject</th>
                                                    <th className="px-4 py-3 text-left">Role</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {user.teacherAssignments.map((a: any) => (
                                                    <tr key={a.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-semibold text-slate-800">{a.class.name}</td>
                                                        <td className="px-4 py-3 text-slate-600">{a.subject?.name ?? "—"}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                                {a.subject ? "Subject Teacher" : "Class Teacher"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ─── STAFF ROLE INFO ─── */}
                    {!["STUDENT", "TEACHER"].includes(role) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" /> Staff Role Overview
                                </CardTitle>
                                <CardDescription>Your scope and responsibilities within the MRT Enterprise ERP.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {RoleDescription(role)}
                            </CardContent>
                        </Card>
                    )}

                    {/* ─── CHANGE PASSWORD ─── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-slate-600" /> Change Password
                            </CardTitle>
                            <CardDescription>Update your account password. You must enter your current password to confirm.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangePasswordForm />
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2.5 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                {icon}
                <span>{label}</span>
            </div>
            <span className={`font-semibold text-slate-800 text-right ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
        </div>
    );
}

function RoleDescription(role: string) {
    const descriptions: Record<string, React.ReactNode> = {
        SUPER_ADMIN: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Super Administrator</strong>, you have unrestricted access to all modules of the MRT Enterprise ERP including:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Full user management (create, deactivate, reset passwords)</li>
                    <li>View and filter audit logs across the entire system</li>
                    <li>Access all financial, academic, and HR records</li>
                    <li>Generate and configure system-wide settings</li>
                </ul>
            </div>
        ),
        TRUST_MANAGER: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Trust Manager</strong>, you manage the Roshni Foundation & Learning (RFL) scholarship program:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>View and manage RFL scholars directory</li>
                    <li>Log and track scholarship disbursements</li>
                    <li>Update university academic progress (GPA, semester)</li>
                    <li>View full disbursement ledger history</li>
                </ul>
            </div>
        ),
        SECTION_HEAD: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Section Head</strong>, you oversee the academic operations of allocated classes:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Access the student directory and 360° student profiles</li>
                    <li>Review academic performance and exam results</li>
                    <li>Generate academic reports</li>
                </ul>
            </div>
        ),
        FEE_DEPT: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Fee Department</strong>, you manage the financial collections for the institution:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Define monthly fee structures per class</li>
                    <li>Generate bulk fee vouchers for entire classes</li>
                    <li>Mark individual vouchers as PAID or UNPAID</li>
                    <li>View student fee status grouped by class</li>
                </ul>
            </div>
        ),
        ADMISSION_DEPT: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Admissions Department</strong>, you manage student enrollment and onboarding:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Access the global student directory</li>
                    <li>View student enrollment and profile details</li>
                    <li>Manage new student applications</li>
                </ul>
            </div>
        ),
        EXAM_DEPT: (
            <div className="space-y-2 text-slate-700">
                <p>As <strong>Exam Department</strong>, you manage assessments and grading:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Access academic records and exam marks</li>
                    <li>Manage examination schedules and results entry</li>
                    <li>Generate academic performance reports</li>
                </ul>
            </div>
        ),
    };

    return descriptions[role] ?? <p className="text-muted-foreground">No role description available.</p>;
}
