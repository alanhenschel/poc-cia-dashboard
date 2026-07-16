"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { GRID_COLS, WIDGET_MIN_H, WIDGET_MIN_W } from "@/constants/grid";
import { useChartsByIds } from "@/hooks/use-charts";
import { useDashboard } from "@/hooks/use-dashboards";
import { useDashboardResults } from "@/hooks/use-dashboard-results";
import { useUpdateDashboard } from "@/hooks/use-dashboard-mutations";
import { useCopyChart } from "@/hooks/use-chart-mutations";
import { useDeleteWidget, useSaveLayout } from "@/hooks/use-widget-mutations";
import { isNotFound } from "@/lib/errors";
import {
  clampedMove,
  clampedResize,
  computeKeyboardCommit,
  type PositionMap,
} from "@/lib/grid-layout";
import { useDashboardEditorStore } from "@/stores/dashboard-editor.store";
import type { DashboardFilters, WidgetPosition } from "@/types";
import { AddWidgetDialog } from "./add-widget-dialog";
import { DashboardEditBar } from "./dashboard-edit-bar";
import { DashboardGrid } from "./dashboard-grid";
import { DashboardHeader } from "./dashboard-header";
import { DashboardViewSkeleton } from "./dashboard-view-skeleton";
import { GlobalFilterBar } from "./global-filter-bar";
import { WidgetCard } from "./widget-card";

