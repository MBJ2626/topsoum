import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Instance NextAuth séparée, construite uniquement depuis auth.config.ts
// (edge-safe) : jamais depuis ./auth, qui importe Prisma/bcrypt et casserait
// le runtime Edge du middleware.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth?.user) {
    return Response.redirect(new URL("/api/auth/signin", req.nextUrl.origin));
  }

  if (req.auth.user.isAdmin !== true) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
