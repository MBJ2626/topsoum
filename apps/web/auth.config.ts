import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

// Edge-safe : jamais de Prisma ni de bcrypt ici (importé par middleware.ts,
// qui tourne dans le runtime Edge). Le provider Credentials vit dans auth.ts.
const oauthProviders: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  oauthProviders.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers: oauthProviders,
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    // Ici et non dans auth.ts : middleware.ts n'utilise que cette config. Sans
    // ces callbacks, sa session n'a pas isAdmin et /admin est inaccessible a tous.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
};
