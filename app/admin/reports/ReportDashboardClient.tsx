"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Download, ArrowUpDown, ShieldAlert, Trash2, X, AlertOctagon, ChevronLeft, ChevronRight } from "lucide-react";
import { deletePaymentRecord, bulkDeletePayments } from "@/app/actions/reportActions";

// ─── TYPESCRIPT INTERFACES ───
export interface PaymentRecord {
  id: string;
  payer_name: string;
  tx_type: string;
  amount: number;
  created_at: string;
  members?: { member_id: string } | null;
}

export interface ReportData {
  success: boolean;
  stats: unknown;
  payments: PaymentRecord[];
  topMembers: unknown[];
  chartData: {
    labels: string[];
    revenue: number[];
    logins: number[];
  };
}

type ModalState = "hard" | "hard_all" | null;

// ─── HELPER FORMATTER ───
const formatTxType = (type: string) => {
  const normalized = type.toLowerCase().trim();
  if (normalized === "walk_in" || normalized === "walk in") return "WALK IN";
  if (normalized === "registration") return "REGISTRATION";
  if (normalized === "renewal") return "RENEWAL";
  return type.toUpperCase();
};

export default function ReportDashboardClient({ initialData }: { initialData: ReportData }) {
  const [period, setPeriod] = useState<number>(7);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  const [selectedTx, setSelectedTx] = useState<PaymentRecord | null>(null);
  const [modalMode, setModalMode] = useState<ModalState>(null);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ─── AGGREGATE TOTALS ───
  const totalRevenue = useMemo(() => 
    initialData.chartData.revenue.reduce((sum, current) => sum + current, 0), 
  [initialData.chartData.revenue]);

  const totalLogins = useMemo(() => 
    initialData.chartData.logins.reduce((sum, current) => sum + current, 0), 
  [initialData.chartData.logins]);

  // ─── SORTING LOGIC ───
  const processedPayments = useMemo(() => {
    const list = [...initialData.payments];
    list.sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "amount") return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      if (sortBy === "name") {
        const nameA = a.payer_name || "";
        const nameB = b.payer_name || "";
        return sortOrder === "desc" ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
      return 0;
    });
    return list;
  }, [initialData.payments, sortBy, sortOrder]);

  const toggleSort = (field: "date" | "amount" | "name") => {
    setCurrentPage(1); // Reset to page 1 directly here instead of using useEffect
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else { 
      setSortBy(field); 
      setSortOrder("desc"); 
    }
  };
  // ─── PAGINATION LOGIC ───
  const totalPages = Math.ceil(processedPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPayments.slice(start, start + itemsPerPage);
  }, [processedPayments, currentPage]);

  // ─── CSV EXPORT WITH TOTALS ───
  const exportToCSV = () => {
    const headers = ["Transaction ID", "Member ID Mapping", "Payer Name", "Transaction Type", "Amount (₱)", "Timestamp"];
    const rows = processedPayments.map((p) => [
      p.id,
      p.members?.member_id || "N/A",
      p.payer_name,
      formatTxType(p.tx_type),
      p.amount.toString(),
      new Date(p.created_at).toLocaleString(),
    ]);

    const summaryRows = [
      ["", "", "", "", "", ""],
      ["--- SUMMARY DATA ---", "", "", "", "", ""],
      ["Total Period Revenue:", "", "", "", `₱ ${totalRevenue}`, ""],
      ["Total Period Logins:", "", "", "", `${totalLogins} logins`, ""]
    ];

    const csvContent = [headers, ...rows, ...summaryRows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Gym_Financial_Ledger_${period}_Days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── ACTION EXECUTION ───
  const executeAction = async () => {
    setIsProcessing(true);
    setErrorMessage("");
    let res: { success: boolean; error: string } = { success: false, error: "Invalid action" };

    if (modalMode === "hard_all") {
      const result = await bulkDeletePayments(adminPassword);
      res = { success: result.success, error: result.error ?? "Unknown error" };
    } else if (selectedTx && modalMode === "hard") {
      const result = await deletePaymentRecord(selectedTx.id, adminPassword);
      res = { success: result.success, error: result.error ?? "Unknown error" };
    }

    if (res.success) window.location.reload();
    else setErrorMessage(res.error);
    
    setIsProcessing(false);
  };

  // ─── CHART MATH MODEL ───
  const maxRevenue = Math.max(...initialData.chartData.revenue, 1000); 
  const maxLogins = Math.max(...initialData.chartData.logins, 10); 

  // Fixed robust SVG generation using a strict 100x100 viewBox grid
  const generateRobustLinePoints = (data: number[], max: number) => {
    if (data.length === 0) return "";
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (val / max) * 100;
      return `${x},${y}`;
    }).join(" ");
  };
  const loginPoints = generateRobustLinePoints(initialData.chartData.logins, maxLogins);

  return (
    <div className="space-y-6 font-inter text-foreground">
      
      {/* HEADER CONTROLS */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none text-foreground focus:border-accent/40"
          >
            <option value={7}>Last 7 Days (Weekly)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-accent hover:opacity-90 text-accent-foreground font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export to CSV
          </button>
          <button 
            onClick={() => setModalMode("hard_all")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <AlertOctagon className="h-3.5 w-3.5" /> Purge All
          </button>
        </div>
      </div>

      {/* DYNAMIC CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REVENUE HISTOGRAM */}
        <div className="bg-card border border-border rounded-2xl p-6 relative flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Real-Time Daily Revenue</h4>
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Total Volume</span>
              <span className="text-lg font-black text-accent font-mono leading-none">₱ {totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 pt-4 px-2 min-h-40">
            {initialData.chartData.revenue.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] font-mono font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-background/80 px-1.5 py-0.5 rounded border border-border">
                  ₱{val}
                </div>
                <div 
                  style={{ height: `${Math.max((val / maxRevenue) * 100, 2)}%` }} 
                  className="w-full bg-accent rounded-sm transition-all duration-700 hover:opacity-80 relative"
                />
                <span className="text-[10px] text-muted-foreground font-semibold mt-2">
                  {initialData.chartData.labels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LOGINS LINE CHART (FIXED) */}
        <div className="bg-card border border-border rounded-2xl p-6 relative flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Real-Time Daily Logins</h4>
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Total Logins</span>
              <span className="text-lg font-black text-cyan-400 font-mono leading-none">{totalLogins} <span className="text-xs text-muted-foreground">LOGINS</span></span>
            </div>
          </div>
          <div className="flex-1 relative pt-4 min-h-40 pb-6">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-[calc(100%-24px)] overflow-visible">
              <polygon
                points={`0,100 ${loginPoints} 100,100`}
                fill="var(--color-accent)"
                className="opacity-10 transition-all duration-700"
              />
              <polyline
                points={loginPoints}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                className="opacity-90 transition-all duration-700"
                vectorEffect="non-scaling-stroke"
              />
              {initialData.chartData.logins.map((val, i) => {
                const x = (i / (initialData.chartData.logins.length - 1)) * 100;
                const y = 100 - (val / maxLogins) * 100;
                return (
                  <g key={i} className="group">
                    <circle cx={x} cy={y} r="1.5" fill="var(--color-background)" stroke="var(--color-accent)" strokeWidth="1" vectorEffect="non-scaling-stroke" className="transition-all duration-300" />
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] text-muted-foreground font-semibold">
              {initialData.chartData.labels.map((day, i) => <span key={i}>{day}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION LEDGER TABLE WITH PAGINATION */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-background/20 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Financial Audit Ledger Trail</h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
            Total Records: {processedPayments.length}
          </span>
        </div>
        
        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="py-4 px-6 cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                  Payer Identity & ID <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6">Method Block</th>
                <th className="py-4 px-6 cursor-pointer hover:text-foreground" onClick={() => toggleSort("amount")}>
                  Volume <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-foreground" onClick={() => toggleSort("date")}>
                  Precise Timestamp <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6 text-right">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-semibold text-muted-foreground">
              {paginatedPayments.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground font-mono text-[11px]">No processed records found.</td></tr>
              ) : (
                paginatedPayments.map((tx: PaymentRecord) => (
                  <tr key={tx.id} className="hover:bg-background/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{tx.payer_name}</div>
                      {tx.members?.member_id && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {tx.members.member_id}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent rounded text-[9px] font-black tracking-widest">
                        {formatTxType(tx.tx_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-accent text-sm">₱ {tx.amount}</td>
                    <td className="py-4 px-6 font-mono text-[11px] text-foreground/80 tracking-tight">
                      {new Date(tx.created_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => { setSelectedTx(tx); setModalMode("hard"); }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 bg-background/20 border-t border-border flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-background border border-border rounded-lg text-foreground hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-background border border-border rounded-lg text-foreground hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SYSTEM SECURITY CONSOLE OVERLAY DIALOGS */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-destructive/30 rounded-2xl p-8 relative shadow-2xl">
            <button onClick={() => { setModalMode(null); setSelectedTx(null); setErrorMessage(""); setAdminPassword(""); }} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 mb-3">
                  {modalMode === "hard_all" ? <AlertOctagon className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                </div>
                <h3 className="text-lg font-black font-montserrat text-destructive uppercase tracking-wide">
                  {modalMode === "hard_all" ? "Nuclear Purge Authorization" : "Hard Delete Authentication"}
                </h3>
                
                {modalMode === "hard_all" && (
                  <p className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 mt-2 rounded-lg">
                    ⚠️ CRITICAL: Ensure you have exported the ledger to CSV before proceeding.
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-3 px-2">
                  {modalMode === "hard_all" 
                    ? "Executing severe structural data clearance for ALL records. This obliterates database tables and CANNOT be reversed." 
                    : `Executing clearance for amount ₱ ${selectedTx?.amount}. This cannot be reversed.`}
                </p>
              </div>

              {errorMessage && <div className="text-xs font-bold text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-center">{errorMessage}</div>}

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase text-destructive/80 tracking-widest text-center">Enter Master Password</label>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-background border border-destructive/30 rounded-xl px-4 py-3 text-center text-sm font-medium text-foreground outline-none focus:border-destructive tracking-widest" />
                <button onClick={executeAction} disabled={isProcessing || !adminPassword} className="w-full py-3.5 bg-destructive text-destructive-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-40 cursor-pointer">
                  {isProcessing ? "PURGING FROM STORAGE..." : "AUTHORIZE DESTRUCTIVE REMOVAL"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}