import type { Role } from "@/lib/types/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    department?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    department?: string;
  }
}
