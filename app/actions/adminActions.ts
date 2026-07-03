"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayIso = yesterday.toISOString();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekAgoIso = oneWeekAgo.toISOString();

    const { data: todayPayments, error: payErr1 } = await supabase
      .from("payments")
      .select("amount")
      .gte("created_at", todayIso);
      
    if (payErr1) console.error("Payment today error:", payErr1);

    const { data: yesterdayPayments, error: payErr2 } = await supabase
      .from("payments")
      .select("amount")
      .gte("created_at", yesterdayIso)
      .lt("created_at", todayIso);

    if (payErr2) console.error("Payment yesterday error:", payErr2);

    const todayRevenue = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const yesterdayRevenue = yesterdayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    let revenueChangePercent = 0;
    if (yesterdayRevenue > 0) {
      revenueChangePercent = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (todayRevenue > 0) {
      revenueChangePercent = 100;
    }
    const { data: todayLogs, error: logErr } = await supabase
      .from("attendance_logs")
      .select("log_type")
      .gte("created_at", todayIso);

    if (logErr) console.error("Logs error:", logErr);

    const totalLoginsToday = todayLogs?.length || 0;
    const monthlyLogins = todayLogs?.filter(l => l.log_type === "monthly").length || 0;
    const dailyLogins = todayLogs?.filter(l => l.log_type === "daily").length || 0;

    const { count: activeMembersCount, error: memErr1 } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (memErr1) console.error("Active members count error:", memErr1);

    const { count: newMembersThisWeek, error: memErr2 } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoIso);

    if (memErr2) console.error("Weekly count error:", memErr2);
    
    const { data: recentLogs, error: feedErr } = await supabase
      .from("attendance_logs")
      .select(`
        id,
        log_type,
        visitor_name,
        created_at,
        members (
          member_id,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50); 

    if (feedErr) console.error("Feed logs error:", feedErr);

    const formattedActivity = (recentLogs || []).map((log: unknown) => ({
      id: (log as { id: string }).id,
      time: new Date((log as { created_at: string }).created_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      name: (log as { members?: { full_name?: string }; visitor_name?: string }).members?.full_name || (log as { visitor_name?: string }).visitor_name || "Unknown Visitor",
      customMemberId: (log as { members?: { member_id?: string } }).members?.member_id || null, 
      type: (log as { log_type?: string }).log_type || "daily",
      action: "Check-In",
      status: "Checked In",
    }));

    return {
      success: true,
      stats: {
        todayRevenue,
        revenueChangePercent,
        totalLoginsToday,
        monthlyLogins,
        dailyLogins,
        activeMembersCount: activeMembersCount || 0,
        newMembersThisWeek: newMembersThisWeek || 0,
      },
      activity: formattedActivity,
    };
  } catch (error) {
    return { success: false, error: "Database execution failure." };
  }
}