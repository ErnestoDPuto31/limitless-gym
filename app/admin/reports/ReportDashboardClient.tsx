"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Download, ArrowUpDown, ShieldAlert, Trash2, X, AlertOctagon, ChevronLeft, ChevronRight, Loader2, Filter } from "lucide-react";
import { deletePaymentRecord, bulkDeletePayments, getReportData } from "@/app/actions/reportActions";

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

const formatTxType = (type: string) => {
  const normalized = type.toLowerCase().trim();
  if (normalized === "walk_in" || normalized === "walk in") return "WALK IN";
  if (normalized === "registration") return "REGISTRATION";
  if (normalized === "renewal") return "RENEWAL";
  return type.toUpperCase();
};

export default function ReportDashboardClient({ initialData }: { initialData: ReportData }) {
  const [reportMode, setReportMode] = useState<"7" | "30" | "month">("7");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [txFilter, setTxFilter] = useState<string>("ALL");

  const [reportData, setReportData] = useState<ReportData>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  const [selectedTx, setSelectedTx] = useState<PaymentRecord | null>(null);
  const [modalMode, setModalMode] = useState<ModalState>(null);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const todayLabel = useMemo(() => {
    const d = new Date();
    
    if (reportMode === "7") {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    }
    
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [reportMode]);

  useEffect(() => {
    let isMounted = true;
    
    async function refreshPeriodData() {
      setIsLoading(true);
      try {
        const payload = reportMode === "month" 
          ? { mode: "month", monthValue: selectedMonth } 
          : { mode: reportMode };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await getReportData(payload as any);
        if (updated.success && isMounted) {
          setReportData(updated as unknown as ReportData);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed loading data frame sync window", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    refreshPeriodData();
    
    return () => {
      isMounted = false;
    };
  }, [reportMode, selectedMonth]);

  const totalRevenue = useMemo(() => 
    (reportData?.chartData?.revenue || []).reduce((sum, current) => sum + current, 0), 
  [reportData?.chartData?.revenue]);

  const totalLogins = useMemo(() => 
    (reportData?.chartData?.logins || []).reduce((sum, current) => sum + current, 0), 
  [reportData?.chartData?.logins]);

  const processedPayments = useMemo(() => {
    let list = [...(reportData?.payments || [])];

    if (txFilter !== "ALL") {
      list = list.filter((p) => formatTxType(p.tx_type) === txFilter);
    }

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
  }, [reportData?.payments, sortBy, sortOrder, txFilter]);

  const toggleSort = (field: "date" | "amount" | "name") => {
    setCurrentPage(1);
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else { 
      setSortBy(field); 
      setSortOrder("desc"); 
    }
  };

  const totalPages = Math.ceil(processedPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPayments.slice(start, start + itemsPerPage);
  }, [processedPayments, currentPage]);

  const exportToCSV = () => {
    let periodText = reportMode === "7" ? "Last 7 Days" : "Last 30 Days";
    if (reportMode === "month") {
      periodText = `Specific Month (${selectedMonth})`;
    }

    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [
      ["--- EXECUTIVE REPORT SUMMARY ---"],
      ["Report Title", "Gym Financial & Traffic Ledger Matrix"],
      ["Report Period", periodText],
      ["Active Data Filter", txFilter],
      ["TOTAL LOGINS (PERIOD)", `${totalLogins} check-ins`],
      ["TOTAL REVENUE (PERIOD)", `PHP ${totalRevenue.toLocaleString()}`],
      [], 
      ["--- AUDIT DATA TRAIL ---"],
      ["TRANSACTION ID", "MEMBER ID", "PAYER NAME", "TRANSACTION TYPE", "AMOUNT (PHP)", "TIMESTAMP"]
    ];

    processedPayments.forEach((p) => {
      csvRows.push([
        escapeCSV(p.id),
        escapeCSV(p.members?.member_id || "WALK-IN / N/A"),
        escapeCSV(p.payer_name),
        escapeCSV(formatTxType(p.tx_type)),
        p.amount.toString(),
        escapeCSV(new Date(p.created_at).toLocaleString())
      ]);
    });

    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const fileSuffix = reportMode === "month" ? selectedMonth : `${reportMode}_Days`;
    link.setAttribute("download", `Gym_Ledger_${fileSuffix}_${txFilter.replace(/\s+/g, '_')}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const maxRevenue = Math.max(...(reportData?.chartData?.revenue || []), 1000); 
  const maxLogins = Math.max(...(reportData?.chartData?.logins || []), 10); 

  const linePoints = useMemo(() => {
    const data = reportData?.chartData?.logins || [];
    if (data.length === 0) return "";
    const n = data.length;
    return data.map((val, i) => {
      const x = ((i + 0.5) / n) * 100;
      const y = 90 - (val / maxLogins) * 80; 
      return `${x},${y}`;
    }).join(" ");
  }, [reportData?.chartData?.logins, maxLogins]);

  const polygonPoints = useMemo(() => {
    const n = (reportData?.chartData?.logins || []).length;
    if (n === 0) return "";
    const firstX = (0.5 / n) * 100;
    const lastX = ((n - 0.5) / n) * 100;
    return `${firstX},90 ${linePoints} ${lastX},90`;
  }, [linePoints, reportData?.chartData?.logins]);

  return (
    <div className="space-y-6 font-inter text-foreground relative">
      
      {/* LOADING OVERLAY SCREEN */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-4px z-50 flex items-center justify-center transition-all">
          <div className="bg-card border border-border px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-(--theme-color)" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Updating Registry Query Frame...</span>
          </div>
        </div>
      )}

      {/* HEADER CONTROLS - SPLIT LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Filter and Period Group (Primary Card) */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-3 flex-1 shadow-sm">
          {/* Time Picker */}
          <div className="flex items-center gap-2 bg-neutral-900/60 border border-border rounded-xl px-4 py-2 hover:border-(--theme-color)/50 focus-within:border-(--theme-color) focus-within:ring-1 focus-within:ring-(--theme-color)/30 transition-all shadow-sm">
            <Calendar className="h-4 w-4 shrink-0" style={{ color: "var(--theme-color)" }} />
            <select 
              value={reportMode} 
              onChange={(e) => setReportMode(e.target.value as "7" | "30" | "month")}
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-foreground cursor-pointer appearance-auto"
            >
              <option value="7" className="bg-neutral-900 text-foreground font-semibold">Last 7 Days</option>
              <option value="30" className="bg-neutral-900 text-foreground font-semibold">Last 30 Days</option>
              <option value="month" className="bg-neutral-900 text-foreground font-semibold">Specific Month</option>
            </select>
            
            {reportMode === "month" && (
              <div className="flex items-center pl-3 border-l border-border/60 ml-1">
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-foreground cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* TX Filter */}
          <div className="flex items-center gap-2 bg-neutral-900/60 border border-border rounded-xl px-4 py-2 hover:border-(--theme-color)/50 focus-within:border-(--theme-color) focus-within:ring-1 focus-within:ring-(--theme-color)/30 transition-all shadow-sm">
            <Filter className="h-4 w-4 shrink-0" style={{ color: "var(--theme-color)" }} />
            <select 
              value={txFilter} 
              onChange={(e) => { setTxFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-foreground cursor-pointer appearance-auto"
            >
              <option value="ALL" className="bg-neutral-900 text-foreground font-semibold">All Transactions</option>
              <option value="WALK IN" className="bg-neutral-900 text-foreground font-semibold">Walk Ins Only</option>
              <option value="REGISTRATION" className="bg-neutral-900 text-foreground font-semibold">Registrations Only</option>
              <option value="RENEWAL" className="bg-neutral-900 text-foreground font-semibold">Renewals Only</option>
            </select>
          </div>
        </div>

        {/* ACTIONS CARD */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 w-full lg:w-auto shadow-sm">
          <button 
            onClick={exportToCSV}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 hover:opacity-90 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            style={{ backgroundColor: "var(--theme-color)", color: "var(--theme-color)-foreground" }}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button 
            onClick={() => setModalMode("hard_all")}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <AlertOctagon className="h-3.5 w-3.5" /> Purge
          </button>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE HISTOGRAM */}
        <div className="bg-card border border-border rounded-2xl p-4 relative flex flex-col justify-between h-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Daily Revenue</h4>
            <div className="text-right">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Total</span>
              <span className="text-base font-black font-mono leading-none" style={{ color: "var(--theme-color)" }}>₱ {totalRevenue.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between pt-2 px-1 h-80 w-full">
            {(reportData?.chartData?.revenue || []).map((val, idx) => {
              const isToday = reportData?.chartData?.labels[idx] === todayLabel;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative px-0.5">
                  {val > 0 && (
                    <div className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-background/95 px-1.5 py-0.5 rounded border border-border pointer-events-none absolute z-15 bottom-[105%] whitespace-nowrap shadow-xl" style={{ color: isToday ? "#f59e0b" : "var(--theme-color)" }}>
                      ₱{val.toLocaleString()}
                    </div>
                  )}
                  <div 
                    style={{ 
                      height: val === 0 ? "2px" : `${(val / maxRevenue) * 100}%`,
                      backgroundColor: val === 0 ? "#262626" : (isToday ? "#f59e0b" : "var(--theme-color)"),
                      boxShadow: isToday && val > 0 ? "0 0 10px rgba(245, 158, 11, 0.4)" : "none"
                    }} 
                    className="w-full rounded-t-xs transition-all duration-300 hover:brightness-110"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between border-t border-neutral-800/60 pt-2 mt-2 text-[8px] text-muted-foreground font-semibold tracking-wider uppercase px-1">
            {(reportData?.chartData?.labels || []).map((day, i) => {
              const len = (reportData?.chartData?.labels || []).length;
              const isToday = day === todayLabel;
              const isHidden = !isToday && (len > 7 && i % Math.ceil(len / 5) !== 0 && i !== len - 1);
              
              return (
                <span 
                  key={i} 
                  className={`${isHidden ? "hidden" : "block"} ${isToday ? "bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/40 font-black -mt-0.5 z-10" : ""}`}
                >
                  {isToday ? "TODAY" : day}
                </span>
              );
            })}
          </div>
        </div>

        {/* LOGINS LINE CHART */}
        <div className="bg-card border border-border rounded-2xl p-4 relative flex flex-col justify-between h-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Daily Traffic</h4>
            <div className="text-right">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Total</span>
              <span className="text-base font-black font-mono leading-none" style={{ color: "var(--theme-color)" }}>{totalLogins} <span className="text-[9px] text-muted-foreground">LOGINS</span></span>
            </div>
          </div>
        
          <div className="flex-1 relative h-80 pt-2 px-1 w-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {polygonPoints && (
                <polygon
                  points={polygonPoints}
                  fill="var(--theme-color)"
                  className="opacity-[0.04] transition-all duration-500"
                />
              )}
              {linePoints && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="var(--theme-color)"
                  strokeWidth="2"
                  className="opacity-95 transition-all duration-500"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              
              {/* "TODAY" SVG OVERLAY MARKERS */}
              {(reportData?.chartData?.logins || []).map((val, i) => {
                const isToday = reportData?.chartData?.labels[i] === todayLabel;
                if (!isToday) return null;
                
                const n = (reportData?.chartData?.logins || []).length;
                const x = ((i + 0.5) / n) * 100;
                const y = 90 - (val / maxLogins) * 80;
                
                return (
                  <g key={`today-marker-${i}`}>
                    <line x1={x} y1="0" x2={x} y2="100" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" className="opacity-60" vectorEffect="non-scaling-stroke" />
                    <circle cx={x} cy={y} r="2" fill="#f59e0b" className="animate-pulse" vectorEffect="non-scaling-stroke" />
                    <circle cx={x} cy={y} r="0.75" fill="#ffffff" vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between border-t border-neutral-800/60 pt-2 mt-2 text-[8px] text-muted-foreground font-semibold tracking-wider uppercase px-1">
            {(reportData?.chartData?.labels || []).map((day, i) => {
              const len = (reportData?.chartData?.labels || []).length;
              const isToday = day === todayLabel;
              const isHidden = !isToday && (len > 7 && i % Math.ceil(len / 5) !== 0 && i !== len - 1);
              
              return (
                <span 
                  key={i} 
                  className={`${isHidden ? "hidden" : "block"} ${isToday ? "bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/40 font-black -mt-0.5 z-10" : ""}`}
                >
                  {isToday ? "TODAY" : day}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* TRANSACTION LEDGER TABLE WITH PAGINATION */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 bg-background/20 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Financial Audit Ledger Trail</h3>
          <span className="text-[10px] font-bold text-foreground bg-neutral-800 px-2 py-1 rounded-md border border-border">
            Total Records: {processedPayments.length}
          </span>
        </div>
        
        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="py-4 px-6 cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("name")}>
                  Name & ID <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6">Method Block</th>
                <th className="py-4 px-6 cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("amount")}>
                  Amount <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6 cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("date")}>
                  Timestamp <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-4 px-6 text-right">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-semibold text-muted-foreground">
              {paginatedPayments.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground font-mono text-[11px]">No processed records found for this filter.</td></tr>
              ) : (
                paginatedPayments.map((tx: PaymentRecord) => (
                  <tr key={tx.id} className="hover:bg-background/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground">{tx.payer_name}</div>
                      {tx.members?.member_id && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {tx.members.member_id}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-neutral-800 border border-border rounded text-[9px] font-black tracking-widest" style={{ color: "var(--theme-color)" }}>
                        {formatTxType(tx.tx_type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm" style={{ color: "var(--theme-color)" }}>₱ {tx.amount}</td>
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
                className="p-2 bg-background border border-border rounded-lg text-foreground hover:border-(--theme-color)/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-background border border-border rounded-lg text-foreground hover:border-(--theme-color)/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SYSTEM SECURITY OVERLAY MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-destructive/30 rounded-2xl p-8 relative shadow-2xl">
            <button onClick={() => { setModalMode(null); setSelectedTx(null); setErrorMessage(""); setAdminPassword(""); }} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 mb-3">
                  {modalMode === "hard_all" ? <AlertOctagon className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
                </div>
                <h3 className="text-lg font-black text-destructive uppercase tracking-wide">
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