"use client";

import { useState } from "react";

import type { AsyncState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductImage } from "@/components/ui/ProductImage";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useApproveMatch, useMergeMatch, useRejectMatch } from "@/features/admin-dashboard/hooks/useMatchActions";
import { useProductPicker } from "@/features/admin-dashboard/hooks/useProductPicker";
import type { PendingMatchOut, PendingMatchProductSummary } from "@/lib/api-types";
import { productDisplayName } from "@/lib/product-name";

interface MatchingQueueProps {
  state: AsyncState<PendingMatchOut[]>;
  onRetry: () => void;
}

function ProductSummaryCard({ label, product }: { label: string; product: PendingMatchProductSummary }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <div className="relative h-12 w-12 flex-none overflow-hidden rounded-lg bg-gray-50">
        {product.image_url ? (
          <ProductImage src={product.image_url} alt={product.model} sizes="48px" />
        ) : null}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">
          {productDisplayName(product)}
        </p>
      </div>
    </div>
  );
}

function MergePicker({ matchId, onDone }: { matchId: string; onDone: () => void }) {
  const [query, setQuery] = useState("");
  const pickerQuery = useProductPicker(query);
  const mergeMatch = useMergeMatch();

  return (
    <div className="flex flex-col gap-2 rounded-card border border-gray-200 p-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Chercher le produit cible..."
        className="min-h-[44px] rounded-full border border-gray-300 px-4 text-sm"
      />

      {pickerQuery.status === "pending" && query.trim().length > 1 ? (
        <p className="text-xs text-gray-500">Recherche...</p>
      ) : null}

      {pickerQuery.status === "error" ? <p className="text-xs text-red-600">Recherche impossible.</p> : null}

      {pickerQuery.status === "success" ? (
        <ul className="flex flex-col gap-1">
          {pickerQuery.data.results.length === 0 ? (
            <li className="text-xs text-gray-500">Aucun produit trouve.</li>
          ) : (
            pickerQuery.data.results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  disabled={mergeMatch.isPending}
                  onClick={() => mergeMatch.mutate({ matchId, targetProductId: result.id }, { onSuccess: onDone })}
                  className="min-h-[44px] w-full rounded-lg px-2 text-left text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                >
                  {productDisplayName(result)}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {mergeMatch.isError ? <p className="text-xs text-red-600">Echec de la fusion, reessaie.</p> : null}
    </div>
  );
}

function PendingMatchRow({ match }: { match: PendingMatchOut }) {
  const [mergeOpen, setMergeOpen] = useState(false);
  const approveMatch = useApproveMatch();
  const rejectMatch = useRejectMatch();

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ProductSummaryCard label="Produit cree par l'ETL" product={match.created_product} />
        <ProductSummaryCard label="Candidat suggere" product={match.candidate_product} />
      </div>

      <p className="text-xs text-gray-500">
        Confiance {Math.round(match.confidence * 100)}% — strategie {match.strategy} — {match.vendor_slug}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          className="text-xs"
          disabled={approveMatch.isPending}
          onClick={() => approveMatch.mutate(match.id)}
        >
          Approuver
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          disabled={rejectMatch.isPending}
          onClick={() => rejectMatch.mutate(match.id)}
        >
          Rejeter
        </Button>
        <Button variant="secondary" className="text-xs" onClick={() => setMergeOpen((open) => !open)}>
          Fusionner
        </Button>
      </div>

      {approveMatch.isError ? <p className="text-xs text-red-600">Echec de l&apos;approbation, reessaie.</p> : null}
      {rejectMatch.isError ? <p className="text-xs text-red-600">Echec du rejet, reessaie.</p> : null}

      {mergeOpen ? <MergePicker matchId={match.id} onDone={() => setMergeOpen(false)} /> : null}
    </li>
  );
}

export function MatchingQueue({ state, onRetry }: MatchingQueueProps) {
  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((row) => (
          <SkeletonBlock key={row} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorState message="Impossible de charger la file de matching a valider." onRetry={onRetry} />;
  }

  const { data } = state;

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">Aucun match a valider pour le moment.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-card border border-gray-100">
      {data.map((match) => (
        <PendingMatchRow key={match.id} match={match} />
      ))}
    </ul>
  );
}
