"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const LOGS_PER_PAGE = 10;

export async function getPaginatedLogs(params: { page: number; search?: string }) {
  try {
    const { page, search } = params;
    const from = (page - 1) * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;

    // Use a Postgres Join by pulling members data directly within the selection string
    let query = supabase
      .from("attendance_logs")
      .select("id, check_in_time, member_id, members(full_name, member_id, status)", { count: "exact" })
      .order("check_in_time", { ascending: false });

    if (search && search.trim() !== "") {
      // Allows searching logs by member's full name directly
      query = query.ilike("members.full_name", `%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return {
      success: true,
      logs: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / LOGS_PER_PAGE),
    };
  } catch (err: unknown) {
    console.error("Attendance logs query error:", (err as Error).message);
    return { success: false, logs: [], totalCount: 0, totalPages: 1 };
  }
}