// Formes JSON exactes renvoyees par apps/api (voir apps/api/app/schemas/*.py).
// Distinct de @topsoum/shared-types (qui reflete les modeles Prisma cote
// serveur, en camelCase) : ici on modelise le contrat HTTP reel, en
// snake_case, tel que consomme par le frontend.

export interface OfferSummary {
  id: string;
  vendor_id: string;
  vendor_name: string;
  price: number;
  currency: string;
  stock_status: "in_stock" | "out_of_stock" | "unknown";
  url: string;
  shipping_cost: number | null;
  scraped_at: string;
}

export interface ProductSearchResult {
  id: string;
  canonical_name: string;
  brand: string;
  model: string;
  category: string;
  image_url: string | null;
  best_deal: OfferSummary;
  offers_count: number;
}

export interface ProductSearchResponse {
  count: number;
  results: ProductSearchResult[];
}

export interface PricePoint {
  offer_id: string;
  price: number;
  recorded_at: string;
}

export interface ProductDetailResponse {
  id: string;
  canonical_name: string;
  brand: string;
  model: string;
  category: string;
  specs: Record<string, unknown>;
  image_url: string | null;
  best_deal: OfferSummary;
  offers: OfferSummary[];
  price_history: PricePoint[];
}

export interface FavoriteOut {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  price_tracking: boolean;
  created_at: string;
  best_offer_price: number | null;
  best_offer_vendor: string | null;
}

export interface FavoriteListResponse {
  count: number;
  results: FavoriteOut[];
}

export type ScraperRunStatus = "success" | "partial" | "failed" | "running";

export interface ScraperVendorStatus {
  vendor_name: string;
  last_run_started_at: string | null;
  last_run_finished_at: string | null;
  last_run_status: ScraperRunStatus | null;
  products_collected: number | null;
  success_count: number | null;
  error_count: number | null;
  failure_rate: number | null;
}

export interface ScrapersStatusResponse {
  vendors: ScraperVendorStatus[];
}

export interface AdminStatsResponse {
  total_products: number;
  total_offers: number;
  last_updated_at: string | null;
}

export interface PendingMatchProductSummary {
  id: string;
  canonical_name: string;
  brand: string;
  model: string;
  image_url: string | null;
}

export interface PendingMatchOut {
  id: string;
  vendor_slug: string;
  external_id: string | null;
  reference: string | null;
  offer_product_name: string;
  category: string;
  confidence: number;
  strategy: string;
  created_at: string;
  created_product: PendingMatchProductSummary;
  candidate_product: PendingMatchProductSummary;
}

export interface PendingMatchListResponse {
  count: number;
  results: PendingMatchOut[];
}

export type MatchActionStatus = "approved" | "rejected" | "merged";

export interface MatchActionResponse {
  id: string;
  status: MatchActionStatus;
}

export interface MergeMatchRequest {
  target_product_id: string;
}
