---
name: mrt-architecture-guidelines
description: Architectural guidelines and tech stack rules for the MRT Enterprise ERP project. Use this when writing code, creating DB schemas, or building UI components for the ERP.
---
# MRT ERP Architecture Guidelines

## Tech Stack
- Frontend: Next.js 14 (App Router) with React Server Components.
- Styling: Tailwind CSS + Shadcn/UI.
- Backend: Next.js Server Actions (API-less architecture - do not create /api routes unless strictly necessary for webhooks).
- Database: PostgreSQL.
- ORM: Prisma.

## Security & Performance
- Enforce strict Role-Based Access Control (RBAC).
- Validate all inputs using Zod on the server side (inside Server Actions).
- Use Optimistic UI updates with `revalidatePath` for data mutations.
- Bulk operations must use Prisma transactions.
