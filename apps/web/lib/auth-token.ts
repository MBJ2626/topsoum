import "server-only";

import { SignJWT } from "jose";
import type { Session } from "next-auth";

// Secret dedie a l'echange Next.js <-> FastAPI, distinct d'AUTH_SECRET :
// AUTH_SECRET protege aussi les sessions JWE et les tokens de verification
// email d'Auth.js. Une fuite d'API_AUTH_SECRET ne doit pas exposer ca.
const BACKEND_TOKEN_TTL = "5m";

function getApiAuthSecret(): Uint8Array {
  const secret = process.env.API_AUTH_SECRET;
  if (!secret) {
    throw new Error("API_AUTH_SECRET manquant : impossible de miner un token backend");
  }
  return new TextEncoder().encode(secret);
}

/** Token HS256 court-vecu (5 min) verifie par apps/api/app/middlewares/auth.py. */
export async function mintBackendToken(session: Session): Promise<string> {
  return new SignJWT({ isAdmin: session.user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime(BACKEND_TOKEN_TTL)
    .sign(getApiAuthSecret());
}
