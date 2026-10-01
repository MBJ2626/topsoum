import { expect, test } from "@playwright/test";

import { BEST_DEAL_URL, PRODUCT_ID, SECOND_OFFER_URL } from "./fixtures.mjs";

test("recherche -> resultats -> fiche produit -> clic offre -> redirection vendeur", async ({ page, context }) => {
  // "vendor-e2e-test.example" n'existe pas reellement : on intercepte toute
  // navigation vers ce domaine pour eviter une vraie resolution DNS (qui
  // echouerait) tout en verifiant que l'URL ciblee est bien la bonne.
  await context.route("https://vendor-e2e-test.example/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Vendeur (mock)</body></html>" }),
  );

  await page.goto("/");
  await expect(page.getByRole("link", { name: "TopSoum" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const searchInput = page.getByTestId("search-input");
  await searchInput.fill("iPhone 15");
  await searchInput.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=iPhone/);
  await expect(page.getByTestId("best-deal-card")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Autres vendeurs" })).toBeVisible();

  const [bestDealPopup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByTestId("best-deal-view-offer").click(),
  ]);
  await bestDealPopup.waitForLoadState();
  expect(bestDealPopup.url()).toBe(BEST_DEAL_URL);
  await bestDealPopup.close();

  await page.goto(`/product/${PRODUCT_ID}`);
  await expect(page.getByTestId("best-deal-card")).toBeVisible();

  const otherOfferButton = page.getByTestId("offer-row").getByTestId("offer-row-view-offer").first();
  const [otherOfferPopup] = await Promise.all([page.waitForEvent("popup"), otherOfferButton.click()]);
  await otherOfferPopup.waitForLoadState();
  expect(otherOfferPopup.url()).toBe(SECOND_OFFER_URL);
  await otherOfferPopup.close();
});
