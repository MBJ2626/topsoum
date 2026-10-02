import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

// En-tetes lus par apps/api/app/middlewares/rate_limit.py.
export const CLIENT_IP_HEADER = "x-topsoum-client-ip";
export const CLIENT_IP_SIGNATURE_HEADER = "x-topsoum-client-ip-signature";

/**
 * IP du visiteur de la requete en cours, posee par le proxy devant Next.js.
 * x-real-ip d'abord ; sinon la DERNIERE entree de x-forwarded-for, ajoutee
 * par notre proxy (la premiere peut etre ecrite par le client lui-meme).
 */
export async function currentClientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = requestHeaders.get("x-forwarded-for");
  const last = forwarded?.split(",").pop()?.trim();
  return last || null;
}

export function signClientIp(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex");
}
