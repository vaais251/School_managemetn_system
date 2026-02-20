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
            title: "User Management",
            href: "/dashboard/admin/users",
            icon: Users,
            roles: ["SUPER_ADMIN"],
        },
        {
            title: "Students",
            href: "/dashboard/students",
            icon: GraduationCap,
            roles: ["SUPER_ADMIN", "TRUST_MANAGER", "SECTION_HEAD", "ADMISSION_DEPT", "TEACHER"],
        },
        {
            title: "Academics",
            href: "/dashboard/academics",
            icon: BookOpen,
            roles: ["SUPER_ADMIN", "SECTION_HEAD", "EXAM_DEPT", "TEACHER"],
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
        <div className="space-y-4 py-4">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-slate-900 border-b pb-2">
                    MRT Enterprise
                </h2>
                <div className="space-y-1">
                    {filteredItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                        >
                            <span
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 hover:text-slate-900",
                                    pathname === item.href ? "bg-slate-100 text-slate-900" : "text-slate-600"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </span>
                        </Link>
                    ))}
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
            <div className="hidden border-r bg-white md:block w-64 h-full">
                <NavContent />
            </div>
        </>
    );
}
