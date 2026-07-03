import React from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getPaginatedLogs } from "@/app/actions/attendanceActions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export const revalidate = 0;

export default async function AttendancePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const currentSearch = resolvedParams.search || "";

  const { logs, totalPages, totalCount } = await getPaginatedLogs({
    page: currentPage,
    search: currentSearch,
  });

  return (
    <div className="space-y-6 font-inter">
      {/* PANEL TITLES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground font-montserrat tracking-wide uppercase">
            Attendance History Logs
          </h2>
          <p className="text-[11px] text-muted-foreground font-semibold tracking-wide">
            Total Scans Logged: <span className="text-accent font-mono">{totalCount}</span>
          </p>
        </div>
      </div>

      {/* LOOKUP INPUT */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <form method="GET" className="relative max-w-md w-full flex items-center">
          <input type="hidden" name="page" value="1" />
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Search scans via Member Name..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-accent/40 transition-colors"
          />
        </form>
      </div>

      {/* MATRIX DISPATCH GRID */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="py-4 px-6">Timestamp Entry</th>
                <th className="py-4 px-6">Member ID</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Account Type Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-semibold text-muted-foreground">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground font-mono text-[11px]">
                    No access entry timestamps found match criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log: unknown) => (
                  <tr key={(log as { id: string }).id} className="hover:bg-background/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      {new Date((log as { check_in_time: string }).check_in_time).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="py-4 px-6 font-mono tracking-wider text-muted-foreground">
                      { (log as { members?: { member_id: string } }).members?.member_id || "DELETED ACCOUNT" }
                    </td>
                    <td className="py-4 px-6 text-foreground font-bold">
                      { (log as { members?: { full_name: string } }).members?.full_name || "Unknown Member" }
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        (log as { members?: { status: string } }).members?.status === "active"
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        { (log as { members?: { status: string } }).members?.status || "inactive" }
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* LEDGER PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 bg-background/30 border-t border-border flex items-center justify-between gap-4">
            <span className="text-[11px] text-muted-foreground font-semibold">
              Log Segment <span className="text-foreground font-bold font-mono">{currentPage}</span> of{" "}
              <span className="text-foreground font-bold font-mono">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Link
                href={{
                  pathname: "/admin/attendance",
                  query: {
                    page: Math.max(1, currentPage - 1),
                    ...(currentSearch && { search: currentSearch }),
                  },
                }}
                className={`p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors ${
                  currentPage <= 1 ? "pointer-events-none opacity-30" : "bg-background"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>

              <Link
                href={{
                  pathname: "/admin/attendance",
                  query: {
                    page: Math.min(totalPages, currentPage + 1),
                    ...(currentSearch && { search: currentSearch }),
                  },
                }}
                className={`p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors ${
                  currentPage >= totalPages ? "pointer-events-none opacity-30" : "bg-background"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}