# PROJET : TOPSOUM — COMPARATEUR DE PRIX ÉLECTRONIQUE (MARCHÉ TUNISIEN)
> Document de référence complet — Idée, architecture, design, développement, roadmap
> Dernière mise à jour : 12 juillet 2026

---

## 0. IDENTITÉ DU PROJET

| | |
|---|---|
| Nom du site | **TopSoum** |
| Domaine | **topsoum.com** |
| Positionnement | Comparateur de prix électronique n°1 en Tunisie |

---

## 1. L'IDÉE

### 1.1 Concept
**TopSoum** est un site web qui déniche les prix des articles électroniques (téléphones, PC portables, PC bureautique, récepteurs, TV...) sur le marché tunisien, compare les prix entre revendeurs et propose à l'utilisateur le meilleur deal.

### 1.2 Proposition de valeur
- Prix le plus bas + historique de prix (courbe)
- Disponibilité en stock par revendeur
- Alertes de baisse de prix (sur produits suivis manuellement)
- Score "meilleur deal" (prix + fiabilité vendeur + frais de livraison)

### 1.3 Différenciateur marché
Aucun acteur local sérieux n'existe en Tunisie (contrairement à idealo/Google Shopping en Europe). Premier arrivé = avantage SEO massif sur des requêtes comme "meilleur prix iPhone 15 Tunisie".

### 1.4 Sites cibles (Phase 1 — MVP : 4-5 sites max)
| Catégorie | Sites à scraper |
|---|---|
| Smartphones | Tunisianet, MyTek, Spacenet, Wiki |
| PC Portables | Tunisianet, MyTek, Spacenet, Technopro |
| PC Bureautique / Composants | Tunisianet, MyTek, Zoomici |
| TV / Récepteurs | Tunisianet, MyTek, Electrotunisie |
| Électroménager | (extension future) |

**Priorité MVP** : Tunisianet, MyTek, Spacenet. (Jumia TN retiré : plus actif en Tunisie.)

### 1.5 Modèle économique (ordre d'activation)
1. **Affiliation** — commission avec les revendeurs sur clics/conversions (deals directs à négocier avec Tunisianet/MyTek au début)
2. **Publicité display** ciblée (AdSense en fallback)
3. **Data as a Service** — revente d'insights pricing aux marques/distributeurs (post-traction)
4. **Placement sponsorisé** — ❌ REPOUSSÉ (décision utilisateur : pas en V1, versions futures)

### 1.6 Risques spécifiques Tunisie
- **Anti-scraping** : rotation proxy + respect robots.txt ; privilégier accords/partenariats directs avec 2-3 gros vendeurs pour la pérennité
- **Cadre légal** : vérifier les CGU des sites cibles
- **Marché informel (FB Marketplace, WhatsApp)** : énorme volume réel hors scraping — ⏳ REPOUSSÉ EN V2 (décision utilisateur)
- **Change/douane** : prix TND fluctuants — prévoir tag "prix officiel importateur" vs "revendeur indépendant"

---

## 2. DÉCISIONS VALIDÉES PAR L'UTILISATEUR ✅

### 2.1 Scope V1 (validé)
| Fonctionnalité | Statut | Détail |
|---|---|---|
| Comparateur multi-vendeur + meilleur deal | ✅ V1 (core) | — |
| Historique de prix (graphique) | ✅ V1 | Validé par choix explicite |
| Comptes utilisateurs (favoris, suivi) | ✅ V1 | Validé par choix explicite |
| Dashboard admin (monitoring scrapers) | ✅ V1 | Validé par choix explicite |
| Alertes prix (email/SMS) | ⏳ V2 | Non prioritaire en V1 |
| Marché informel (FB/WhatsApp) | ⏳ V2 | "À voir plus tard" |
| Placement sponsorisé | ❌ Repoussé | "Non, dans les prochaines versions" |

### 2.2 Choix techniques précis (validés)
| Question | Décision |
|---|---|
| Méthode d'authentification | **Les deux** : Email + mot de passe ET OAuth Google/Facebook → NextAuth.js |
| Favoris → suivi de prix | **Choix manuel produit par produit** : flag `price_tracking: boolean` sur chaque favori, pas de suivi automatique |
| Accès dashboard admin | **Mono-admin** (utilisateur seul) : simple check `is_admin`, pas de système de rôles |

