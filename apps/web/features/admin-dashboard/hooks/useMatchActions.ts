"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { MatchActionResponse } from "@/lib/api-types";

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
  return response.json() as Promise<T>;
}

function useInvalidateAfterAction() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin-pending-matches"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };
}

export function useApproveMatch() {
  const invalidate = useInvalidateAfterAction();
  return useMutation({
    mutationFn: async (matchId: string): Promise<MatchActionResponse> => {
      const response = await fetch(`/api/admin/matching/${matchId}/approve`, { method: "POST" });
      return parseJsonOrThrow<MatchActionResponse>(response, "Impossible d'approuver ce match.");
    },
    onSuccess: invalidate,
  });
}

export function useRejectMatch() {
  const invalidate = useInvalidateAfterAction();
  return useMutation({
    mutationFn: async (matchId: string): Promise<MatchActionResponse> => {
      const response = await fetch(`/api/admin/matching/${matchId}/reject`, { method: "POST" });
      return parseJsonOrThrow<MatchActionResponse>(response, "Impossible de rejeter ce match.");
    },
    onSuccess: invalidate,
  });
}

export function useMergeMatch() {
  const invalidate = useInvalidateAfterAction();
  return useMutation({
    mutationFn: async ({
      matchId,
      targetProductId,
    }: {
      matchId: string;
      targetProductId: string;
    }): Promise<MatchActionResponse> => {
      const response = await fetch(`/api/admin/matching/${matchId}/merge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target_product_id: targetProductId }),
      });
      return parseJsonOrThrow<MatchActionResponse>(response, "Impossible de fusionner vers ce produit.");
    },
    onSuccess: invalidate,
  });
}
