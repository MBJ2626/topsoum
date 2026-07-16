export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

interface QueryLike<TData> {
  status: "pending" | "error" | "success";
  data: TData | undefined;
  error: Error | null;
}

/** Convertit un resultat React Query (status pending/error/success) en AsyncState, avec mapping optionnel des donnees. */
export function fromQuery<TData, TResult = TData>(
  query: QueryLike<TData>,
  map?: (data: TData) => TResult,
  errorFallback = "Une erreur est survenue.",
): AsyncState<TResult> {
  if (query.status === "pending") {
    return { status: "loading" };
  }
  if (query.status === "error") {
    return { status: "error", message: query.error?.message ?? errorFallback };
  }
  const data = query.data as TData;
  return { status: "success", data: map ? map(data) : (data as unknown as TResult) };
}
