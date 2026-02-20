import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            isActive: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        role: string;
        isActive: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role: string;
        isActive: boolean;
    }
}
