import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen bg-slate-50">
            {/* Left side - Branding / Showcase */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
                {/* Abstract background shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
                    <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px]" />
                    <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10 w-full max-w-lg px-12 flex flex-col justify-center h-full text-white">
                    <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md w-fit shadow-xl">
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        <span className="text-xs font-medium tracking-wide text-blue-100 uppercase">System Operational</span>
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                        Powering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">MRT Enterprise</span>
                    </h1>

                    <p className="text-slate-300 text-lg mb-12 leading-relaxed max-w-md font-light">
                        The fully-integrated education management platform built for modern institutions, accelerating academic excellence and operational efficiency.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-slate-300 group">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shadow-inner">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white tracking-wide">Enterprise-Grade Security</h3>
                                <p className="text-sm text-slate-400 mt-0.5">Role-based access controls & logging.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 group">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors shadow-inner">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white tracking-wide">Actionable Analytics</h3>
                                <p className="text-sm text-slate-400 mt-0.5">Real-time data-driven decisions.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 group">
                            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors shadow-inner">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white tracking-wide">Unified Management</h3>
                                <p className="text-sm text-slate-400 mt-0.5">Seamless school tracking system.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                {/* Subtle background for right side on mobile */}
                <div className="absolute inset-0 bg-slate-50/50 lg:hidden" />

                <div className="relative z-10 w-full max-w-md">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}
