"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { QUERY_DEFAULTS } from "@/lib/query-retry";

import { ServiceWorkerRegistration } from "./service-worker-registration";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: QUERY_DEFAULTS,
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      <OfflineBanner />
      {children}
    </QueryClientProvider>
  );
}
