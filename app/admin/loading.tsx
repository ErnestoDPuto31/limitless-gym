import React from "react";
import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 min-h-[60vh]">
      
      <div className="relative flex items-center justify-center h-16 w-16">
        <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full animate-pulse" />
        <div className="absolute inset-0 rounded-full border-[3px] border-neutral-800/80" />
        <div className="absolute inset-0 rounded-full border-[3px] border-brand border-r-transparent border-b-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
        
        <Loader2 className="h-6 w-6 text-white animate-spin relative z-10" style={{ animationDuration: '1s', animationDirection: 'reverse' }} />
      </div>
      
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">
          LOADING
        </h3>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest animate-pulse">
          Fetching records...
        </p>
      </div>
      
    </div>
  );
}