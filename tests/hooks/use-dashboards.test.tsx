import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// Deterministic network + silence toasts (the mutation hook calls sonner on success/error).
vi.mock("@/services/mock/network", () => ({
  withRead: async <T,>(op: () => T) => op(),
  withWrite: async <T,>(op: () => T) => op(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useCreateDashboard } from "@/hooks/use-dashboard-mutations";
import { useDashboards } from "@/hooks/use-dashboards";

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useDashboards (query hook wiring)", () => {
  it("resolves the seeded dashboard list through the service layer", async () => {
    const { result } = renderHook(() => useDashboards(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.items.length).toBeGreaterThan(0);
  });
});

describe("useCreateDashboard (mutation hook wiring)", () => {
  it("creates a dashboard owned by the principal", async () => {
    const { result } = renderHook(() => useCreateDashboard(), { wrapper: makeWrapper() });
    const created = await result.current.mutateAsync({ name: "Hook-made", tags: ["h"] });
    expect(created.name).toBe("Hook-made");
    expect(created.can_mutate).toBe(true);
  });
});