### 2.3 Design (validé)
Les mockups mobile et web interactifs ont été **validés** ("j'aime bien les mockups proposés"). Direction retenue :
- Philosophie "Search-first" : une seule barre de recherche centrale, rien d'autre au-dessus du fold
- Le meilleur deal en grand format (badge "Meilleur prix" + bordure accent), alternatives en liste secondaire discrète
- Filtres masqués derrière un seul bouton (panneau repliable)
- Un seul CTA dominant par écran
- Palette neutre (blanc/gris) + un seul accent (bleu) réservé aux CTA et badge meilleur prix
- Une seule police, deux graisses max (regular/medium)
- Iconographie outline cohérente
- Mobile-first, même architecture visuelle cross-device

### 2.4 Impact technique des choix
- Auth double → NextAuth.js (gère email + OAuth nativement, pas de système maison)
- Favoris manuels → modèle `Favorite { price_tracking: boolean }`, évite le spam de notifications
- Mono-admin → une route protégée, un booléen, zéro gestion de permissions

---

## 3. ARCHITECTURE DU PROJET

### 3.1 Découpage : 5 compartiments / 22 modules

**Compartiment 1 — Collecte de données (5 modules)**
- 1.1 Scraper Tunisianet
- 1.2 Scraper MyTek
- 1.3 Scraper Spacenet
- 1.4 Scheduler/Orchestrateur (cron, retry)
- 1.5 Proxy/Anti-blocage (rotation IP, user-agents, rate limiting)

**Compartiment 2 — Pipeline ETL (4 modules)**
- 2.1 Parser/Nettoyage (formats bruts, prix, devises)
- 2.2 Product Matching Engine ⚠️ le module le plus critique techniquement
- 2.3 Détection anomalies (prix aberrants, ruptures)
- 2.4 Enrichissement specs (RAM, stockage...)

**Compartiment 3 — Stockage (4 modules)**
- 3.1 Base produits/offres (PostgreSQL)
- 3.2 Historique de prix (time-series)
- 3.3 Cache (Redis)
- 3.4 Moteur de recherche (Meilisearch)

