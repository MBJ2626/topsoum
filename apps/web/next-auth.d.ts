import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin: boolean;
  }
}

// NextAuth's callback types import JWT from "@auth/core/jwt" directly
// (not from the "next-auth/jwt" re-export), so augmentation must target
// the original module for `token.id`/`token.isAdmin` to type-check.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
  }
}
