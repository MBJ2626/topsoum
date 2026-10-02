// Point unique d'appel a l'API depuis Server Components/Route Handlers. Le
// frontend ne doit jamais fetch() l'API ailleurs.
//
// Appels cote navigateur (Client Components) : pas geres ici (necessite un
// hop via /api/auth/backend-token pour recuperer un Bearer token, voir cette
// route) - a construire pleinement en Etape 6 avec les hooks React Query.
import "server-only";

import { auth } from "@/auth";
import { mintBackendToken } from "@/lib/auth-token";
import { CLIENT_IP_HEADER, CLIENT_IP_SIGNATURE_HEADER, currentClientIp, signClientIp } from "@/lib/client-ip";

interface ApiFetchOptions extends RequestInit {
  /** Attache un Bearer token si une session existe. Defaut true. */
  auth?: boolean;
  /**
   * Transmet l'IP du visiteur (signee) pour que l'API limite par visiteur et
   * non par serveur Next. Defaut true. false pour les pages mises en cache
   * (ISR) : il n'y a pas de visiteur, et lire les en-tetes les rendrait dynamiques.
   */
  forwardClientIp?: boolean;
}

export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const { auth: withAuth = true, forwardClientIp = true, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);

  if (withAuth) {
    const session = await auth();
    if (session) {
      headers.set("Authorization", `Bearer ${await mintBackendToken(session)}`);
    }
  }

  const secret = process.env.API_AUTH_SECRET;
  if (forwardClientIp && secret) {
    const ip = await currentClientIp();
    if (ip) {
      headers.set(CLIENT_IP_HEADER, ip);
      headers.set(CLIENT_IP_SIGNATURE_HEADER, signClientIp(ip, secret));
    }
  }

  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL manquant");
  }

  return fetch(`${baseUrl}${path}`, { ...requestInit, headers });
}
