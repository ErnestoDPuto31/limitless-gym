"use client";

import React, { useState, useEffect } from "react";
import { getGymSettings, updateGymSettings } from "@/app/actions/settingsActions";
import { Lock, DollarSign, Building, Clock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import "@/app/styles/fonts.css"; 

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // General Settings State Variables
  const [gymName, setGymName] = useState("");
  const [dailyFee, setDailyFee] = useState<number>(0);
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("22:00");

  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    async function initSettings() {
      try {
        const result = await getGymSettings();
        
        if (result.success && result.data) {
          setGymName(result.data.gym_name || "");
          setDailyFee(Number(result.data.daily_fee) || 0);
          setMonthlyFee(Number(result.data.monthly_fee) || 0);
          setAdminPassword(result.data.admin_password || "");
          setConfirmPassword(result.data.admin_password || "");

          // Parse database string format "HH:MM - HH:MM" safely back into individual clock state pickers
          if (result.data.operating_hours && result.data.operating_hours.includes(" - ")) {
            const parts = result.data.operating_hours.split(" - ");
            if (parts[0]) setOpenTime(parts[0]);
            if (parts[1]) setCloseTime(parts[1]);
          }
        } else {
          setStatusMessage({ type: "error", text: "Could not load settings data." });
        }
      } catch (err) {
        console.error(err);
        setStatusMessage({ type: "error", text: "Something went wrong loading configuration elements." });
      } finally {
        setLoading(false);
      }
    }
    initSettings();
  }, []);

  // 2. Commit form updates to live database table on click
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    // Stop execution if passwords do not align
    if (adminPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match. Please re-check." });
      setSaving(false);
      return;
    }

    try {
      // Package selected times back into standard unified string text layout
      const formattedHours = `${openTime} - ${closeTime}`;

      const response = await updateGymSettings({
        gym_name: gymName,
        operating_hours: formattedHours,
        daily_fee: dailyFee,
        monthly_fee: monthlyFee,
        admin_password: adminPassword,
      });

      if (response.success) {
        setStatusMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        setStatusMessage({ type: "error", text: response.error || "Failed to update configuration records." });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error occurred while saving variables." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#DFFF00]" />
        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Loading System Options...</p>
      </div>
    );
  }

  return (
    /* FIXED CONTAINER: Added mx-auto and w-full to center beautifully on widescreen PCs */
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-10">
      {/* SIMPLE PAGE DESCRIPTOR */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wide">Settings</h1>
        <p className="text-[12px] text-neutral-500 font-semibold tracking-wide">
          Manage your business information, operational schedules, pricing structures, and password controls
        </p>
      </div>

      {/* FEEDBACK SYSTEM NOTIFICATIONS */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${
          statusMessage.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}>
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="space-y-6">
        
        {/* SECTION 1: PUBLIC GENERAL IDENTITY PROFILE */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-800/60 pb-3">
            <Building className="h-4 w-4 text-[#DFFF00]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Gym Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">Gym Name</label>
              <input 
                type="text" 
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-[#DFFF00]/40 transition-colors"
              />
            </div>
            
            {/* EASY CLOCK PICKER DROPDOWNS */}
            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">Daily Operating Hours</label>
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                <input 
                  type="time" 
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  required
                  className="bg-transparent text-xs text-white font-bold outline-none scheme-dark cursor-pointer"
                />
                <span className="text-xs text-neutral-600 font-bold px-1">to</span>
                <input 
                  type="time" 
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  required
                  className="bg-transparent text-xs text-white font-bold outline-none scheme-dark cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: BUSINESS PLAN CALCULATOR PRICING */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-800/60 pb-3">
            <DollarSign className="h-4 w-4 text-[#DFFF00]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Membership Plans & Pricing</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">Monthly Membership Fee</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[11px] font-bold text-neutral-600">₱</span>
                <input 
                  type="number" 
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  required
                  min="0"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#DFFF00]/40 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">Daily Walk-In Rate</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[11px] font-bold text-neutral-600">₱</span>
                <input 
                  type="number" 
                  value={dailyFee}
                  onChange={(e) => setDailyFee(Number(e.target.value))}
                  required
                  min="0"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#DFFF00]/40 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: RE-CONFIGURED ADMIN ACCOUNT AUTHENTICATION SECURITY */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-800/60 pb-3">
            <Lock className="h-4 w-4 text-[#DFFF00]" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Admin Portal Password</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[#DFFF00]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-neutral-500 tracking-wider mb-1.5">Confirm New Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none transition-colors ${
                  adminPassword !== confirmPassword && confirmPassword.length > 0 
                    ? "border-rose-500 focus:border-rose-500" 
                    : "border-neutral-800 focus:border-[#DFFF00]/40"
                }`}
              />
              {adminPassword !== confirmPassword && confirmPassword.length > 0 && (
                <p className="text-[10px] text-rose-400 mt-1 font-semibold">Passwords do not match yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* SECURE FORM ACTION ACTION TRIGGER ROW */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            disabled={saving || (adminPassword !== confirmPassword)}
            className="flex items-center gap-2 bg-[#DFFF00] disabled:bg-neutral-800 disabled:text-neutral-600 text-black text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#DFFF00]/5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 stroke-[2.5]" />
            )}
            Save Settings Changes
          </button>
        </div>

      </form>
    </div>
  );
}