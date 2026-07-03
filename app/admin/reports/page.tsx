import { getReportData } from "@/app/actions/reportActions";
import ReportDashboardClient from "./ReportDashboardClient";

export const revalidate = 0; 

export default async function ReportsAdminPage() {
  const data = await getReportData();

  // Format system display timestamp string matching your design spec format
  const systemDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="space-y-6 font-inter">
      {/* RENDER TOP CAPPTION LAYOUT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground font-montserrat tracking-tight uppercase">
            Reports & Analytics
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            System Data Frame: <span className="text-foreground/80 font-bold">{systemDateString}</span>
          </p>
        </div>
      </div>

      {/* DASHBOARD ENTRY VIEW ELEMENT */}
      <ReportDashboardClient initialData={data} />
    </div>
  );
}