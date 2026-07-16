import { PageHeader } from "@/components/common/page-header";
import { CreateDashboardDialog } from "@/components/dashboard/create-dashboard-dialog";
import { DashboardList } from "@/components/dashboard/dashboard-list";

export const metadata = {
  title: "Dashboards · CIA",
};

export default function DashboardsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dashboards"
        description="Composed views of your clickstream charts. Open one to view or edit."
        actions={<CreateDashboardDialog />}
      />
      <DashboardList />
    </div>
  );
}
