#!/bin/bash
# check-projet.sh — Vérification pré-reprise Claude Code (Comparateur Prix TN)
# Usage: ./check-projet.sh depuis la racine du projet

echo "=================================================="
echo "  CHECK PROJET — Comparateur Prix TN"
echo "=================================================="

PASS="✅"
FAIL="❌"
WARN="⚠️ "

check() {
  if eval "$2" &>/dev/null; then
    echo "$PASS $1"
  else
    echo "$FAIL $1"
  fi
}

echo ""
echo "--- 1. Fichiers de contexte projet ---"
check "CLAUDE.md présent à la racine"      "[ -f CLAUDE.md ]"
check "docs/PROJET.md présent"             "[ -f docs/PROJET.md ]"
check "CLAUDE.md référence @docs/PROJET.md" "grep -q '@docs/PROJET.md' CLAUDE.md"

echo ""
echo "--- 2. Git & historique ---"
check "Dossier .git présent"               "[ -d .git ]"
check "Repo git valide"                    "git rev-parse --is-inside-work-tree"
if [ -d .git ]; then
  echo "   → Derniers commits :"
  git log --oneline -5 2>/dev/null | sed 's/^/     /'
  echo "   → Branche actuelle : $(git branch --show-current 2>/dev/null)"
  echo "   → Fichiers non commités :"
  git status --porcelain 2>/dev/null | sed 's/^/     /'
fi

echo ""
echo "--- 3. Structure monorepo (Turborepo) ---"
check "turbo.json présent"                 "[ -f turbo.json ]"
check "package.json racine présent"        "[ -f package.json ]"
check "apps/ présent"                      "[ -d apps ]"
check "packages/ présent"                  "[ -d packages ]"

echo ""
echo "--- 4. Dépendances & environnement ---"
check "node_modules/ présent (installé)"   "[ -d node_modules ]"
check "Node.js installé"                   "command -v node"
if command -v node &>/dev/null; then
  echo "   → Version Node : $(node --version)"
fi
check ".env ou .env.local présent"         "[ -f .env ] || [ -f .env.local ]"

echo ""
echo "--- 5. Config Claude Code locale ---"
check ".claude/ présent (settings/perms)"  "[ -d .claude ]"
check ".claude/settings.json présent"      "[ -f .claude/settings.json ]"

echo ""
echo "--- 6. Claude Code CLI ---"
check "Claude Code installé (npm global)"  "command -v claude"
if command -v claude &>/dev/null; then
  echo "   → Version : $(claude --version 2>/dev/null)"
fi

echo ""
echo "=================================================="
echo "  Fin du check. Corrige les ❌ avant de relancer."
echo "=================================================="