/** Orchestrates a single dashboard: header, global filter, widget grid, and edit mode. */
export function DashboardView({ id }: { id: string }) {
  const dashboardQuery = useDashboard(id);
  const dashboard = dashboardQuery.data;

  const editor = useDashboardEditorStore();
  const updateDashboard = useUpdateDashboard(id);
  const saveLayout = useSaveLayout(id);
  const deleteWidget = useDeleteWidget(id);
  const copyChart = useCopyChart();

  // Resolve the charts referenced by this dashboard BY ID — not via the paginated list, which would
  // miss any chart past page 1 and mislabel a valid widget as "Unavailable chart".
  const chartIds = useMemo(
    () => (dashboard?.widgets ?? []).map((w) => w.chart_id),
    [dashboard?.widgets],
  );
  const chartsQuery = useChartsByIds(chartIds);
  const chartNameById = useMemo(
    () => new Map((chartsQuery.data ?? []).map((c) => [c.id, c.name])),
    [chartsQuery.data],
  );

  // Reset editor state whenever the dashboard identity changes.
  useEffect(() => {
    if (dashboard) editor.initialize(dashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.id]);

  // Re-baseline the draft layout when widgets are added/removed (keeps the draft in sync without
  // discarding edit mode). Keyed on the widget-id set so it does not fire on result polls.
  const widgetIdsKey = (dashboard?.widgets ?? []).map((w) => w.id).join(",");
  useEffect(() => {
    if (dashboard && editor.dashboardId === dashboard.id) editor.syncLayout(dashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetIdsKey]);

  const initialized = dashboard ? editor.dashboardId === dashboard.id : false;
  const filters: DashboardFilters | null = dashboard
    ? initialized
      ? editor.filters
      : dashboard.filters
    : null;
  const editMode = initialized ? editor.editMode : false;
  const layout = useMemo(() => {
    if (!dashboard) return {};
    if (initialized) return editor.layout;
    return Object.fromEntries(dashboard.widgets.map((w) => [w.id, w.position]));
  }, [dashboard, initialized, editor.layout]);
  const layoutDirty = initialized ? editor.layoutDirty : false;

  const resultsQuery = useDashboardResults(id, filters);
  const resultsByWidget = useMemo(
    () => new Map((resultsQuery.data?.items ?? []).map((r) => [r.widget_id, r])),
    [resultsQuery.data],
  );

  if (dashboardQuery.isPending) return <DashboardViewSkeleton />;

  if (dashboardQuery.isError || !dashboard) {
    if (isNotFound(dashboardQuery.error)) {
      return (
        <EmptyState
          icon={LayoutGrid}
          title="Dashboard not found"
          description="It may have been deleted, or the link is incorrect."
          action={
            <Button asChild>
              <Link href="/dashboards">Back to dashboards</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />;
  }

  const positionOf = (widgetId: string): WidgetPosition =>
    layout[widgetId] ??
    dashboard.widgets.find((w) => w.id === widgetId)?.position ?? { x: 0, y: 0, w: 6, h: 4 };

  const allPositions = (): PositionMap =>
    Object.fromEntries(dashboard.widgets.map((w) => [w.id, positionOf(w.id)]));

  /**
   * Commits a keyboard-driven position change. `computeKeyboardCommit` rejects overlaps (P1) AND
   * reconciles the accepted move with react-grid-layout's own vertical compaction, so the persisted
   * draft always equals what RGL renders (fixes the silent Y-move divergence). A no-op (e.g. a
   * downward move that compaction pulls back up) returns null and never dirties the layout.
   * This lives entirely in the keyboard path — `onLayoutChange` stays unwired, so fix #4 (add/remove
   * doesn't dirty) is preserved.
   */
  const commitKeyboard = (widgetId: string, target: WidgetPosition) => {
    const next = computeKeyboardCommit(allPositions(), widgetId, target, GRID_COLS);
    if (next) editor.setLayout(next);
  };

  const moveWidget = (widgetId: string, dx: number, dy: number) => {
    commitKeyboard(widgetId, clampedMove(positionOf(widgetId), dx, dy, GRID_COLS));
  };

  const resizeWidget = (widgetId: string, dw: number, dh: number) => {
    commitKeyboard(
      widgetId,
      clampedResize(positionOf(widgetId), dw, dh, GRID_COLS, WIDGET_MIN_W, WIDGET_MIN_H),
    );
  };

  const persistLayout = () => {
    const patches = dashboard.widgets.map((widget) => ({
      id: widget.id,
      position: positionOf(widget.id),
    }));
    saveLayout.mutate(patches, { onSuccess: () => editor.markLayoutSaved() });
  };

  const toggleEdit = () => {
    if (editMode && layoutDirty) persistLayout();
    editor.setEditMode(!editMode);
  };

  const draftPositions = Object.values(layout);

  return (
    <div className="grid gap-6">
      <DashboardHeader dashboard={dashboard} editMode={editMode} onToggleEdit={toggleEdit} />

      {filters ? (
        <GlobalFilterBar
          filters={filters}
          savedFilters={dashboard.filters}
          canMutate={dashboard.can_mutate}
          savePending={updateDashboard.isPending}
          onChange={(next) => editor.setFilters(next)}
          onSaveDefault={(next) => updateDashboard.mutate({ filters: next })}
        />
      ) : null}

      {editMode ? (
        <DashboardEditBar
          dashboardId={dashboard.id}
          positions={draftPositions}
          layoutDirty={layoutDirty}
          savePending={saveLayout.isPending}
          onSaveLayout={persistLayout}
        />
      ) : null}

      {dashboard.widgets.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No charts yet"
          description={
            dashboard.can_mutate
              ? "Add your first chart to start building this dashboard."
              : "This dashboard doesn't have any charts yet."
          }
          action={
            dashboard.can_mutate ? (
              <AddWidgetDialog dashboardId={dashboard.id} positions={draftPositions} />
            ) : undefined
          }
        />
      ) : (
        <DashboardGrid
          widgets={dashboard.widgets}
          layout={layout}
          editMode={editMode}
          onCommitLayout={(next) => editor.setLayout(next)}
          renderWidget={(widget) => (
            <WidgetCard
              widget={widget}
              chartName={chartNameById.get(widget.chart_id)}
              chartNamePending={chartsQuery.isPending}
              result={resultsByWidget.get(widget.id)}
              isLoading={resultsQuery.isPending}
              error={resultsQuery.error}
              editMode={editMode}
              copyPending={copyChart.isPending}
              onRetry={() => resultsQuery.refetch()}
              onRemove={() => deleteWidget.mutate(widget.id)}
              onCopyChart={(chartId) => copyChart.mutate(chartId)}
              onMove={(dx, dy) => moveWidget(widget.id, dx, dy)}
              onResize={(dw, dh) => resizeWidget(widget.id, dw, dh)}
            />
          )}
        />
      )}
    </div>
  );
}
