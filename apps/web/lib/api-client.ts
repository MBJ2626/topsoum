// Point unique d'appel a l'API depuis Server Components/Route Handlers. Le
// frontend ne doit jamais fetch() l'API ailleurs.
//
// Appels cote navigateur (Client Components) : pas geres ici (necessite un
// hop via /api/auth/backend-token pour recuperer un Bearer token, voir cette
// route) - a construire pleinement en Etape 6 avec les hooks React Query.
import "server-only";

import { auth } from "@/auth";
import { mintBackendToken } from "@/lib/auth-token";

interface ApiFetchOptions extends RequestInit {
  /** Attache un Bearer token si une session existe. Defaut true. */
  auth?: boolean;
}

export async function apiFetch(path: string, init: ApiFetchOptions = {}): Promise<Response> {
  const { auth: withAuth = true, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);

  if (withAuth) {
    const session = await auth();
    if (session) {
      headers.set("Authorization", `Bearer ${await mintBackendToken(session)}`);
    }
  }

  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL manquant");
  }

  return fetch(`${baseUrl}${path}`, { ...requestInit, headers });
}
