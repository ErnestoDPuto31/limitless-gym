"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getReportData(periodDays: number = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    const cutoffIso = cutoffDate.toISOString();

    const { data: members, error: mErr } = await supabase.from("members").select("status, id, full_name");
    if (mErr) throw mErr;

    const { data: payments, error: pErr } = await supabase
      .from("payments")
      .select("*, members(member_id)")
      .gte("created_at", cutoffIso)
      .order("created_at", { ascending: false });
    if (pErr) throw pErr;

    const { data: logs, error: lErr } = await supabase
      .from("attendance_logs")
      .select("id, member_id, created_at, members(full_name)")
      .gte("created_at", cutoffIso);
    if (lErr) throw lErr;

    const chartLabels: string[] = [];
    const revenueData: number[] = [];
    const loginsData: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      
      chartLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
      
      const dailyRev = payments
        ?.filter(p => p.created_at.startsWith(dateString))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      revenueData.push(dailyRev);

      const dailyLog = logs?.filter(l => l.created_at.startsWith(dateString)).length || 0;
      loginsData.push(dailyLog);
    }

    const loginMap: Record<string, { name: string; count: number }> = {};
    logs?.forEach((log: unknown) => {
      const name = (log as { members?: { full_name?: string } }).members?.full_name || (log as { visitor_name?: string }).visitor_name || "Anonymous Member";
      if (!loginMap[name]) loginMap[name] = { name, count: 0 };
      loginMap[name].count += 1;
    });

    return {
      success: true,
      stats: {
        total: members?.length || 0,
        active: members?.filter(m => m.status === "active").length || 0,
        expiring: members?.filter(m => m.status === "expiring").length || 0,
        expired: members?.filter(m => m.status === "expired").length || 0,
        activePct: members?.length ? Math.round((members.filter(m => m.status === "active").length / members.length) * 100) : 0,
        expiringPct: members?.length ? Math.round((members.filter(m => m.status === "expiring").length / members.length) * 100) : 0,
        expiredPct: members?.length ? Math.round((members.filter(m => m.status === "expired").length / members.length) * 100) : 0,
      },
      payments: payments || [],
      topMembers: Object.values(loginMap).sort((a, b) => b.count - a.count).slice(0, 5),
      chartData: { labels: chartLabels, revenue: revenueData, logins: loginsData }
    };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    return { success: false, stats: { total: 0, active: 0, expiring: 0, expired: 0, activePct: 0, expiringPct: 0, expiredPct: 0 }, payments: [], topMembers: [], chartData: { labels: [], revenue: [], logins: [] } };
  }
}

// Strictly Hard Delete (Single)
export async function deletePaymentRecord(id: string, passwordVerify: string) {
  try {
    if (passwordVerify !== process.env.ADMIN_PASSWORD) {
      return { success: false, error: "Authentication failed: Incorrect master password." };
    }
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// Strictly Hard Delete (Bulk)
export async function bulkDeletePayments(passwordVerify: string) {
  try {
    if (passwordVerify !== process.env.ADMIN_PASSWORD) {
      return { success: false, error: "Authentication failed: Incorrect master password." };
    }
    // Purge all records entirely
    const { error } = await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000"); 
    if (error) throw error;
    
    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}