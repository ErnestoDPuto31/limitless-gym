import React from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginatedMembers } from "@/app/actions/memberActions";
import MemberActionButtons from "./MemberActionButtons";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export const revalidate = 0;

export default async function MembersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const currentSearch = resolvedParams.search || "";

  const response = await getPaginatedMembers({
    page: currentPage,
    search: currentSearch,
  });

  const { members, totalPages, totalCount } = response;

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">
            Gym Members Manager
          </h2>
          <p className="text-[11px] text-neutral-500 font-semibold tracking-wide">
            Total Database Records: <span className="text-[#DFFF00] font-mono">{totalCount}</span>
          </p>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-[#161616] border border-neutral-800/80 rounded-2xl p-4">
        <form method="GET" className="relative max-w-md w-full flex items-center">
          <input type="hidden" name="page" value="1" />
          <Search className="absolute left-3.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            name="search"
            defaultValue={currentSearch}
            placeholder="Search via Full Name or Member ID..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-[#DFFF00]/40 transition-colors"
          />
        </form>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#161616] border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase font-black tracking-widest text-neutral-500">
                <th className="py-3.5 px-6">ID Mapping</th>
                <th className="py-3.5 px-6">Full Name</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Expiration Date</th>
                <th className="py-3.5 px-6">Status Indicator</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 text-xs font-semibold">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500 font-mono text-[11px]">
                    No members found matching that search filter parameter.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-800/10 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-neutral-400 font-bold">
                      {member.member_id}
                    </td>
                    <td className="py-4 px-6 text-white font-bold text-sm">
                      {member.full_name}
                    </td>
                    <td className="py-4 px-6 font-mono text-neutral-400 text-[11px]">
                      {member.phone || "No phone added"}
                    </td>
                    <td className="py-4 px-6 font-mono text-neutral-400">
                      {member.expires_at
                        ? new Date(member.expires_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
                        : "N/A"
                      }
                    </td>
                      <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        member.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : member.status === "expiring"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {member.status === "expiring" ? "expiring" : member.status || "expired"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <MemberActionButtons member={member} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="p-4 bg-neutral-900/20 border-t border-neutral-800/60 flex items-center justify-between gap-4">
            <span className="text-[11px] text-neutral-500 font-semibold">
              Page <span className="text-white font-bold font-mono">{currentPage}</span> of{" "}
              <span className="text-white font-bold font-mono">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <Link
                href={{
                  pathname: "/admin/members",
                  query: {
                    page: Math.max(1, currentPage - 1),
                    ...(currentSearch && { search: currentSearch }),
                  },
                }}
                className={`p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition-colors ${
                  currentPage <= 1 ? "pointer-events-none opacity-30" : "bg-neutral-900"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>

              <Link
                href={{
                  pathname: "/admin/members",
                  query: {
                    page: Math.min(totalPages, currentPage + 1),
                    ...(currentSearch && { search: currentSearch }),
                  },
                }}
                className={`p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition-colors ${
                  currentPage >= totalPages ? "pointer-events-none opacity-30" : "bg-neutral-900"
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