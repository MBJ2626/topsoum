"use client";

import { BusyMain } from "@/components/ui/BusyMain";
import { Panel } from "@/components/ui/Panel";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { OfferList } from "@/features/product-comparison/components/OfferList";
import { BestDealCard } from "@/features/product-listing/components/BestDealCard";

const LOADING = { status: "loading" } as const;
const noop = () => {};

// Affiche des la recherche lancee, pendant le rendu serveur des resultats.
export default function SearchLoading() {
  return (
    <BusyMain>
      <SkeletonLine className="h-5 w-1/2" />
      <BestDealCard state={LOADING} onRetry={noop} />
      <Panel title="Autres vendeurs">
        <OfferList state={LOADING} onRetry={noop} />
      </Panel>
    </BusyMain>
  );
}
