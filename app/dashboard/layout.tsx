import { auth } from "@/auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar userRole={session.user.role} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={session.user} />
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
