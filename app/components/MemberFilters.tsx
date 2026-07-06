"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, UserPlus, X } from "lucide-react";
import { createNewMember } from "@/app/actions/memberActions";

interface FilterProps {
  currentSearch: string;
  currentStatus: string;
  currentSortBy: string;
  currentSortOrder: string;
}

export default function MemberFilters({
  currentSearch,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: FilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    emergency_phone: "",
    pin: "",
  });

  // ─── DATE OF BIRTH SEGMENTED STATES ───
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");

  // ─── EXPIRATION DATE SEGMENTED STATES ───
  const [expMonth, setExpMonth] = useState("");
  const [expDay, setExpDay] = useState("");
  const [expYear, setExpYear] = useState("");

  // DOB Auto-advance handlers
  const handleDobMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setDobMonth(val);
    if (val.length === 2) document.getElementById("add-dob-day")?.focus();
  };

  const handleDobDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setDobDay(val);
    if (val.length === 2) document.getElementById("add-dob-year")?.focus();
  };

  const handleDobDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !dobDay) {
      document.getElementById("add-dob-month")?.focus();
    }
  };

  const handleDobYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !dobYear) {
      document.getElementById("add-dob-day")?.focus();
    }
  };

  // Expiration Date Auto-advance handlers
  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setExpMonth(val);
    if (val.length === 2) document.getElementById("add-exp-day")?.focus();
  };

  const handleExpDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setExpDay(val);
    if (val.length === 2) document.getElementById("add-exp-year")?.focus();
  };

  const handleExpDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !expDay) {
      document.getElementById("add-exp-month")?.focus();
    }
  };

  const handleExpYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !expYear) {
      document.getElementById("add-exp-day")?.focus();
    }
  };

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      setError("Full name is required.");
      return;
    }
    if (formData.pin && formData.pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    setIsProcessing(true);
    setError("");
    
    const formattedPhone = formData.phone.trim() ? `+63${formData.phone.trim()}` : "";
    const formattedEmergency = formData.emergency_phone.trim() ? `+63${formData.emergency_phone.trim()}` : "";

    // Construct Native JS Date for Date of Birth
    const formattedDob = (dobYear && dobMonth && dobDay)
      ? new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay))
      : null;

    // Calculate Status & Expiration Date
    let computedStatus = "active";
    let formattedExpiresAt = null;

    if (expYear && expMonth && expDay) {
      const expDate = new Date(Number(expYear), Number(expMonth) - 1, Number(expDay));
      formattedExpiresAt = expDate.toISOString();

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        computedStatus = "expired";
      } else if (diffDays <= 7) {
        computedStatus = "expiring";
      }
    }

    const res = await createNewMember({
      ...formData,
      status: computedStatus,
      phone: formattedPhone,
      emergency_phone: formattedEmergency,
      expires_at: formattedExpiresAt,
      date_of_birth: formattedDob,
      pin: formData.pin || undefined,
    });

    if (res.success) {
      setIsAddOpen(false);
      setFormData({ full_name: "", phone: "", emergency_phone: "", pin: "" });
      setDobMonth(""); setDobDay(""); setDobYear("");
      setExpMonth(""); setExpDay(""); setExpYear("");
    } else {
      setError(res.error || "Failed to add member.");
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search !== currentSearch) {
        updateFilters({ search });
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="bg-[#161616] border border-neutral-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800/40">
        <span className="text-[10px] uppercase tracking-widest font-black text-neutral-400">Manage Members</span>
        <button
          onClick={() => setIsAddOpen(true)}
          className="h-10 bg-(--theme-color) hover:bg-(--theme-color)/80 text-white font-black text-xs uppercase tracking-wider px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-(--theme-color)/10"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        {/* SEARCH INPUT */}
        <div className="flex flex-col gap-2 lg:col-span-5 w-full">
          <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500">Search Directory</span>
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search via Full Name or Member ID..."
              className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 text-xs font-semibold text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
            />
          </div>
        </div>

        {/* STATUS COMBO BOX */}
        <div className="flex flex-col gap-2 lg:col-span-3 w-full">
          <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500">Filter Status</span>
          <select 
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full h-11 bg-neutral-900 border border-neutral-800 text-white font-semibold text-xs rounded-xl px-3 outline-none focus:border-neutral-700 transition-all cursor-pointer"
          >
            <option value="all">Show All</option>
            <option value="active">Active Only</option>
            <option value="expiring">Expiring Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>

        {/* SORT COLUMN */}
        <div className="flex flex-col gap-2 lg:col-span-2 w-full">
          <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500">Sort By</span>
          <select 
            value={currentSortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
            className="w-full h-11 bg-neutral-900 border border-neutral-800 text-white font-semibold text-xs rounded-xl px-3 outline-none focus:border-neutral-700 transition-all cursor-pointer"
          >
            <option value="created_at">Date Joined</option>
            <option value="full_name">Full Name</option>
            <option value="member_id">Member ID</option>
          </select>
        </div>

        {/* ORDER */}
        <div className="flex flex-col gap-2 lg:col-span-2 w-full">
          <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500">Order</span>
          <select 
            value={currentSortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value })}
            className="w-full h-11 bg-neutral-900 border border-neutral-800 text-white font-semibold text-xs rounded-xl px-3 outline-none focus:border-neutral-700 transition-all cursor-pointer"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800/60">
              <div className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Member</h3>
                <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Manually add a member from the paper logbook.</p>
              </div>
            </div>

            {error && <div className="mb-4 text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">{error}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Full Name *</label>
                <input 
                  type="text"
                  required
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Juan Dela Cruz"
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-xs font-semibold text-white outline-none focus:border-neutral-700 transition-colors" 
                />
              </div>

              {/* SEGMENTED DOB INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Date of Birth</label>
                <div className="flex items-center px-4 h-11 rounded-xl bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700 transition-colors">
                  <input 
                    id="add-dob-month"
                    type="text" 
                    placeholder="MM"
                    maxLength={2}
                    value={dobMonth}
                    onChange={handleDobMonthChange}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id="add-dob-day"
                    type="text" 
                    placeholder="DD"
                    maxLength={2}
                    value={dobDay}
                    onChange={handleDobDayChange}
                    onKeyDown={handleDobDayKeyDown}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id="add-dob-year"
                    type="text" 
                    placeholder="YYYY"
                    maxLength={4}
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={handleDobYearKeyDown}
                    className="w-12 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Contact Number</label>
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl focus-within:border-neutral-700 transition-colors h-11 overflow-hidden">
                  <span className="flex items-center justify-center pl-4 pr-2 text-neutral-500 text-xs font-bold border-r border-neutral-800">+63</span>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="9123456789"
                    className="w-full h-full bg-transparent px-3 text-xs font-semibold text-white outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Emergency Phone</label>
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl focus-within:border-neutral-700 transition-colors h-11 overflow-hidden">
                  <span className="flex items-center justify-center pl-4 pr-2 text-neutral-500 text-xs font-bold border-r border-neutral-800">+63</span>
                  <input 
                    type="text" 
                    value={formData.emergency_phone} 
                    onChange={e => setFormData({...formData, emergency_phone: e.target.value})}
                    placeholder="9123456789"
                    className="w-full h-full bg-transparent px-3 text-xs font-semibold text-white outline-none" 
                  />
                </div>
              </div>

              {/* 4-DIGIT PIN INPUT FIELD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">4-Digit PIN</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={formData.pin}
                  onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, "")})}
                  placeholder="••••"
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-center text-xs font-bold text-white tracking-widest outline-none focus:border-neutral-700 transition-colors"
                />
              </div>

              {/* SEGMENTED EXPIRATION DATE INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Expiration Date</label>
                <div className="flex items-center px-4 h-11 rounded-xl bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700 transition-colors">
                  <input 
                    id="add-exp-month"
                    type="text" 
                    placeholder="MM"
                    maxLength={2}
                    value={expMonth}
                    onChange={handleExpMonthChange}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id="add-exp-day"
                    type="text" 
                    placeholder="DD"
                    maxLength={2}
                    value={expDay}
                    onChange={handleExpDayChange}
                    onKeyDown={handleExpDayKeyDown}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id="add-exp-year"
                    type="text" 
                    placeholder="YYYY"
                    maxLength={4}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={handleExpYearKeyDown}
                    className="w-12 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full h-11 mt-2 bg-(--theme-color) hover:bg-(--theme-color)/80 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                {isProcessing ? "Saving..." : "Add Member"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}