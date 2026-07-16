import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { mintBackendToken } from "@/lib/auth-token";

/**
 * Point d'entree pour les appels cote navigateur (Client Components) qui ont
 * besoin d'un Bearer token pour appeler l'API FastAPI directement. Les
 * Server Components/Route Handlers peuvent miner le token sans ce détour
 * (session serveur deja disponible), voir lib/api-client.ts.
 */
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const token = await mintBackendToken(session);
  return NextResponse.json({ token });
}
