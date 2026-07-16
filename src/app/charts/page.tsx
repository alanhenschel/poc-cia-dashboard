import { PageHeader } from "@/components/common/page-header";
import { ChartList } from "@/components/chart/chart-list";
import { CreateChartDialog } from "@/components/chart/create-chart-dialog";

export const metadata = {
  title: "Charts · CIA",
};

export default function ChartsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Charts"
        description="Reusable, standalone charts. Add them to any dashboard, or copy one to make it yours."
        actions={<CreateChartDialog />}
      />
      <ChartList />
    </div>
  );
}
