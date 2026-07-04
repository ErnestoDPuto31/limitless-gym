"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getGymSettings } from "@/app/actions/settingsActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Custom SVG Icons
const Dumbbell = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1-1" />
    <path d="m3 3 1 1" />
    <path d="m18 22 4-4" />
    <path d="m2 6 4-4" />
    <path d="m3 10 7-7" />
    <path d="m14 21 7-7" />
  </svg>
);

const LayoutDashboard = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const Users = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BarChart3 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="6" y1="20" x2="6" y2="16" />
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
  </svg>
);

const Settings = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogOut = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
    const [gymName, setGymName] = useState<string>("");

  useEffect(() => {
    async function loadLayoutSettings() {
      const result = await getGymSettings();
      if (result.success && result.data?.gym_name) {
        setGymName(result.data.gym_name);
      }
    }
    loadLayoutSettings();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/"); 
      router.refresh(); 
    } catch (err) {
      console.error("Sign out handling mismatch:", err);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#121212] text-neutral-200 overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-neutral-800 bg-[#161616] flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-neutral-800">
            <div className="h-8 w-8 bg-(--theme-color) text-black rounded flex items-center justify-center shrink-0">
              <Dumbbell className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wider uppercase text-white">
                {gymName || (
                  <>Limitless Fitness <span className="text-(--theme-color)">Gym</span></>
                )}
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">
              Menu
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                    isActive ? "bg-neutral-800/60 text-(--theme-color)" : "text-neutral-400 hover:text-white hover:bg-neutral-800/30"
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-(--theme-color)" : "text-neutral-400 group-hover:text-white"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-[#141414]">
          <div className="flex items-center gap-3 p-2 bg-neutral-900/50 rounded-xl border border-neutral-800 mb-2">
            <div className="h-9 w-9 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-400 border border-neutral-700">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Admin</p>
              <p className="text-[10px] text-neutral-500 font-medium truncate">Super User</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="px-8 pt-6 pb-2 flex justify-between items-center bg-[#121212]">
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live System
          </div>
        </header>

        <div className="p-8 pt-2 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}