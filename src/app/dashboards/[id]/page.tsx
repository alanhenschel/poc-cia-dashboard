import { DashboardView } from "@/components/dashboard/dashboard-view";

/**
 * Canonical dashboard URL — the sole sharing mechanism (Epic 9).
 * Next 16: `params` is a Promise and must be awaited. This thin server component resolves the id
 * and hands off to the interactive client view.
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DashboardView id={id} />;
}
