# TopSoum (topsoum.com) — Comparateur de prix électronique tunisien

## Référence complète
La spécification complète est dans @docs/PROJET.md — la lire avant
toute décision d'architecture.

## Architecture
- Monorepo Turborepo : apps/{scrapers, etl-pipeline, api, web}, packages/{shared-types, db-schema, config}
- Scrapers : Python + Playwright, un dossier vendors/{nom}/ par vendeur
- API : FastAPI en couches routes → controllers → services → repositories
- Frontend : Next.js App Router + Tailwind + React Query
- DB : PostgreSQL (Prisma), Redis cache
- Auth : NextAuth.js (email/password + OAuth Google/Facebook)

## Règles IMMUABLES
- Un scraper ne connaît JAMAIS un autre scraper
- Seule la couche repositories touche la DB
- Le frontend appelle l'API uniquement via lib/api-client.ts
- Chaque appel API frontend gère 3 états : loading, error, success
- Favoris : suivi de prix MANUEL par produit, jamais automatique
- Dashboard admin : mono-admin, pas de système de rôles
- Pas de placement sponsorisé, pas d'alertes en V1
- Design : un seul accent (CTA + badge "Meilleur prix"), une famille de police en deux graisses, filtres repliés par défaut ; valeurs actuelles dans @DESIGN.md

## Commandes
- Dev : pnpm dev
- Build : pnpm build
- Tests : pnpm test
