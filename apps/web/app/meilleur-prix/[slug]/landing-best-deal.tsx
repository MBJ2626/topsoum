"use client";

import { BestDealCard, type BestDealCardData } from "@/features/product-listing/components/BestDealCard";
import { useOfferClick } from "@/lib/use-offer-click";

// La reponse de la landing : meme face de boite que la recherche, rendue des
// le HTML initial (donnees serveur), avec le suivi de clic affiliation.
export function LandingBestDeal({ data }: { data: BestDealCardData }) {
  const offerClick = useOfferClick();
  return (
    <BestDealCard
      state={{ status: "success", data }}
      onRetry={() => window.location.reload()}
      onViewOffer={(offerId) => offerClick.mutate(offerId)}
    />
  );
}
