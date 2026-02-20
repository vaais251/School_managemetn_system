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
        <header className="flex h-14 items-center gap-4 border-b bg-white px-6 w-full justify-between">
            <div className="flex items-center gap-4 md:ml-0 ml-10">
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 hidden md:inline-block">
                    {user.email} ({user.role})
                </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuItem>Support</DropdownMenuItem>
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
