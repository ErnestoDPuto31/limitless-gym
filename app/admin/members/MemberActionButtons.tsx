"use client";

import React, { useState } from "react";
import { Edit2, Trash2, X, UserCog, AlertTriangle, Key } from "lucide-react";
import { updateMemberInfo, deleteMember, resetMemberPin } from "@/app/actions/memberActions";

type Member = {
  id: string;
  member_id?: string;
  full_name: string;
  date_of_birth?: Date; 
  phone?: string;
  emergency_phone?: string;
  status?: string;
  created_at?: string;
  last_renewed_at?: string;
};

const stripPrefix = (phoneStr?: string) => {
  if (!phoneStr) return "";
  return phoneStr.replace(/^\+63\s*/, "");
};

export default function MemberActionButtons({ member }: { member: Member }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPinOpen, setIsResetPinOpen] = useState(false); 
  
  const [editData, setEditData] = useState({
    full_name: member.full_name,
    phone: stripPrefix(member.phone),
    emergency_phone: stripPrefix(member.emergency_phone),
    status: member.status || "active",
  });

  // Helper to safely extract Date parts without crashing if undefined
  const getDobParts = (dateInput?: Date) => {
    if (!dateInput) return { year: "", month: "", day: "" };
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return { year: "", month: "", day: "" };
    
    return {
      year: d.getFullYear().toString(),
      month: (d.getMonth() + 1).toString().padStart(2, "0"),
      day: d.getDate().toString().padStart(2, "0"),
    };
  };

  const dobParts = getDobParts(member.date_of_birth);
  const [dobMonth, setDobMonth] = useState(dobParts.month);
  const [dobDay, setDobDay] = useState(dobParts.day);
  const [dobYear, setDobYear] = useState(dobParts.year);
  
  const [adminPassword, setAdminPassword] = useState("");
  const [newPin, setNewPin] = useState(""); 
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setDobMonth(val);
    if (val.length === 2) document.getElementById(`edit-dob-day-${member.id}`)?.focus();
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setDobDay(val);
    if (val.length === 2) document.getElementById(`edit-dob-year-${member.id}`)?.focus();
  };

  const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !dobDay) {
      document.getElementById(`edit-dob-month-${member.id}`)?.focus();
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !dobYear) {
      document.getElementById(`edit-dob-day-${member.id}`)?.focus();
    }
  };

  const handleEditSubmit = async () => {
    setIsProcessing(true);
    setError("");
    const formattedPhone = editData.phone.trim() ? `+63${editData.phone.trim()}` : "";
    const formattedEmergency = editData.emergency_phone.trim() ? `+63${editData.emergency_phone.trim()}` : "";
    
  
    const formattedDob = (dobYear && dobMonth && dobDay) 
      ? new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay)) 
      : undefined;

    const res = await updateMemberInfo(member.id, {
      ...editData,
      phone: formattedPhone,
      emergency_phone: formattedEmergency,
      date_of_birth: formattedDob, 
    });

    if (res.success) setIsEditOpen(false);
    else setError(res.error || "Update failed.");
    setIsProcessing(false);
  };

  const handleHardDelete = async () => {
    if (!adminPassword) return setError("Admin password is required.");

    setIsProcessing(true);
    setError("");
    const res = await deleteMember(member.id, adminPassword);
    
    if (res.success) {
      setIsDeleteOpen(false);
      setAdminPassword("");
    } else {
      setError(res.error || "Failed to delete member.");
    }
    setIsProcessing(false);
  };

  const handleResetPin = async () => {
    if (!newPin || newPin.length < 4) return setError("PIN must be at least 4 digits.");

    setIsProcessing(true);
    setError("");
    const res = await resetMemberPin(member.id, newPin);
    
    if (res.success) {
      setIsResetPinOpen(false);
      setNewPin("");
    } else {
      setError(res.error || "Failed to reset PIN.");
    }
    setIsProcessing(false);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* RESET PIN BUTTON */}
        <button 
          onClick={() => { setIsResetPinOpen(true); setError(""); setNewPin(""); }}
          className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all cursor-pointer"
          title="Reset PIN"
        >
          <Key className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setIsEditOpen(true)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setIsDeleteOpen(true)}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* ─── MODAL: RESET PIN─── */}
      {isResetPinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsResetPinOpen(false)} className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 mb-3">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Reset Member PIN</h3>
              <p className="text-xs text-neutral-400 font-medium mt-1.5 leading-relaxed">
                Assign a new temporary 4-digit PIN for <span className="text-white font-bold">{member.full_name}</span>.
              </p>
            </div>
            
            {error && <div className="mb-4 text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl text-center">{error}</div>}
            
            <div className="space-y-4 mt-2 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest text-center">New Temporary PIN</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))} 
                  placeholder="1234"
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-lg font-bold text-white outline-none focus:border-blue-500/50 transition-colors tracking-[0.25em]" 
                />
              </div>

              <button
                onClick={handleResetPin}
                disabled={isProcessing || newPin.length < 4}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-blue-500/10 mt-2"
              >
                {isProcessing ? "Saving..." : "Confirm New PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800/60">
              <div className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl">
                <UserCog className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Edit Profile</h3>
                <p className="text-[10px] text-neutral-500 font-mono font-semibold uppercase mt-0.5">ID: {member.member_id || member.id}</p>
              </div>
            </div>
            
            {error && <div className="mb-4 text-xs font-semibold text-red-400 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">{error}</div>}
            
            <div className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Full Name</label>
                <input 
                  value={editData.full_name} 
                  onChange={e => setEditData({...editData, full_name: e.target.value})}
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-xs font-semibold text-white outline-none focus:border-neutral-700 transition-colors" 
                />
              </div>

              {/* SEGMENTED DOB INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Date of Birth</label>
                <div className="flex items-center px-4 h-11 rounded-xl bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700 transition-colors">
                  <input 
                    id={`edit-dob-month-${member.id}`}
                    type="text" 
                    placeholder="MM"
                    maxLength={2}
                    value={dobMonth}
                    onChange={handleMonthChange}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id={`edit-dob-day-${member.id}`}
                    type="text" 
                    placeholder="DD"
                    maxLength={2}
                    value={dobDay}
                    onChange={handleDayChange}
                    onKeyDown={handleDayKeyDown}
                    className="w-8 bg-transparent text-white placeholder-neutral-600 text-xs font-semibold outline-none text-center"
                  />
                  <span className="text-neutral-600 font-bold mx-1">/</span>
                  <input 
                    id={`edit-dob-year-${member.id}`}
                    type="text" 
                    placeholder="YYYY"
                    maxLength={4}
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={handleYearKeyDown}
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
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})}
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
                    value={editData.emergency_phone} 
                    onChange={e => setEditData({...editData, emergency_phone: e.target.value})}
                    placeholder="9123456789"
                    className="w-full h-full bg-transparent px-3 text-xs font-semibold text-white outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Status</label>
                <select 
                  value={editData.status} 
                  onChange={e => setEditData({...editData, status: e.target.value})}
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 text-white font-semibold text-xs rounded-xl px-3 outline-none focus:border-neutral-700 transition-all cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
              
              <button 
                onClick={handleEditSubmit} 
                disabled={isProcessing}
                className="w-full h-11 mt-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setIsDeleteOpen(false)} className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Delete Member</h3>
              <p className="text-xs text-neutral-400 font-medium mt-1.5 leading-relaxed">
                You are about to permanently delete <span className="text-white font-bold">{member.full_name}</span>. This action cannot be undone.
              </p>
            </div>
            
            {error && <div className="mt-4 text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl text-center">{error}</div>}
            
            <div className="space-y-4 mt-5 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase text-neutral-400 tracking-widest text-center">Admin Password</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-neutral-900 border border-neutral-800 rounded-xl text-center text-xs font-semibold text-white outline-none focus:border-neutral-700 transition-colors tracking-widest" 
                />
              </div>

              <button
                onClick={handleHardDelete}
                disabled={isProcessing || !adminPassword}
                className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-red-500/10 mt-2"
              >
                {isProcessing ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}