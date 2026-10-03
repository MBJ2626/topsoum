#!/usr/bin/env bash
# scripts/worktree-setup.sh — Prépare un worktree git TopSoum
# Usage : depuis la racine du worktree → bash scripts/worktree-setup.sh
set -euo pipefail

# Racine du worktree principal (là où vivent les .env non versionnés)
MAIN_ROOT="$(git worktree list --porcelain | head -1 | cut -d' ' -f2)"
HERE="$(pwd)"

if [ "$MAIN_ROOT" = "$HERE" ]; then
  echo "Tu es dans le worktree principal : rien à faire."
  exit 0
fi

echo "-> Copie des fichiers .env depuis $MAIN_ROOT"
# Copie tous les .env* non versionnés (racine + apps/* + packages/*), sauf .env.example
find "$MAIN_ROOT" -maxdepth 3 -name ".env*" ! -name ".env.example" \
  -not -path "*/node_modules/*" -not -path "*/.worktrees/*" | while read -r f; do
  rel="${f#$MAIN_ROOT/}"
  mkdir -p "$(dirname "$rel")"
  cp -n "$f" "$rel" && echo "   $rel"
done

echo "-> Dépendances JS (store pnpm partagé)"
pnpm install --frozen-lockfile

echo "-> Client Prisma"
if [ -d packages/db-schema ]; then
  pnpm --filter "./packages/db-schema" exec prisma generate
fi

echo "-> Environnement Python des scrapers"
if [ -f apps/scrapers/requirements.txt ]; then
  python3 -m venv apps/scrapers/.venv
  apps/scrapers/.venv/bin/pip install -q -r apps/scrapers/requirements.txt
elif [ -f apps/scrapers/pyproject.toml ] && command -v uv >/dev/null; then
  (cd apps/scrapers && uv sync)
fi

echo "Worktree prêt. Docker (PostgreSQL/Redis) : utiliser le stack du worktree principal."
