"use client";

import React, { useState } from "react";
import { Edit2, Trash2, X, UserCog, AlertTriangle } from "lucide-react";
import { updateMemberInfo, deleteMember } from "@/app/actions/memberActions";

type Member = {
  id: string;
  member_id?: string;
  full_name: string;
  phone?: string;
  emergency_phone?: string;
  status?: string;
};

const stripPrefix = (phoneStr?: string) => {
  if (!phoneStr) return "";
  return phoneStr.replace(/^\+63\s*/, "");
};

export default function MemberActionButtons({ member }: { member: Member }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    full_name: member.full_name,
    phone: stripPrefix(member.phone),
    emergency_phone: stripPrefix(member.emergency_phone),
    status: member.status || "active",
  });
  
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditSubmit = async () => {
    setIsProcessing(true);
    setError("");
    const formattedPhone = editData.phone.trim() ? `+63${editData.phone.trim()}` : "";
    const formattedEmergency = editData.emergency_phone.trim() ? `+63${editData.emergency_phone.trim()}` : "";

    const res = await updateMemberInfo(member.id, {
      ...editData,
      phone: formattedPhone,
      emergency_phone: formattedEmergency,
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

  return (
    <>
      <div className="flex items-center justify-end gap-2">
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