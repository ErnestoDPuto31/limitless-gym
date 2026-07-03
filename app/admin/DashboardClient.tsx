"use client";

import React, { useState } from "react";
import { TrendingUp, Users, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardClient({ stats, activity }: { stats: unknown; activity: unknown[] }) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination Logic
  const totalPages = Math.ceil(activity.length / itemsPerPage);
  const paginatedActivity = activity.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Dashboard</h1>
      </div>

      {/* CARD ROWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* REVENUE CARD */}
        <div className="bg-[#161616] border border-neutral-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                Today&apos;s Revenue
              </p>
              <p className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wider mb-3">
                Philippine Peso
              </p>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[#DFFF00]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">PHP {(stats as { todayRevenue: number }).todayRevenue.toLocaleString()}</h3>
          <p className="text-xs font-bold text-emerald-400 mt-1">↑ {(stats as { revenueChangePercent: number }).revenueChangePercent}% vs yesterday</p>
        </div>

        {/* LOGINS CARD (Duplicate Removed) */}
        <div className="bg-[#161616] border border-neutral-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                Total Logins Today
              </p>
              <p className="text-[9px] font-semibold text-neutral-600 uppercase tracking-wider mb-3">
                All Sessions
              </p>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">{(stats as { totalLoginsToday: number }).totalLoginsToday}</h3>
          <p className="text-xs font-bold text-neutral-400 mt-1">{(stats as { monthlyLogins: number }).monthlyLogins} monthly · {(stats as { dailyLogins: number }).dailyLogins} daily</p>
        </div>

        {/* MEMBERS STAT CARD */}
        <div className="bg-[#DFFF00] rounded-2xl p-6 text-black">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-black text-black/60 uppercase tracking-widest">Active Members</p>
              <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider mb-3">Current Month</p>
            </div>
            <div className="p-2 rounded-xl bg-black/10 text-black">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tighter">{(stats as { activeMembersCount: number }).activeMembersCount}</h3>
          <p className="text-xs font-black text-black/70 mt-1">↑ {(stats as { newMembersThisWeek: number }).newMembersThisWeek} new this week</p>
        </div>
      </div>

      {/* RECENT ACTIVITY TABLE */}
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-800/60 flex justify-between items-center">
          <div>
            <h4 className="font-black text-sm text-white tracking-wide uppercase">Recent Activity</h4>
            <p className="text-[11px] text-neutral-500 font-medium">Live local check-in feed log</p>
          </div>
          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
            Total Records: {activity.length}
          </span>
        </div>

        <div className="overflow-x-auto min-h-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 text-xs font-semibold">
              {paginatedActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500 font-mono text-[11px]">
                    No gym entries logged today yet.
                  </td>
                </tr>
              ) : (
                paginatedActivity.map((log: unknown) => (
                  <tr key={(log as { id: string }).id} className="hover:bg-neutral-800/10 transition-colors">
                    <td className="py-4 px-6 font-mono text-neutral-400 text-[11px]">{(log as { time: string }).time}</td>
                    <td className="py-4 px-6">
                      <p className="text-white font-bold">{(log as { name: string }).name}</p>
                      {/* FIXED UUID */}
                      { (log as { customMemberId?: string }).customMemberId && <p className="text-[10px] font-mono font-bold text-neutral-500">{(log as { customMemberId?: string }).customMemberId}</p> }
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        (log as { type?: string }).type === "monthly" ? "bg-neutral-800 text-neutral-300 border border-neutral-700/60" : "bg-neutral-800/50 text-[#DFFF00] border border-neutral-800"
                      }`}>{(log as { type?: string }).type}</span>
                    </td>
                    <td className="py-4 px-6 text-neutral-400">{(log as { action?: string }).action}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${ (log as { status?: string }).status === "Checked In" ? "bg-[#DFFF00]" : "bg-rose-500"}`} />
                        <span className={`font-bold ${ (log as { status?: string }).status === "Checked In" ? "text-[#DFFF00]" : "text-rose-500"}`}>{(log as { status?: string }).status}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 bg-neutral-900/30 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}