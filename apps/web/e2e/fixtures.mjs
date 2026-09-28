// Donnees partagees entre le serveur mock (e2e/mock-api-server.mjs) et les
// specs Playwright. Module pur (aucun effet de bord, pas de server.listen)
// pour pouvoir etre importe depuis un test sans jamais demarrer un serveur.
export const PRODUCT_ID = "e2e-product-1";
export const BEST_DEAL_URL = "https://vendor-e2e-test.example/produit-test";
export const SECOND_OFFER_URL = "https://vendor-e2e-test.example/produit-test-alt";
