import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Instance NextAuth séparée, construite uniquement depuis auth.config.ts
// (edge-safe) : jamais depuis ./auth, qui importe Prisma/bcrypt et casserait
// le runtime Edge du middleware.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth?.user) {
    // callbackUrl : ramene sur la page demandee (/admin...) apres connexion,
    // sinon NextAuth renvoie sur "/". Chemin relatif : pas de redirection ouverte.
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return Response.redirect(signInUrl);
  }

  if (req.auth.user.isAdmin !== true) {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
