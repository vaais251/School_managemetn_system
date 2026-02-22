"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Receipt,
    FileText,
    Settings,
    ShieldAlert,
    Menu,
    Banknote,
    UserCheck,
    ClipboardCheck,
    LineChart,
    UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type Role =
    | "SUPER_ADMIN"
    | "TRUST_MANAGER"
    | "SECTION_HEAD"
    | "FEE_DEPT"
    | "ADMISSION_DEPT"
    | "EXAM_DEPT"
    | "TEACHER"
    | "STUDENT";

interface SidebarProps {
    userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const menuItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["ALL"],
        },
        {
            title: "My Profile",
            href: "/dashboard/profile",
            icon: UserCircle,
            roles: ["ALL"],
        },
        {
            title: "User Management",
            href: "/dashboard/admin/users",
            icon: Users,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "Students",
            href: "/dashboard/students",
            icon: GraduationCap,
            roles: ["SUPER_ADMIN", "TRUST_MANAGER", "SECTION_HEAD", "ADMISSION_DEPT", "FEE_DEPT"],
        },
        {
            title: "Academics",
            href: "/dashboard/academics",
            icon: BookOpen,
            roles: ["SUPER_ADMIN", "SECTION_HEAD", "EXAM_DEPT"],
        },
        {
            title: "Teacher Portal",
            href: "/dashboard/teacher",
            icon: BookOpen,
            roles: ["TEACHER"],
        },
        {
            title: "Finance",
            href: "/dashboard/finance",
            icon: Receipt,
            roles: ["SUPER_ADMIN", "TRUST_MANAGER", "FEE_DEPT"],
        },
        {
            title: "Reports",
            href: "/dashboard/reports",
            icon: FileText,
            roles: ["SUPER_ADMIN", "TRUST_MANAGER", "SECTION_HEAD"],
        },
        {
            title: "RFL Trust",
            href: "/dashboard/rfl",
            icon: Banknote,
            roles: ["SUPER_ADMIN", "TRUST_MANAGER"],
        },
        {
            title: "HR Evaluation",
            href: "/dashboard/hr",
            icon: UserCheck,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "QEC",
            href: "/dashboard/qec",
            icon: ClipboardCheck,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "Audit Log",
            href: "/dashboard/admin/audit-logs",
            icon: ShieldAlert,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "Student Portal",
            href: "/student",
            icon: GraduationCap,
            roles: ["STUDENT"],
        },
        {
            title: "QEC Feedback",
            href: "/student/qec",
            icon: ClipboardCheck,
            roles: ["STUDENT"],
        },
    ];

    const filteredItems = menuItems.filter((item) => {
        if (item.roles.includes("ALL")) return true;
        return item.roles.includes(userRole as Role);
    });

    const NavContent = () => (
        <div className="flex flex-col h-full bg-white text-slate-700">
            {/* Branding Header */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
                <div className="h-10 w-10 text-white flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-500/20 shrink-0">
                    <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">MRT Enterprise</span>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Education System</span>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="mb-2 px-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Main Menu</p>
                </div>
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                isActive
                                    ? "bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100"
                                    : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center rounded-lg p-1 transition-colors",
                                isActive ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 group-hover:text-slate-600"
                            )}>
                                <item.icon className="h-4 w-4" />
                            </div>
                            {item.title}
                        </Link>
                    )
                })}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 border-t border-slate-100 mt-auto">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100/50 flex flex-col items-center text-center">
                    <p className="text-[11px] font-semibold text-slate-500">v2.4.0 &copy; 2026</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Powered by MRT Tech</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden fixed top-4 left-4 z-40">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <NavContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className="hidden border-r border-slate-200/60 bg-white md:block w-72 h-full shadow-[2px_0_8px_-3px_rgba(0,0,0,0.05)] z-50">
                <NavContent />
            </div>
        </>
    );
}
