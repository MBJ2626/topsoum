// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { AggregateOffer, Offer, Organization, Product, WebSite, WithContext } from "schema-dts";
import { describe, expect, it } from "vitest";

import type { OfferSummary, ProductDetailResponse } from "@/lib/api-types";

import { JsonLd, productJsonLd, siteJsonLd } from "./json-ld";

const offer = (partial: Partial<OfferSummary>): OfferSummary => ({
  id: "o1",
  vendor_id: "v1",
  vendor_name: "Tunisianet",
  price: 1599,
  currency: "TND",
  stock_status: "in_stock",
  url: "https://www.tunisianet.com.tn/iphone-15.html",
  shipping_cost: null,
  scraped_at: "2026-10-03T08:00:00",
  ...partial,
});

const detail = (offers: OfferSummary[], partial: Partial<ProductDetailResponse> = {}): ProductDetailResponse => ({
  id: "p1",
  canonical_name: "apple-iphone-15-128go-noir",
  brand: "Apple",
  model: "iPhone 15 128Go Noir",
  category: "smartphones",
  specs: {},
  image_url: "https://spacenet.tn/1-large_default/iphone-15.jpg",
  best_deal: offers[0],
  offers,
  price_history: [],
  ...partial,
});

// Les types schema-dts (vocabulaire schema.org) valident la forme au typecheck.
function asProduct(value: ReturnType<typeof productJsonLd>): WithContext<Product> & { offers: AggregateOffer & { offers: Offer[] } } {
  if (value === null) throw new Error("JSON-LD attendu");
  return value as WithContext<Product> & { offers: AggregateOffer & { offers: Offer[] } };
}

describe("productJsonLd — Product + AggregateOffer en TND", () => {
  it("decrit le produit avec une URL absolue sur topsoum.com", () => {
    const ld = asProduct(productJsonLd(detail([offer({})])));

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Apple iPhone 15 128Go Noir");
    expect(ld.url).toBe("https://topsoum.com/product/p1");
    expect(ld.image).toEqual(["https://spacenet.tn/1-large_default/iphone-15.jpg"]);
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Apple" });
  });

  it("agrege les prix en TND, au format decimal schema.org (point, sans devise)", () => {
    const ld = asProduct(
      productJsonLd(detail([offer({ id: "a", price: 1599 }), offer({ id: "b", price: "1649.900" as unknown as number })])),
    );

    expect(ld.offers).toMatchObject({
      "@type": "AggregateOffer",
      priceCurrency: "TND",
      lowPrice: "1599",
      highPrice: "1649.9",
      offerCount: 2,
    });
    expect(ld.offers.offers.map((o) => [o.price, o.priceCurrency])).toEqual([
      ["1599", "TND"],
      ["1649.9", "TND"],
    ]);
  });

  it("chaque offre est neuve (itemCondition NewCondition)", () => {
    const ld = asProduct(productJsonLd(detail([offer({})])));
    expect(ld.offers.offers[0].itemCondition).toBe("https://schema.org/NewCondition");
  });

  it("nomme le revendeur et pointe vers sa fiche", () => {
    const ld = asProduct(productJsonLd(detail([offer({ vendor_name: "MyTek", url: "https://www.mytek.tn/x.html" })])));
    expect(ld.offers.offers[0]).toMatchObject({
      url: "https://www.mytek.tn/x.html",
      seller: { "@type": "Organization", name: "MyTek" },
    });
  });

  it("declare la disponibilite connue, et rien quand le stock est inconnu", () => {
    const ld = asProduct(
      productJsonLd(
        detail([
          offer({ id: "a", stock_status: "in_stock" }),
          offer({ id: "b", stock_status: "out_of_stock" }),
          offer({ id: "c", stock_status: "unknown" }),
        ]),
      ),
    );
    expect(ld.offers.offers.map((o) => o.availability)).toEqual([
      "https://schema.org/InStock",
      "https://schema.org/OutOfStock",
      undefined,
    ]);
  });

  it("exclut les prix douteux (<= 0) des offres et des bornes", () => {
    const ld = asProduct(productJsonLd(detail([offer({ id: "a", price: 0 }), offer({ id: "b", price: 1700 })])));
    expect(ld.offers).toMatchObject({ lowPrice: "1700", highPrice: "1700", offerCount: 1 });
  });

  it("aucun JSON-LD quand aucune offre n'a de prix fiable", () => {
    expect(productJsonLd(detail([offer({ price: 0 })]))).toBeNull();
  });

  it("omet l'image quand le produit n'en a pas", () => {
    const ld = asProduct(productJsonLd(detail([offer({})], { image_url: null })));
    expect(ld).not.toHaveProperty("image");
  });
});

describe("siteJsonLd — organisation TopSoum", () => {
  it("declare l'Organization et le WebSite TopSoum en fr-TN", () => {
    const [organization, website] = siteJsonLd() as [WithContext<Organization>, WithContext<WebSite>];
    expect(organization).toMatchObject({ "@type": "Organization", name: "TopSoum", url: "https://topsoum.com" });
    expect(website).toMatchObject({ "@type": "WebSite", name: "TopSoum", inLanguage: "fr-TN" });
  });
});

describe("JsonLd", () => {
  it("rend un script application/ld+json dont le contenu reparse a l'identique", () => {
    const data = siteJsonLd();
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(script?.textContent ?? "")).toEqual(data);
  });

  it("echappe '<' : un nom scrape ne peut pas fermer la balise script", () => {
    const html = render(<JsonLd data={{ name: "</script><img src=x onerror=alert(1)>" }} />).container.innerHTML;
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain("\\u003c/script>");
  });
});
