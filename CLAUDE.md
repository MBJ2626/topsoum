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
## Superpowers (méthode de travail)
- Chaque prompt numéroté de la roadmap = spec ET plan déjà approuvés. Ne pas relancer brainstorming ni writing-plans dessus : exécuter directement (executing-plans) avec TDD et review.
- Ne jamais rouvrir les décisions de PRODUCT.md, DESIGN.md et docs/PROJET.md.
- Brainstorming autorisé uniquement pour une feature hors roadmap.
- TDD : nouveau code uniquement. Ne jamais supprimer de code existant au motif qu'il n'a pas de test ; ajouter les tests manquants.
- Bug : écrire d'abord un test qui reproduit le bug et échoue.
- Scrapers : tests sur fixtures HTML dans apps/scrapers/vendors/{nom}/fixtures/, jamais sur les sites live.
- Worktrees : dans .worktrees/, puis lancer `bash scripts/worktree-setup.sh`. Un seul docker-compose partagé (celui du worktree principal).
- Mode d'exécution par défaut : executing-plans (économique). subagent-driven-development seulement si je le demande.
- Les rapports de fin de tâche sont en français.
