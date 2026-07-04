"use client";

import React, { useState } from "react";
import { Edit2, Trash2, X, UserCog, AlertTriangle } from "lucide-react";
import { updateMemberInfo, secureDeleteMember } from "@/app/actions/memberActions";

type Member = {
  id: string;
  member_id?: string;
  full_name: string;
  phone?: string;
  status?: string;
};

export default function MemberActionButtons({ member }: { member: Member }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    full_name: member.full_name,
    phone: member.phone || "",
    status: member.status || "active",
  });
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEditSubmit = async () => {
    setIsProcessing(true);
    setError("");
    const res = await updateMemberInfo((member as { id: string }).id, editData);
    if (res.success) {
      setIsEditOpen(false);
    } else {
      setError(res.error || "Update failed.");
    }
    setIsProcessing(false);
  };

  const handleDeleteSubmit = async () => {
    setIsProcessing(true);
    setError("");
    const res = await secureDeleteMember((member as { id: string }).id, adminPassword);
    if (res.success) {
      setIsDeleteOpen(false);
    } else {
      setError(res.error || "Deletion failed.");
    }
    setIsProcessing(false);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => setIsEditOpen(true)}
          className="p-2 text-muted-foreground hover:text-(--theme-color) hover:bg-(--theme-color)/10 rounded-xl transition-all cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button 
          onClick={() => setIsDeleteOpen(true)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* SYSTEM EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 relative shadow-2xl">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-(--theme-color)/10 text-(--theme-color) rounded-xl border border-(--theme-color)/20">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black font-montserrat text-foreground uppercase tracking-tight">Edit Profile</h3>
                <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest mt-0.5">UUID: {member.member_id || member.id}</p>
              </div>
            </div>
            
            {error && <div className="mb-6 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">{error}</div>}
            
            <div className="space-y-5 font-inter">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Full Name</label>
                <input 
                  value={editData.full_name} 
                  onChange={e => setEditData({...editData, full_name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-(--theme-color)/40 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Contact Number</label>
                <input 
                  type="text" 
                  value={editData.phone} 
                  onChange={e => setEditData({...editData, phone: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-(--theme-color)/40 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Membership Status</label>
                <select 
                  value={editData.status} 
                  onChange={e => setEditData({...editData, status: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-(--theme-color)/40 transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              
              <button 
                onClick={handleEditSubmit} 
                disabled={isProcessing}
                className="w-full py-3.5 mt-4 bg-(--theme-color) hover:opacity-90 text-(--theme-color)-foreground font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all disabled:opacity-50 font-montserrat cursor-pointer"
              >
                {isProcessing ? "SAVING CHANGES..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-destructive/30 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(255,59,59,0.1)]">
            <button onClick={() => setIsDeleteOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black font-montserrat text-destructive uppercase tracking-wide">Security Check</h3>
              <p className="text-xs text-muted-foreground font-inter font-medium mt-2">
                You are about to delete <span className="text-foreground font-bold">{member.full_name}</span>. Their attendance logs and payments will be preserved under an anonymous reference.
              </p>
            </div>
            
            {error && <div className="mb-6 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">{error}</div>}
            
            <div className="space-y-4 font-inter">
              <div>
                <label className="block text-[10px] font-black uppercase text-destructive/80 tracking-widest mb-1.5 text-center">Enter Master Admin Password</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-destructive/30 rounded-xl px-4 py-3 text-center text-sm font-medium text-foreground outline-none focus:border-destructive transition-colors tracking-widest" 
                />
              </div>
              
              <button 
                onClick={handleDeleteSubmit} 
                disabled={isProcessing || !adminPassword}
                className="w-full py-3.5 mt-2 bg-destructive hover:opacity-90 text-destructive-foreground font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all disabled:opacity-50 font-montserrat cursor-pointer"
              >
                {isProcessing ? "AUTHENTICATING..." : "CONFIRM ACCOUNT DELETION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}