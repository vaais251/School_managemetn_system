import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// Note: detailed RBAC logic is partially in auth.config.ts (authorized callback)
// but for strict role checks per route, we can extend it here or in the authorized callback.
// The current implementation in auth.config.ts handles basic authentication checks.
// For role-based checks (e.g. /admin only for SUPER_ADMIN), we should enhance the authorized callback
// or implement a custom middleware function if needed.
// Given the requirements, I will enhance auth.config.ts in the next step or here if I can import types.
// Since auth.config.ts is edge compatible, logic is best placed there.
