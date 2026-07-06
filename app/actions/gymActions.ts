"use server";

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { unstable_noStore as noStore } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return "An unexpected error occurred.";
}


async function getGymFees(): Promise<{ daily: number; monthly: number }> {
  try {
    const { data, error } = await supabase
      .from("gym_settings")
      .select("daily_fee, monthly_fee")
      .limit(1)
      .single();

    if (error || !data) {
      return { daily: 80.00, monthly: 800.00 };
    }

    return { 
      daily: Number(data.daily_fee), 
      monthly: Number(data.monthly_fee) 
    };
  } catch {
    return { daily: 80.00, monthly: 800.00 };
  }
}

export async function getGymSettings() {
  noStore();

  try {
    const { data, error } = await supabase
      .from("gym_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) throw error;
    return { success: true, data };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return { success: false, error: "Failed to fetch settings" };
  }
}

// ─── ACTION 1: LOG DAILY WALK-IN 
export async function logDailySession(fullName: string) {
  try {
    const fees = await getGymFees(); 

    const { error: attendanceError } = await supabase
      .from("attendance_logs")
      .insert([{ 
        log_type: 'daily', 
        visitor_name: fullName 
      }]);

    if (attendanceError) throw attendanceError;

    const { error: paymentError } = await supabase
      .from("payments")
      .insert([{
        member_id: null,        
        payer_name: fullName,
        tx_type: 'walk_in',   
        amount: fees.daily
      }]);

    if (paymentError) throw paymentError; 

    return { success: true };
  } catch (err: unknown) {
    console.error("Walk-in Error:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─── ACTION 2: REGISTER NEW MONTHLY MEMBER───
export async function registerMember(data: {
  fullName: string;
  phone: string;
  emergencyPhone: string;
  dateOfBirth: string;
  pin: string; 
}) {
  try {
    const fees = await getGymFees();

    const newId = `LMT-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const securePinHash = hashPin(data.pin);

    const { data: newMember, error: registrationError } = await supabase
      .from("members")
      .insert([{
        member_id: newId,
        full_name: data.fullName,
        phone: data.phone,
        emergency_phone: data.emergencyPhone,
        date_of_birth: data.dateOfBirth,
        pin_hash: securePinHash, 
        status: 'active',
        expires_at: expiresAt.toISOString()
      }])
      .select("id")
      .single();

    if (registrationError) {
      if (registrationError.code === '23505') {
         return { 
           success: false, 
           error: "This phone number is already registered to a member profile. Please use a different number or log in." 
         };
      }
      throw registrationError;
    }

    const { error: paymentError } = await supabase
      .from("payments")
      .insert([{
        member_id: newMember.id,
        payer_name: data.fullName,
        tx_type: 'registration', 
        amount: fees.monthly
      }]);

    if (paymentError) throw paymentError; 
    
    return { success: true, memberId: newId };
  } catch (err: unknown) {
    console.error("Registration Error:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─── ACTION 3: MEMBER LOGIN / CHECK-IN ───
export async function loginMember(memberId: string, pin: string) {
  try {
    const formattedMemberId = memberId.startsWith("LMT-") 
      ? memberId 
      : `LMT-${memberId}`;

    const verificationHash = hashPin(pin);

    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("id, member_id, expires_at, full_name, status") 
      .eq("member_id", formattedMemberId)
      .eq("pin_hash", verificationHash)
      .single();

    if (fetchError || !member) {
      return { success: false, error: "Invalid Member ID or PIN." };
    }

    if (member.status === 'deleted') {
      return { 
        success: false, 
        error: "Access Denied: Membership is deactivated. Please see the front desk." 
      };
    }

    if (member.status === 'expired') {
       return { 
         success: false, 
         error: "Access Denied: Membership expired. Please renew your account." 
       };
    }

    const now = new Date();
    const expiryDate = new Date(member.expires_at);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let computedStatus = member.status;
    
    if (diffDays < 0) {
      computedStatus = 'expired';
    } else if (diffDays <= 7) {
      computedStatus = 'expiring';
    } else {
      computedStatus = 'active';
    }

    if (member.status !== computedStatus) {
      const { error: updateError } = await supabase
        .from("members")
        .update({ status: computedStatus })
        .eq("id", member.id);
      
      if (!updateError) {
        member.status = computedStatus;
      }
    }

    if (member.status === 'expired') {
       return { 
         success: false, 
         error: "Access Denied: Membership has expired. Please renew your account." 
       };
    }

    const { error: logError } = await supabase
      .from("attendance_logs")
      .insert([{ 
        log_type: 'monthly',  
        member_id: member.id,
        visitor_name: member.full_name 
      }]);

    if (logError) throw logError;
    return { success: true, member };
  } catch (err: unknown) {
    console.error("Login Error Details:", err);
    return { success: false, error: getErrorMessage(err) }; 
  }
}
    
    
// ─── ACTION 4: RENEW EXISTING MEMBERSHIP ───
export async function renewMember(memberId: string, pin: string) {
  try {
    const fees = await getGymFees();
    const formattedMemberId = memberId.startsWith("LMT-") 
      ? memberId 
      : `LMT-${memberId}`;

    const verificationHash = hashPin(pin);

    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("id, full_name, expires_at, status")
      .eq("member_id", formattedMemberId)
      .eq("pin_hash", verificationHash)
      .single();

    if (fetchError || !member) {
      return { success: false, error: "Invalid Member ID or PIN." };
    }

    if (member.status === 'deleted') {
      return { 
        success: false, 
        error: "This account has been deactivated. Please contact the front desk." 
      };
    }

    if (member.status === 'active' || member.status === 'expiring') {
      return { 
        success: false, 
        error: `Your membership is currently ${member.status}. You can only renew once it has fully expired.` 
      };
    }

    const currentExpiry = new Date(member.expires_at);
    const now = new Date();
    const newExpiry = currentExpiry > now ? currentExpiry : now;
    newExpiry.setDate(newExpiry.getDate() + 30);

    const { error: updateError } = await supabase
      .from("members")
      .update({ 
        expires_at: newExpiry.toISOString(), 
        status: "active",
        last_renewed_at: now.toISOString() 
      })
      .eq("id", member.id);

    if (updateError) throw updateError;

    const { error: paymentError } = await supabase
      .from("payments")
      .insert([{
        member_id: member.id,
        payer_name: member.full_name,
        tx_type: "renewal", 
        amount: fees.monthly 
      }]);

    if (paymentError) throw paymentError;

    return { success: true };
  } catch (err: unknown) {
    console.error("Renewal Error:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

// ─── ACTION 5: DYNAMIC SECURE ADMIN SIGN-IN ───
export async function loginAdmin(username: string, password: string) {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from("gym_settings")
      .select("admin_password")
      .limit(1)
      .single();

    const cleanInputUser = username.trim().toLowerCase();
    const cleanInputPass = password.trim();

    if (
      process.env.ADMIN_PASSWORD && 
      cleanInputUser === "admin" && 
      cleanInputPass === process.env.ADMIN_PASSWORD
    ) {
      return { success: true };
    }

    const targetPassword = (settingsError || !settings?.admin_password) 
      ? hashPassword(process.env.ADMIN_PASSWORD || "limitless2025") 
      : settings.admin_password;

    if (!targetPassword) {
      console.error("Missing fallback ADMIN_PASSWORD in .env.local and no database record found.");
      return { success: false, error: "System authentication configuration missing." };
    }

    const inputHash = hashPassword(cleanInputPass);

    if (cleanInputUser === "admin" && inputHash === targetPassword) {
      return { success: true };
    }
    
    return { success: false, error: "Invalid username or password credentials." };
  } catch (err: unknown) {
    console.error("Admin Login Error Exception:", err);
    return { success: false, error: "Server authentication error." };
  }
}