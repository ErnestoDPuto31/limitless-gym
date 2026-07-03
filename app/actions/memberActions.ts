"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ITEMS_PER_PAGE = 10;

export async function getPaginatedMembers(params: { page: number; search?: string }) {
  try {
    const { page, search } = params;
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("members")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search && search.trim() !== "") {
      query = query.or(`full_name.ilike.%${search}%,member_id.ilike.%${search}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return {
      success: true,
      members: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    };
  } catch (err: unknown) {
    console.error("Supabase paginated member fetch failure:", (err as Error).message);
    return { success: false, members: [], totalCount: 0, totalPages: 1 };
  }
}

// ─── ACTION: UPDATE MEMBER INFO ───
export async function updateMemberInfo(id: string, data: { full_name: string; phone: string; status: string }) {
  try {
    const { error } = await supabase
      .from("members")
      .update({
        full_name: data.full_name,
        phone: data.phone,
        status: data.status, 
      })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    const originalError = (err as Error).message;
    console.error("Update failed:", originalError);
    return { success: false, error: `Database Error: ${originalError}` };
  }
}

// ─── ACTION: SECURE DELETE MEMBER 
export async function secureDeleteMember(id: string, passwordVerify: string) {
  try {
    // 1. Password Verification Barrier
    if (passwordVerify !== process.env.ADMIN_PASSWORD) {
      return { success: false, error: "Authentication failed: Incorrect admin password." };
    }

    // 2. Clear relations from check-in logs so history stays intact
    await supabase
      .from("attendance_logs")
      .update({ member_id: null })
      .eq("member_id", id);

    // 3. Clear relations from financial transactions ledger so accounting stays intact
    await supabase
      .from("payments")
      .update({ member_id: null })
      .eq("member_id", id);

    // 4. Delete the member record safely without triggering foreign key failures
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) throw error;
    
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    const originalError = (err as Error).message;
    console.error("Delete failed:", originalError);
    return { success: false, error: `Delete failed: ${originalError}` };
  }
}