**Compartiment 4 — Backend/API (4 modules)**
- 4.1 API Produits & Comparaison
- 4.2 API Alertes (V2 pour l'envoi, structure prête en V1)
- 4.3 API Vendeurs/Affiliation (tracking clics, redirections)
- 4.4 Auth & Comptes utilisateurs (NextAuth : email + OAuth)

**Compartiment 5 — Frontend (5 modules)**
- 5.1 Page catégorie/listing
- 5.2 Page produit + comparaison
- 5.3 Favoris + toggle suivi de prix (UI)
- 5.4 SEO/Landing pages
- 5.5 Dashboard admin (mono-admin)

**MVP réduit** : ~12-14 modules actifs (3 scrapers, matching basique, PostgreSQL seul, API minimale, 2 pages frontend), le reste en V2.

### 3.2 Flux technique global
```
Scrapers (Python/Playwright, cron 2-3x/jour)
    → Pipeline ETL (normalisation, matching, anomalies)
    → PostgreSQL (+ Redis cache, Meilisearch index)
    → API (FastAPI)
    → Frontend (Next.js SSR)
```

### 3.3 Modèle de données (schéma DB)
```
User
├── id, email, name, auth_provider (credentials | google | facebook)
├── is_admin (boolean, un seul compte à true)
└── created_at

Favorite
├── user_id (FK), product_id (FK)
├── price_tracking (boolean, défaut false — activation manuelle)
└── created_at

Product
├── id, brand, model, category, specs (JSON normalisé)
├── canonical_name (pour matching cross-site)
└── image_url

Offer
├── product_id (FK), vendor_id (FK)
├── price (TND), stock_status (in_stock / out_of_stock / unknown)
├── url, shipping_cost
└── scraped_at

PriceHistory
├── offer_id (FK), price, recorded_at

Vendor
├── name, logo, trust_score, avg_delivery_time
```

### 3.4 Stack technique validée
| Composant | Choix | Justification |
|---|---|---|
| Scraping | Python + Playwright + Scrapy | Sites TN avec JS-rendering (MyTek) |
| Backend/API | FastAPI (Python) | Cohérent avec le scraping |
| Frontend | Next.js (App Router, SSR/SSG) | SEO critique + performance réseau mobile TN |
| Auth | NextAuth.js | Email + OAuth Google/Facebook natif |
| DB | PostgreSQL + Redis (cache) | — |
| Recherche | Meilisearch (self-hosted) | Léger, support arabe/français |
| Data fetching client | React Query / SWR | Cache stale-while-revalidate |
| Hosting | VPS OVH/Contabo ou hosting local TN | Latence correcte vers la Tunisie |
| Monitoring erreurs | Sentry | Alertes temps réel prod |
| Monitoring scrapers | Prometheus + Grafana ou alerting Slack | — |
| PWA | Oui | Installable, cache offline partiel, pas d'app native en V1 |

---

## 4. ARCHITECTURE DE CODE — MONOREPO MODULAIRE

### 4.1 Principe
Chaque module modifiable/remplaçable isolément sans casser le reste. Monorepo multi-services (Turborepo ou Nx).

```
prixtn/
├── apps/
│   ├── scrapers/          # Compartiment 1 — déployable seul
│   │   ├── core/
│   │   │   ├── BaseScraper.ts        # Classe abstraite commune
│   │   │   └── interfaces.ts          # Contrat VendorScraper
│   │   └── vendors/
│   │       ├── tunisianet/
│   │       │   ├── scraper.ts         # Implémente BaseScraper
│   │       │   ├── selectors.ts       # CSS/XPath isolés ici
│   │       │   └── mapper.ts          # HTML brut → format standard
│   │       ├── mytek/    (même structure)
│   │       └── spacenet/ (même structure)
│   ├── etl-pipeline/
│   │   └── matching/
│   │       ├── strategies/
│   │       │   ├── eanMatch.ts        # Par référence constructeur
│   │       │   ├── fuzzyMatch.ts      # Fallback sans EAN
│   │       │   └── manualOverride.ts  # Correction manuelle admin
│   │       └── matchingEngine.ts      # Pattern Strategy
│   ├── api/
│   │   ├── routes/          # Endpoints uniquement, zéro logique
│   │   ├── controllers/     # Reçoit requête → appelle service
│   │   ├── services/        # Logique métier (comparaison, scoring)
│   │   ├── repositories/    # SEULE couche qui parle à la DB
│   │   └── middlewares/     # Auth, rate-limit, validation
│   └── web/
│       ├── features/
│       │   ├── product-listing/     # Autonome : composants + hooks + API calls
│       │   ├── product-comparison/
│       │   ├── favorites/           # Avec toggle price_tracking
│       │   ├── search/
│       │   └── admin-dashboard/
│       ├── components/ui/           # Génériques (Button, Card...)
│       └── lib/api-client.ts        # Point UNIQUE d'appel à l'API
├── packages/
│   ├── shared-types/      # Types/interfaces partagés
│   ├── db-schema/         # Schéma Prisma + migrations (source de vérité)
│   └── config/            # Env, constantes
└── infra/
    ├── docker/
    └── ci-cd/
```

### 4.2 Règles anti-couplage (à respecter en permanence)
| Règle | Pourquoi |
|---|---|
| Un scraper ne connaît jamais un autre scraper | Isolation par vendeur — si Tunisianet change son HTML, seul `vendors/tunisianet/selectors.ts` change |
| L'API ne fait jamais de scraping direct | Séparation lecture/collecte |
| Le frontend n'appelle jamais la DB | Toujours via `api-client.ts` |
| `routes` ne touche jamais la DB | Passer par repositories — changer de DB = modifier une seule couche |
| Chaque module a ses propres tests | Modifier un module = lancer ses tests seulement |
| `shared-types` versionné | Changement de forme = erreurs de compilation immédiates |

### 4.3 Déploiement indépendant
```
apps/scrapers  → cron serverless (AWS Lambda/EventBridge ou cron VPS)
apps/api       → service séparé (Railway/Render/VPS)
apps/web       → Vercel (indépendant de l'API)
```
Un fix sur `web` ne redéploie ni les scrapers ni l'API.

---

## 5. DESIGN — DIRECTION VALIDÉE

### 5.1 Philosophie : "Search-first, filter-never (par défaut)"
L'utilisateur ne compare pas, il cherche une réponse. Il tape "iPhone 15" et veut le meilleur prix en 2 secondes.

| Anti-pattern à éviter | Notre approche |
|---|---|
| Homepage 8 catégories + bannières | Une seule barre de recherche centrale |
| Page produit avec 15 specs visibles | 3-4 specs clés + "voir plus" replié |
| Grille type Jumia/Amazon | Meilleur deal en grand + alternatives en liste discrète |
| Filtres complexes ouverts | Cachés derrière un seul bouton |

### 5.2 Hiérarchie par écran
- **Homepage** : 1 seule action possible — chercher
- **Résultats** : 1 réponse dominante (badge "Meilleur prix", bordure accent 2px) + liste courte vendeur/prix
- **Page produit (scroll progressif)** :
  1. Above the fold : photo, nom, prix, CTA — rien d'autre
  2. Historique de prix (graphique)
  3. Autres vendeurs (liste)
  4. Specs complètes (repliées)
  5. Produits similaires (discret)

### 5.3 Système visuel
- Palette neutre + **un seul accent** (bleu) : CTA et badge meilleur prix uniquement
- Une police, deux graisses (regular 400 / medium 500)
- Icônes outline uniquement
- Bordures fines, cards à coins arrondis (8-12px)
- Indicateur "-X% vs moyenne" en vert sur le meilleur deal

### 5.4 Mobile — exigences fluidité (zéro bug perçu)
**Gestion des états (source n°1 des "bugs" ressentis)** — chaque écran couvre :
| État | Afficher | Ne JAMAIS faire |
|---|---|---|
| Chargement | Skeleton screens | Écran blanc / spinner seul |
| Résultat vide | Message + suggestion | Page vide |
| Erreur réseau | "Connexion perdue" + bouton retry | Crash silencieux |
| Prix indisponible | "Prix en cours de mise à jour" | Prix à 0 TND ou obsolète non signalé |
| Offline | Bannière + cache local (derniers produits vus) | App inutilisable |

**Règle stricte** : chaque appel API = 3 chemins codés (succès / erreur / chargement).

**Robustesse réseau tunisien** :
- Retry automatique avec backoff (2-3 tentatives silencieuses)
- Cache agressif client (React Query/SWR, stale-while-revalidate)
- Pagination par batches de 10-15 produits
- Debounce recherche 300ms

**UX tactile** :
- Zones tactiles min 44x44px
- Feedback immédiat au tap (micro-animation)
- Momentum scrolling natif (jamais de scroll JS custom)
- `inputmode="numeric"` pour les prix, `type="search"` pour la recherche
- Safe areas (notch) via `env(safe-area-inset-*)`
- Pull-to-refresh sur les listes

**Cibles mesurables** : TTI < 3s sur 4G tunisienne, Lighthouse mobile > 90.
⚠️ Tester sur Android entrée/moyen de gamme (réalité du marché local), pas seulement iPhone récent.

### 5.5 Tests & qualité
| Type | Outil | Fréquence |
|---|---|---|
| Unitaires (matching, calculs prix) | Vitest/Jest | Chaque commit (CI) |
| End-to-end (recherche → achat) | Playwright | Chaque déploiement |
| Régression visuelle | Chromatic ou Percy | Chaque PR frontend |
| Multi-device réel | BrowserStack | Chaque release majeure |
| Monitoring prod | Sentry | Continu |

**Checklist pré-déploiement** :
- [ ] Zéro `console.error` en prod (TypeScript strict + ESLint)
- [ ] Boutons disabled pendant traitement (anti double-clic)
- [ ] Validation formulaires côté client
- [ ] Error Boundary React (jamais d'écran blanc total)
- [ ] Test mode avion → reprise réseau
- [ ] Test connexion throttlée (Slow 3G DevTools)

---

## 6. DÉMARCHE DE DÉVELOPPEMENT — ÉTAPE PAR ÉTAPE

### Étape 1 — Fondations (semaines 1-2)
- Schéma DB complet dans `packages/db-schema` (Prisma) : User, Favorite (avec price_tracking), Product, Offer, PriceHistory, Vendor
- Setup monorepo (Turborepo)
- Docker Compose local (Postgres + Redis)
- Setup NextAuth.js (email + Google/Facebook)
> Le schéma DB est le contrat entre tous les modules — le figer tôt évite les refactos en cascade.

### Étape 2 — Un scraper de bout en bout (semaines 3-4)
Un seul vendeur (Tunisianet) à travers TOUTE la chaîne :
`Scraper → ETL basique → DB → API endpoint → Affichage brut`
> Valide le pipeline complet avant de scaler. Corriger l'architecture maintenant coûte 10x moins cher.

### Étape 3 — Scaling horizontal des scrapers (semaines 5-6)
Ajouter MyTek, Spacenet via le template `BaseScraper` + structure `vendors/{nom}/`.

### Étape 4 — Product Matching Engine (semaines 7-8)
Module isolé, pattern Strategy : eanMatch → fuzzyMatch → manualOverride.
Testable indépendamment.

### Étape 5 — API en couches (semaines 9-10)
routes → controllers → services → repositories. Inclut auth NextAuth + endpoints favoris/price_tracking.

### Étape 6 — Frontend en features découplées (semaines 11-13)
Basé sur les mockups validés : product-listing, product-comparison, favorites (avec toggle suivi), search.
Gestion des 3 états sur chaque appel API. PWA config.

### Étape 7 — Dashboard admin mono-admin (semaine 14, parallélisable)
Monitoring scrapers (dernier run, taux d'échec), validation manuelle du matching produit.
Route protégée par check `is_admin`.

### Validation préalable (avant tout, optionnel mais recommandé)
Scraper manuellement 20-30 produits populaires sur 3 sites, publier un comparateur statique, mesurer le trafic organique 2-4 semaines → valider la demande avant d'investir dans l'infra complète.

---

## 7. PROMPTS À SUIVRE POUR DÉVELOPPER (avec Claude/IA)

Utiliser ces prompts dans l'ordre, un par session de travail. Chaque prompt donne le contexte nécessaire.

### Prompt 1 — Fondations
```
Je développe un comparateur de prix électronique pour le marché tunisien
(monorepo Turborepo). Génère-moi :
1. Le schéma Prisma complet avec : User (email + OAuth, is_admin),
   Favorite (avec flag price_tracking boolean), Product (canonical_name,
   specs JSON), Offer (price TND, stock_status, shipping_cost),
   PriceHistory, Vendor (trust_score).
2. Le docker-compose.yml local (PostgreSQL + Redis).
3. La structure de dossiers du monorepo : apps/{scrapers,etl-pipeline,api,web},
   packages/{shared-types,db-schema,config}.
Contraintes : TypeScript strict, tout commenté.
```

### Prompt 2 — Setup Auth
```
Dans mon app Next.js (App Router), configure NextAuth.js avec :
- Provider credentials (email + mot de passe, hash bcrypt)
- Providers Google et Facebook (OAuth)
- Adapter Prisma vers mon modèle User existant
- Middleware protégeant /admin (check is_admin, mono-admin)
- Session JWT
Donne-moi les fichiers complets et les variables d'env nécessaires.
```

### Prompt 3 — Premier scraper (bout en bout)
```
Crée un scraper Python (Playwright) pour Tunisianet avec cette architecture :
- BaseScraper (classe abstraite) : scrapeProduct(url), scrapeCategory(category)
- vendors/tunisianet/ : scraper.py + selectors.py (sélecteurs CSS isolés)
  + mapper.py (HTML → format Offer standard)
- Gestion erreurs : retry avec backoff, timeout, log des échecs
- Sortie : JSON conforme à mon modèle Offer (price, stock_status, url, scraped_at)
- Respect robots.txt et rate limiting (1 requête/2s)
Cible : catégorie smartphones. Code production-ready, commenté.
```

### Prompt 4 — Scrapers restants
```
En te basant sur mon BaseScraper existant [coller le code], crée le scraper
pour [MyTek / Spacenet] avec la même structure vendors/{nom}/
(scraper + selectors + mapper). Le site utilise du JS-rendering,
utilise Playwright en mode headless.
```

### Prompt 5 — Matching Engine
```
Crée un Product Matching Engine (TypeScript ou Python) avec pattern Strategy :
- Stratégie 1 : eanMatch (par référence constructeur/EAN si disponible)
- Stratégie 2 : fuzzyMatch (brand + model + specs : RAM/stockage/couleur,
  utiliser une lib de fuzzy string matching)
- Stratégie 3 : manualOverride (table de correspondances validées par l'admin)
- matchingEngine qui orchestre par priorité 1→2→3
- Score de confiance retourné ; en dessous d'un seuil, flag "à valider
  manuellement" pour le dashboard admin.
Inclus les tests unitaires avec cas réels (ex: "iPhone 15 128Go Noir"
vs "iPhone 15 128 Go Black").
```

### Prompt 6 — API
```
Crée l'API FastAPI en couches (routes → controllers → services → repositories) :
- GET /products/search?q=&filters= (avec tri par meilleur deal :
  prix + trust_score + shipping)
- GET /products/{id} (détail + toutes offres + historique prix)
- GET/POST/DELETE /favorites (auth requise)
- PATCH /favorites/{id}/tracking (toggle price_tracking)
- GET /admin/scrapers/status (protégé is_admin : dernier run, taux
  d'échec par vendeur)
- POST /offers/{id}/click (tracking affiliation, redirection vendeur)
Règle : seule la couche repositories touche la DB. Validation Pydantic partout.
```

### Prompt 7 — Frontend composants core
```
Crée en Next.js (App Router) + Tailwind les composants suivants, basés sur
un design minimal "search-first" :
1. SearchBar : debounce 300ms, type="search", suggestions
2. BestDealCard : badge "Meilleur prix" (bg accent), bordure accent 2px,
   image, nom, vendeur, prix TND grand format, indicateur "-X% vs moyenne"
   en vert, CTA unique "Voir l'offre"
3. OfferList : lignes vendeur/prix compactes, bordures fines
4. FilterPanel : replié par défaut derrière un bouton, slider budget,
   selects RAM/marque
5. PriceHistoryChart : courbe simple (Recharts)
Chaque composant gère explicitement les 3 états : loading (skeleton),
error (message + retry), success. Zones tactiles min 44px. Dark mode ready.
```

### Prompt 8 — Pages & états
```
Assemble les pages Next.js :
- / : homepage search-first (uniquement la barre de recherche centrée)
- /search?q= : BestDealCard + OfferList + FilterPanel, SSR pour le SEO
- /product/[id] : structure scroll progressif (prix+CTA → historique →
  vendeurs → specs repliées → similaires)
- /favorites : liste + toggle price_tracking par produit (auth requise)
Chaque page : Error Boundary, skeleton loading, gestion offline
(bannière + cache React Query), retry backoff sur les fetchs.
Config PWA (manifest + service worker basique).
```

### Prompt 9 — Dashboard admin
```
Crée la page /admin (protégée is_admin, mono-admin) avec :
- Statut des 3 scrapers : dernier run, nb produits collectés, taux d'échec
- File des matchings à valider (score de confiance bas) : interface
  approuver/rejeter/fusionner
- Stats globales : nb produits, nb offres, dernière mise à jour
UI simple, pas de lib de dashboard lourde.
```

### Prompt 10 — Tests & CI
```
Configure pour mon monorepo :
- Vitest : tests unitaires du matching engine et des services API
- Playwright : test e2e du parcours recherche → page produit → clic offre
- GitHub Actions : lint + typecheck + tests par app modifiée uniquement
  (Turborepo filtering), déploiement indépendant par app
- Sentry sur web et api
```

### Prompt 11 — SEO & performance
```
Optimise mon app Next.js (site TopSoum, domaine topsoum.com) pour le SEO tunisien :
- Landing pages statiques générées par requête populaire
  ("meilleur prix iphone 15 tunisie", "pc portable pas cher tunisie")
- Metadata dynamiques par produit (title format "{produit} au meilleur prix
  — TopSoum"), Open Graph, JSON-LD (schema.org Product + Offer, prix TND,
  organisation TopSoum)
- Sitemap dynamique sur topsoum.com/sitemap.xml
- next/image + WebP/AVIF, lazy loading
- Cible Lighthouse mobile > 90, TTI < 3s sur 4G
```

---

## 8. ROADMAP RÉCAPITULATIVE

### V1 (14 semaines)
| Semaines | Livrable |
|---|---|
| 1-2 | Fondations : DB, monorepo, Docker, NextAuth |
| 3-4 | Pipeline complet avec 1 scraper (Tunisianet) |
| 5-6 | 3 scrapers opérationnels |
| 7-8 | Matching engine |
| 9-10 | API complète (produits, favoris, admin) |
| 11-13 | Frontend (mockups validés) + PWA + états/erreurs |
| 14 | Dashboard admin + tests + mise en prod |

### V2 (6-12 mois)
- Alertes prix email/SMS (structure DB déjà prête via price_tracking)
- Marché informel : soumission communautaire de prix (décision finale à prendre)
- Extension navigateur
- App mobile native
- Avis vendeurs agrégés
- API publique B2B
- Placement sponsorisé (si décision de l'activer)
- Comparateur garanties/SAV local

---

## 9. POINTS D'ATTENTION PERMANENTS

1. **Le matching produit est le vrai défi**, pas le scraping — y consacrer le temps nécessaire
2. **Ne jamais afficher un prix douteux** sans le signaler ("prix en cours de mise à jour")
3. **Tester sur Android entrée de gamme** — réalité du parc mobile tunisien
4. **Privilégier les partenariats** avec les vendeurs plutôt que la guerre anti-scraping
5. **Chaque appel API = 3 états codés** (succès/erreur/chargement), sans exception
6. **Un seul accent couleur, un seul CTA dominant** par écran — la discipline design est ce qui différencie le site des concurrents surchargés
