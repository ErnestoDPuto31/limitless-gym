import { getReportData } from "@/app/actions/reportActions";
import ReportDashboardClient from "./ReportDashboardClient";
import "@/app/styles/fonts.css"; 

export const revalidate = 0; 

export default async function ReportsAdminPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      {/* RENDER TOP CAPTION LAYOUT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2.5xl font-black text-white uppercase tracking-wide">REPORTS</h1>
          <p className="text-[12px] text-neutral-500 font-semibold tracking-wide">
            Track total revenue breakdowns, monitor walk-in counts, and audit system financial logs
          </p>
        </div>
      </div>

      {/* DASHBOARD ENTRY VIEW ELEMENT */}
      <ReportDashboardClient initialData={data} />
    </div>
  );
}