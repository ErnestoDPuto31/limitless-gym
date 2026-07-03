"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface GymSettingsPayload {
  gym_name: string;
  operating_hours: string;
  daily_fee: number;
  monthly_fee: number;
  admin_password: string;
}

export async function getGymSettings() {
  try {
    const { data, error } = await supabase
      .from("gym_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Fallback seed data if table is completely empty
        const defaultData = {
          id: 1,
          gym_name: "Limitless Gym",
          operating_hours: "06:00 - 22:00",
          daily_fee: 150,
          monthly_fee: 1500,
          admin_password: "limitless2025",
        };
        
        const { data: insertedData, error: insertError } = await supabase
          .from("gym_settings")
          .insert([defaultData])
          .select()
          .single();

        if (insertError) throw insertError;
        return { success: true, data: insertedData };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error reading gym settings:", error);
    return { success: false, error: "Could not read data from database." };
  }
}

export async function updateGymSettings(payload: GymSettingsPayload) {
  try {
    if (!payload.gym_name.trim()) throw new Error("Gym name cannot be empty.");
    if (payload.daily_fee < 0 || payload.monthly_fee < 0) throw new Error("Prices cannot be negative numbers.");
    if (!payload.admin_password.trim()) throw new Error("Password field cannot be blank.");

    const { data, error } = await supabase
      .from("gym_settings")
      .update({
        gym_name: payload.gym_name,
        operating_hours: payload.operating_hours,
        daily_fee: payload.daily_fee,
        monthly_fee: payload.monthly_fee,
        admin_password: payload.admin_password,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/admin/settings");

    return { success: true, message: "Settings saved successfully!", data };
  } catch (error: unknown) {
    console.error("Error saving gym settings:", error);
    return { success: false, error: (error as Error).message || "Failed to save configuration updates." };
  }
}