"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api-error";

/**
 * TanStack Query configuration for the whole app.
 * - `staleTime` 30s pairs with the backend's freshness/`is_stale` metadata so we don't refetch
 *   more aggressively than the cache is designed for.
 * - Do NOT retry 4xx (forbidden/not-found/unprocessable) — only transient 5xx are worth retrying.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session, created lazily so it isn't shared across requests on the server.
  const [queryClient] = useState(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
