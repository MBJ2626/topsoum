export type {
  User,
  Product,
  Offer,
  Vendor,
  PriceHistory,
  Favorite,
  AuthProvider,
  StockStatus,
} from "@topsoum/db-schema";

/**
 * Format standard produit par tous les scrapers (apps/scrapers/vendors/*),
 * consomme par le pipeline ETL avant normalisation et chargement en DB.
 */
export interface ScrapedOffer {
  vendor: string;
  externalId: string;
  productName: string;
  brand: string | null;
  category: string;
  reference: string | null;
  price: number;
  currency: string;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  url: string;
  imageUrl: string | null;
  shippingCost: number | null;
  scrapedAt: string;
}
