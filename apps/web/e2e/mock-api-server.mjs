// Serveur mock minimal (Node http natif, sans dependance) simulant l'API
// FastAPI pour le test e2e Playwright. apps/web appelle l'API uniquement
// cote serveur (apiFetch dans lib/api-client.ts, "server-only") : Playwright
// ne peut pas intercepter ces requetes via page.route(), donc on pointe
// API_BASE_URL vers ce serveur pour la duree du test (voir playwright.config.ts).
//
// Ne sert que les 3 endpoints exerces par le parcours e2e "recherche -> fiche
// produit -> clic offre" : le reste (favoris, admin...) n'est pas atteint par
// un utilisateur anonyme sur ce parcours.
import { createServer } from "node:http";

import { BEST_DEAL_URL, PRODUCT_ID, SECOND_OFFER_URL } from "./fixtures.mjs";

const bestDeal = {
  id: "e2e-offer-best",
  vendor_id: "e2e-vendor-1",
  vendor_name: "TestVendor Un",
  price: 100,
  currency: "TND",
  stock_status: "in_stock",
  url: BEST_DEAL_URL,
  shipping_cost: null,
  scraped_at: "2026-07-15T10:00:00+00:00",
};

const secondOffer = {
  id: "e2e-offer-second",
  vendor_id: "e2e-vendor-2",
  vendor_name: "TestVendor Deux",
  price: 120,
  currency: "TND",
  stock_status: "in_stock",
  url: SECOND_OFFER_URL,
  shipping_cost: 7,
  scraped_at: "2026-07-15T10:00:00+00:00",
};

const searchResponse = {
  count: 1,
  results: [
    {
      id: PRODUCT_ID,
      canonical_name: "e2e-produit-test",
      brand: "TestBrand",
      model: "Modele E2E",
      category: "smartphones",
      image_url: null,
      best_deal: bestDeal,
      offers_count: 2,
    },
  ],
};

const detailResponse = {
  id: PRODUCT_ID,
  canonical_name: "e2e-produit-test",
  brand: "TestBrand",
  model: "Modele E2E",
  category: "smartphones",
  specs: {},
  image_url: null,
  best_deal: bestDeal,
  offers: [bestDeal, secondOffer],
  price_history: [],
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/products/search") {
    sendJson(res, 200, searchResponse);
    return;
  }

  if (req.method === "GET" && url.pathname === `/products/${PRODUCT_ID}`) {
    sendJson(res, 200, detailResponse);
    return;
  }

  if (req.method === "POST" && /^\/offers\/.+\/click$/.test(url.pathname)) {
    const offerId = url.pathname.split("/")[2];
    const offer = offerId === bestDeal.id ? bestDeal : secondOffer;
    sendJson(res, 200, { redirect_url: offer.url, vendor_name: offer.vendor_name });
    return;
  }

  sendJson(res, 404, { detail: "Not found (mock API)" });
});

const port = Number(process.env.MOCK_API_PORT ?? 4310);
server.listen(port, () => {
  // eslint-disable-next-line no-console -- serveur de test, log de demarrage utile en CI
  console.log(`Mock API server listening on http://localhost:${port}`);
});
