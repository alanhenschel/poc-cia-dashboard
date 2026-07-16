import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WidgetResult, WidgetResultData } from "@/types";
import { WidgetResultView } from "./widget-result-view";

// Stub the Recharts renderer — this suite tests the state SWITCH, not chart drawing (which needs a
// real layout box jsdom doesn't provide).
vi.mock("@/components/chart/chart-renderer", () => ({
  ChartRenderer: () => <div data-testid="chart-renderer" />,
}));

const DATA: WidgetResultData = {
  visualization_type: "line",
  unit: "unique_customers",
  series: [{ label: "iOS", points: [{ ts: "2026-01-01T00:00:00Z", value: 10 }] }],
};

const okResult = (state: "ok" | "stale"): WidgetResult => ({
  state,
  widget_id: "w1",
  chart_id: "c1",
  query_hash: "sha256:abc",
  computed_at: "2026-01-01T00:00:00Z",
  ttl_expires_at: "2026-01-01T00:05:00Z",
  is_stale: state === "stale",
  source: "cache",
  data: DATA,
});

const noop = () => {};

afterEach(cleanup);

describe("WidgetResultView state rendering", () => {
  it("loading: shows a loading state before any result", () => {
    render(<WidgetResultView result={undefined} isLoading error={null} onRetry={noop} />);
    expect(screen.getByText("Loading widget…")).toBeTruthy();
  });

  it("network error: shows a retryable failure when there is no result", () => {
    render(
      <WidgetResultView result={undefined} isLoading={false} error={new Error("boom")} onRetry={noop} />,
    );
    expect(screen.getByText("Couldn't load")).toBeTruthy();
    expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy();
  });

  it("ok: renders the chart", () => {
    render(<WidgetResultView result={okResult("ok")} isLoading={false} error={null} onRetry={noop} />);
    expect(screen.getByTestId("chart-renderer")).toBeTruthy();
  });

  it("stale: still renders the chart (the stale badge lives on the card header, not here)", () => {
    render(<WidgetResultView result={okResult("stale")} isLoading={false} error={null} onRetry={noop} />);
    expect(screen.getByTestId("chart-renderer")).toBeTruthy();
  });

  it("chart_unavailable: shows the unavailable message", () => {
    render(
      <WidgetResultView
        result={{ state: "chart_unavailable", widget_id: "w1", chart_id: "c1" }}
        isLoading={false}
        error={null}
        onRetry={noop}
      />,
    );
    expect(screen.getByText("Chart unavailable")).toBeTruthy();
    expect(screen.queryByTestId("chart-renderer")).toBeNull();
  });

  it("filter_conflict: shows the no-data-for-filters message", () => {
    render(
      <WidgetResultView
        result={{ state: "filter_conflict", widget_id: "w1", chart_id: "c1" }}
        isLoading={false}
        error={null}
        onRetry={noop}
      />,
    );
    expect(screen.getByText("No data for these filters")).toBeTruthy();
  });

  it("rate_limited: shows the rate-limit message with the retry-after and a retry action", () => {
    render(
      <WidgetResultView
        result={{ state: "rate_limited", widget_id: "w1", chart_id: "c1", retry_after_seconds: 9 }}
        isLoading={false}
        error={null}
        onRetry={noop}
      />,
    );
    expect(screen.getByText("Rate limited")).toBeTruthy();
    expect(screen.getByText(/9s/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /retry now/i })).toBeTruthy();
  });

  it("forbidden: shows the no-access message", () => {
    render(
      <WidgetResultView
        result={{ state: "forbidden", widget_id: "w1", chart_id: "c1" }}
        isLoading={false}
        error={null}
        onRetry={noop}
      />,
    );
    expect(screen.getByText("No access")).toBeTruthy();
  });
});
