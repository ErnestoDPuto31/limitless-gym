"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ITEMS_PER_PAGE = 10;

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// ─── HELPER: AUTH VERIFICATION ───
async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("gym_settings")
    .select("admin_password")
    .eq("id", 1)
    .single();

  if (error || !data) return false;
  if (process.env.ADMIN_PASSWORD && inputPassword === process.env.ADMIN_PASSWORD) {
    return true;
  }
  return data.admin_password === hashPassword(inputPassword);
}

// ─── ACTION: FETCH ROSTER ───
export async function getPaginatedMembers(params: { 
  page: number; 
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    const { page, search, status, sortBy = "created_at", sortOrder = "desc" } = params;
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from("members").select("*", { count: "exact" });

    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!status) {
      query = query.neq("status", "deleted");
    }

    if (search && search.trim() !== "") {
      query = query.or(`full_name.ilike.%${search}%,member_id.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    return {
      success: true,
      members: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    };
  } catch (err: unknown) {
    console.error("Fetch failure:", (err as Error).message);
    return { success: false, members: [], totalCount: 0, totalPages: 1 };
  }
}

// ─── ACTION: ADD MANUAL MEMBER ───
export async function createNewMember(data: {
  full_name: string;
  phone: string;
  emergency_phone: string;
  status: string;
  expires_at: string | null;
  date_of_birth?: Date | null;
  pin?: string;
}) {
  try {
    const prefix = "LMT-";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedMemberId = `${prefix}${randomDigits}`;
    const hashedPin = data.pin && data.pin.trim().length === 4 
      ? hashPassword(data.pin.trim()) 
      : null;

    const { error } = await supabase
      .from("members")
      .insert([{
        member_id: generatedMemberId,
        full_name: data.full_name,
        phone: data.phone || null,
        emergency_phone: data.emergency_phone || null,
        status: data.status,
        date_of_birth: data.date_of_birth || null,
        pin_hash: hashedPin, 
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;

    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// ─── ACTION: UPDATE MEMBER ───
export async function updateMemberInfo(
  id: string, 
  data: { 
    full_name: string; 
    phone: string; 
    emergency_phone: string; 
    status: string;
    date_of_birth?: Date | null;
  }
) {
  try {
    const { error } = await supabase
      .from("members")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        emergency_phone: data.emergency_phone || null,
        status: data.status,
        date_of_birth: data.date_of_birth || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// ─── ACTION: PERMANENT DELETE ───
export async function deleteMember(id: string, passwordVerify: string) {
  try {
    const isAuthorized = await verifyAdminPassword(passwordVerify);
    if (!isAuthorized) return { success: false, error: "Incorrect admin password." };

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: `Database Error: ${(err as Error).message}` };
  }
}

// ─── ACTION: RESET MEMBER PIN ───
export async function resetMemberPin(id: string, newPin: string) {
  try {
    if (!newPin || newPin.trim().length < 4) {
      throw new Error("New PIN must be at least 4 digits.");
    }

    const hashedNewPin = hashPassword(newPin.trim());

    const { error } = await supabase
      .from("members")
      .update({ 
        pin_hash: hashedNewPin,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
    
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}