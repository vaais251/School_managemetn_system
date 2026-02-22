import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/auth";

interface HeaderProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    }
}

export default function Header({ user }: HeaderProps) {
    return (
        <header className="flex h-16 items-center gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl px-6 w-full justify-between sticky top-0 z-40 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <div className="flex items-center gap-4 md:ml-0 ml-10">
                <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">Dashboard</h1>
            </div>
            <div className="flex items-center gap-5">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-700 leading-tight">
                        {user.name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5 border border-blue-100">
                        {user.role?.replace('_', ' ')}
                    </span>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer h-10 w-10 ring-2 ring-slate-100 ring-offset-2 transition-all hover:ring-blue-100 shadow-sm">
                            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold">
                                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="w-full cursor-pointer">
                                My Profile &amp; Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <form
                            action={async () => {
                                "use server";
                                await signOut();
                            }}
                        >
                            <button className="w-full text-left">
                                <DropdownMenuItem>Logout</DropdownMenuItem>
                            </button>
                        </form>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
