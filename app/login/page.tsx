import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-blue-900/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            <div className="relative z-10 w-full max-w-md">
                <LoginForm />
            </div>
        </main>
    );
}
