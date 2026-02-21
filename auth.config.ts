import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = auth?.user?.role;
            const pathname = nextUrl.pathname;
            const isOnDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/student');

            if (!isOnDashboard) {
                if (isLoggedIn && pathname === '/login') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            if (!isLoggedIn) return false;

            // RBAC logic for sub-routes
            const isRole = (roles: string[]) => roles.includes(role as string);

            if (pathname.startsWith('/dashboard/admin') && !isRole(['SUPER_ADMIN'])) return false;
            if (pathname.startsWith('/dashboard/hr') && !isRole(['SUPER_ADMIN'])) return false;
            if (pathname.startsWith('/dashboard/qec') && !isRole(['SUPER_ADMIN'])) return false;
            if (pathname.startsWith('/dashboard/audit') && !isRole(['SUPER_ADMIN'])) return false;
            if (pathname.startsWith('/dashboard/settings') && !isRole(['SUPER_ADMIN'])) return false;

            if (pathname.startsWith('/dashboard/rfl') && !isRole(['SUPER_ADMIN', 'TRUST_MANAGER'])) return false;
            if (pathname.startsWith('/dashboard/finance') && !isRole(['SUPER_ADMIN', 'TRUST_MANAGER', 'FEE_DEPT'])) return false;
            if (pathname.startsWith('/dashboard/academics') && !isRole(['SUPER_ADMIN', 'SECTION_HEAD', 'EXAM_DEPT'])) return false;
            if (pathname.startsWith('/dashboard/reports') && !isRole(['SUPER_ADMIN', 'TRUST_MANAGER', 'SECTION_HEAD'])) return false;

            if (pathname.startsWith('/dashboard/teacher') && !isRole(['TEACHER'])) return false;
            if (pathname.startsWith('/student') && !isRole(['STUDENT'])) return false;

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                // Add custom fields to the token
                token.role = user.role;
                token.isActive = user.isActive;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // Add custom fields to the session
                session.user.role = token.role as string;
                session.user.isActive = token.isActive as boolean;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
