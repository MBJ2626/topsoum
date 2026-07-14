/**
 * Forme brute du JSON produit par un scraper (apps/scrapers/vendors/*),
 * snake_case car ecrit par du Python. Le pipeline ETL la normalise vers
 * ScrapedOffer (camelCase, @topsoum/shared-types) avant chargement en DB.
 */
export interface RawScrapedOffer {
  vendor: string;
  external_id: string;
  product_name: string;
  brand: string | null;
  category: string;
  reference: string | null;
  price: number;
  currency: string;
  stock_status: "in_stock" | "out_of_stock" | "unknown";
  url: string;
  image_url: string | null;
  shipping_cost: number | null;
  scraped_at: string;
}
