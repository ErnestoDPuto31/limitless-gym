"use client";

import { useState, useEffect } from "react";
import { getGymSettings } from "@/app/actions/settingsActions";
import { logDailySession, registerMember, loginMember, renewMember, loginAdmin } from "@/app/actions/gymActions";
import { useRouter } from "next/navigation";

const Dumbbell = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1-1" />
    <path d="m3 3 1 1" />
    <path d="m18 22 4-4" />
    <path d="m2 6 4-4" />
    <path d="m3 10 7-7" />
    <path d="m14 21 7-7" />
  </svg>
);

export default function CheckInPage () {

  
    // ─── ADMIN LOGIN SYSTEM STATES ───
  const router = useRouter(); 
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState("");

  const [dynamicGymName, setDynamicGymName] = useState("Limitless Gym");
  const [dynamicDailyFee, setDynamicDailyFee] = useState(0);
  const [dynamicMonthlyFee, setDynamicMonthlyFee] = useState(0);

  // ─── CLOCK STATE ───
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── DAILY SESSION STATE ───
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isDailySuccess, setIsDailySuccess] = useState(false);

  // ─── MONTHLY PORTAL MASTER STATES ───
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [monthlyTab, setMonthlyTab] = useState("login"); // "login", "register", or "renew"
  const [isMonthlySuccess, setIsMonthlySuccess] = useState(false);
  const [successMode, setSuccessMode] = useState(""); // "logged_in", "registered", or "renewed"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── INPUT FIELDS STATES ───
  const [loginMemberId, setLoginMemberId] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [generatedId, setGeneratedId] = useState(""); 

  const [registerEmergencyPhone, setRegisterEmergencyPhone] = useState("");
  const [registerPin, setRegisterPin] = useState("");
  const [registerDob, setRegisterDob] = useState("");

  const [renewMemberId, setRenewMemberId] = useState("");
  const [renewPhone, setRenewPhone] = useState("");

  // Error Message Trackers
  const [loginError, setLoginError] = useState("");
  const [loginPinError, setLoginPinError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [renewError, setRenewError] = useState("");

  const [registerEmergencyError, setRegisterEmergencyError] = useState("");
  const [registerPinError, setRegisterPinError] = useState("");
  const [registerDobError, setRegisterDobError] = useState("");

  // ─── MEMBER ID VALIDATION & AUTO-FORMATTER ───
const formatAndValidateMemberId = (input: string) => {
  let clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (clean.startsWith("LMT") && clean.length > 3) {
    const numbersPart = clean.slice(3).replace(/\D/g, ""); 
    clean = `LMT-${numbersPart.slice(0, 4)}`; 
  } else if (!clean.startsWith("LMT") && clean.length > 0) {
    const numbersOnly = clean.replace(/\D/g, "");
    clean = `LMT-${numbersOnly.slice(0, 4)}`;
  }

  const isValid = /^LMT-\d{4}$/.test(clean);

  return { formattedId: clean, isValid };
};

useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    async function loadSettings() {
      const result = await getGymSettings();
      if (result.success && result.data) {
        setDynamicGymName(result.data.gym_name);
        setDynamicDailyFee(Number(result.data.daily_fee) || 0);
        setDynamicMonthlyFee(Number(result.data.monthly_fee) || 0);
      }
    }
    loadSettings();
    return () => clearInterval(timer);
  }, []);

  

  // Format Time & Date
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // ─── STRICTOR PH PHONE VALIDATION ───
  const validatePHNumber = (input: string) => {
    const numbersOnly = input.replace(/\D/g, ""); 
    const isValid = /^9\d{9}$/.test(numbersOnly);
    return { numbersOnly, isValid };
  };

  const handlePhoneTyping = (text: string, setterFn: (val: string) => void, errorCleaner: (val: string) => void) => {
    const { numbersOnly } = validatePHNumber(text);
    if (numbersOnly.length <= 10) {
      setterFn(numbersOnly);
      errorCleaner(""); 
    }
  };

  // ─── MASTER RESET FUNCTION ───
  const closeMonthlyPortal = () => {
    setIsMonthlyOpen(false);
    setIsMonthlySuccess(false);
    setSuccessMode("");
    setLoginMemberId("");
    setLoginPhone("");
    setLoginPin("");
    setRegisterName("");
    setRegisterPhone("");
    setRegisterEmergencyPhone("");
    setRegisterPin("");
    setRegisterDob("");
    setRenewMemberId("");
    setRenewPhone("");
    setLoginError("");
    setLoginPinError(""); 
    setRegisterError("");
    setRenewError("");
  };

  // ─── AGE VALIDATION HELPER ───
  const validateAge = (dobString: string) => {
    if (!dobString) return { isValid: false, message: "Date of birth is required." };
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if they haven't had their birthday yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    if (age < 8) return { isValid: false, message: "Must be 8 or older to register." };
    return { isValid: true, message: "" };
  };

// ─── SUBMIT ACTION: DAILY WALK-IN ───
const handleDailySubmit = async () => {
  if (!fullName.trim() || isSubmitting) return;
  
  setIsSubmitting(true);
  const result = await logDailySession(fullName);

  if (result.success) {
    setIsDailySuccess(true);
    setTimeout(() => {
      setIsDailyOpen(false);
      setIsDailySuccess(false);
      setFullName("");
      setIsSubmitting(false); 
    }, 2500);
  } else {
    setIsSubmitting(false);
    alert(`Error: ${result.error}`);
  }
};

// ─── SUBMIT ACTION: MONTHLY LOG IN ───
const handleMonthlyLoginSubmit = async () => {
  if (isSubmitting) return;

  const { isValid: isIdValid } = formatAndValidateMemberId(loginMemberId);
  if (!isIdValid) {
    setLoginError("Invalid Member ID format. Must look like LMT-1234");
    return;
  }

  const { isValid: isPhoneValid } = validatePHNumber(loginPhone);
  if (!isPhoneValid) {
    setLoginError("Please enter a valid 10-digit mobile number.");
    return;
  }

  if (loginPin.length !== 4) {
    setLoginPinError("PIN must be exactly 4 digits.");
    return;
  }
  
  setIsSubmitting(true);
  const result = await loginMember(loginMemberId, `+63${loginPhone}`, loginPin);
  setIsSubmitting(false);

  if (result.success) {
    setSuccessMode("logged_in");
    setIsMonthlySuccess(true); 
    setLoginMemberId("");
    setLoginPhone("");
    setLoginPin("");
  } else {
    setLoginError(result.error || "Login failed. Please try again.");
  }
};

// ─── SUBMIT ACTION: MONTHLY NEW REGISTER ───
const handleMonthlyRegisterSubmit = async () => {
  if (isSubmitting) return;

  if (!registerName.trim()) {
    setRegisterError("Full name is required.");
    return;
  }

  const { isValid: isPhoneValid } = validatePHNumber(registerPhone);
  if (!isPhoneValid) {
    setRegisterError("Valid 10-digit mobile number required.");
    return;
  }

  const { isValid: isEmergencyValid } = validatePHNumber(registerEmergencyPhone);
  if (!isEmergencyValid) {
    setRegisterEmergencyError("Valid 10-digit emergency number required.");
    return;
  }

  if (registerPin.length !== 4) {
    setRegisterPinError("PIN must be exactly 4 digits.");
    return;
  }

  const ageCheck = validateAge(registerDob);
  if (!ageCheck.isValid) {
    setRegisterDobError(ageCheck.message);
    return;
  }

  setIsSubmitting(true);
  const result = await registerMember({
    fullName: registerName,
    phone: `+63${registerPhone}`,
    emergencyPhone: `+63${registerEmergencyPhone}`,
    dateOfBirth: registerDob,
    pin: registerPin
  });
  setIsSubmitting(false);

  if (result.success && result.memberId) {
    setGeneratedId(result.memberId);
    setSuccessMode("registered");
    setIsMonthlySuccess(true);
    setRegisterName("");
    setRegisterEmergencyPhone("");
    setRegisterDob("");
    setRegisterPin("");
  } else {
    setRegisterError(result.error || "Failed to register account.");
  }
};

// ─── SUBMIT ACTION: MONTHLY MEMBERSHIP RENEWAL ───
const handleMonthlyRenewSubmit = async () => {
  if (isSubmitting) return;

  const { isValid: isIdValid } = formatAndValidateMemberId(renewMemberId);
  if (!isIdValid) {
    setRenewError("Invalid Member ID format. Must look like LMT-1234");
    return;
  }

  const { isValid: isPhoneValid } = validatePHNumber(renewPhone);
  if (!isPhoneValid) {
    setRenewError("Please enter a valid 10-digit mobile number.");
    return;
  }

  setIsSubmitting(true);
  const result = await renewMember(renewMemberId, `+63${renewPhone}`);
  setIsSubmitting(false);

  if (result.success) {
    setSuccessMode("renewed");
    setIsMonthlySuccess(true); 
    setRenewMemberId("");
    setRenewPhone("");
  } else {
    setRenewError(result.error || "Could not process renewal request.");
  }
};

// ─── SUBMIT ACTION: ADMIN PORTAL LOGIN ───
const handleAdminLoginSubmit = async () => {
  if (!adminUsername.trim() || !adminPassword.trim() || isSubmitting) return;
  
  setIsSubmitting(true);
  setAdminError("");

  try {
    const result = await loginAdmin(adminUsername, adminPassword);

    if (result.success) {
      setAdminError("");
      setIsAdminOpen(false);
      setIsSubmitting(false); 
      
      setAdminUsername("");
      setAdminPassword("");

      setTimeout(() => {
        router.push("/admin");
      }, 50);
    } else {
      setAdminError(result.error || "Invalid username or password credentials.");
      setIsSubmitting(false); 
    }
  } catch (error) {
    console.error("Client login action failed:", error);
    setAdminError("A system connection error occurred. Please try again.");
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-background text-foreground font-inter flex flex-col justify-between p-6 md:p-10 select-none relative">
      
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-(--theme-color) text-(#36454F) p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-(--theme-color)/10">
            <Dumbbell className="h-4 w-4 stroke-[2.5]" />
          </div>
          {/* Dynamically render the gym name */}
          <span className="font-montserrat font-black text-xl tracking-wider uppercase">
            {dynamicGymName || (
              <>Limitless Fitness <span className="text-(--theme-color)">Gym</span></>
            )}
          </span>
        </div>
        <div className="text-right">
          <div className="font-montserrat font-black text-2xl tracking-tight">{formattedTime}</div>
          <div className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">{formattedDate}</div>
        </div>
      </header>

      {/* PORTAL MAIN COMPONENT GRAPHICS */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto max-w-4xl w-full mx-auto text-center">
        <span className="text-muted-foreground font-montserrat font-bold tracking-[0.25em] text-xs uppercase mb-4">Member Check-In</span>
        <h1 className="font-montserrat font-black text-5xl md:text-7xl tracking-tight leading-none uppercase mb-4">Ready to <br /><span className="text-(--theme-color)">Crush it?</span></h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto font-medium mb-12">Select your session type to get started.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <button onClick={() => setIsDailyOpen(true)} className="bg-(--theme-color) text-(#FFFFFF) p-8 rounded-2xl text-left flex flex-col justify-between h-56 transition-all duration-200 active:scale-[0.98] cursor-pointer group hover:brightness-110 shadow-xl shadow-(--theme-color)/5">
            <div className="bg-black/10 p-3 rounded-xl w-fit"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <div>
              <h3 className="font-montserrat font-black text-2xl tracking-wide uppercase leading-tight mb-1">Log Daily Session</h3>
              <p className="font-semibold text-sm opacity-80">Walk-in • ₱ {dynamicDailyFee}</p>
            </div>
          </button>

          <button onClick={() => setIsMonthlyOpen(true)} className="bg-card border border-border text-foreground p-8 rounded-2xl text-left flex flex-col justify-between h-56 transition-all duration-200 active:scale-[0.98] cursor-pointer hover:bg-muted/30 group">
            <div className="bg-muted p-3 rounded-xl w-fit text-muted-foreground group-hover:text-(--theme-color) transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div>
              <h3 className="font-montserrat font-black text-2xl tracking-wide uppercase leading-tight mb-1 group-hover:text-(--theme-color) transition-colors">Monthly Member</h3>
              <p className="text-muted-foreground font-semibold text-sm">Subscription • ₱ {dynamicMonthlyFee}/mo</p>
            </div>
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex items-center justify-between text-xs font-medium text-muted-foreground/60 border-t border-border/40 pt-6">
        <div>©Ernest Victor Agalo. All rights reserved.</div>
        <button 
          onClick={() => setIsAdminOpen(true)} 
          className="hover:text-(--theme-color) transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          Admin Access <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </footer>

      {/* ─── MODAL 1: DAILY SESSION ─── */}
      {isDailyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-0.75 w-full bg-(--theme-color)" />
            <div className="p-8">
              {!isDailySuccess ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mb-1 font-montserrat">DAILY SESSION</p>
                      <h2 className="text-neutral-100 text-2xl font-black tracking-tight font-montserrat uppercase">Log Your Visit</h2>
                    </div>
                    <button onClick={() => { setIsDailyOpen(false); setFullName(""); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Your Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jana Villanueva" autoFocus className="w-full px-4 py-3.5 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors" />
                  </div>

                  {/* DYNAMIC WALK-IN PRICE DISPLAY */}
                  <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                    <span className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Walk-In Rate</span>
                    <span className="text-(#FFFFFF) text-lg font-black font-montserrat">₱ {dynamicDailyFee}</span>
                  </div>

                  <button onClick={handleDailySubmit} disabled={!fullName.trim()} className="w-full py-4 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color) text-(#212121) font-montserrat disabled:opacity-20 transition-all active:scale-[0.99] cursor-pointer">LOG SESSION</button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-(--theme-color)/10 flex items-center justify-center mb-5 border border-(--theme-color)/20"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-(--theme-color)"><path d="M20 6 9 17l-5-5"/></svg></div>
                  <h3 className="text-neutral-100 text-2xl font-black uppercase tracking-tight mb-1.5 font-montserrat">{fullName}</h3>
                  <p className="text-muted-foreground text-sm font-medium">Session logged. Have a great workout!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: MONTHLY MEMBER ─── */}
      {isMonthlyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-0.75 w-full bg-(--theme-color)" />
            
            <div className="p-8">
              {!isMonthlySuccess ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Top Header Block */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-bold mb-1 font-montserrat">MONTHLY MEMBERSHIP</p>
                      <h2 className="text-neutral-100 text-2xl font-black tracking-tight font-montserrat uppercase">Access Portal</h2>
                    </div>
                    <button onClick={closeMonthlyPortal} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                  </div>

                  {/* 3-COLUMN TABS SYSTEM */}
                  <div className="grid grid-cols-3 bg-[#2A2A2C] p-1 rounded-xl border border-neutral-800">
                    <button onClick={() => setMonthlyTab("login")} className={`py-2.5 text-[11px] font-black tracking-wider rounded-lg transition-all cursor-pointer font-montserrat ${monthlyTab === "login" ? "bg-(--theme-color) text-(--theme-color)-foreground shadow" : "text-neutral-400 hover:text-neutral-200"}`}>LOG IN</button>
                    <button onClick={() => setMonthlyTab("register")} className={`py-2.5 text-[11px] font-black tracking-wider rounded-lg transition-all cursor-pointer font-montserrat ${monthlyTab === "register" ? "bg-(--theme-color) text-(--theme-color)-foreground shadow" : "text-neutral-400 hover:text-neutral-200"}`}>REGISTER</button>
                    <button onClick={() => setMonthlyTab("renew")} className={`py-2.5 text-[11px] font-black tracking-wider rounded-lg transition-all cursor-pointer font-montserrat ${monthlyTab === "renew" ? "bg-(--theme-color) text-(--theme-color)-foreground shadow" : "text-neutral-400 hover:text-neutral-200"}`}>RENEW</button>
                  </div>

                  {/* TAB 1: MEMBER LOG IN */}
                  {monthlyTab === "login" && (
                    <div className="flex flex-col gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Member ID</label>
                        <input type="text" value={loginMemberId} onChange={(e) => { setLoginMemberId(e.target.value.toUpperCase()); setLoginError(""); }} placeholder="e.g. LMT-1001" className="w-full px-4 py-3.5 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Registered Mobile</label>
                          <div className="flex items-center bg-[#2A2A2C] border border-neutral-800 rounded-xl overflow-hidden focus-within:border-(--theme-color)/40 transition-colors">
                            <span className="px-3 text-sm font-bold text-neutral-500 select-none border-r border-neutral-800 bg-neutral-900/40 py-3.5 font-montserrat">+63</span>
                            <input type="text" value={loginPhone} onChange={(e) => handlePhoneTyping(e.target.value, setLoginPhone, setLoginError)} placeholder="917 123 4567" className="w-full px-4 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none" />
                          </div>
                          {loginError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{loginError}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">4-Digit PIN</label>
                          <input type="password" maxLength={4} value={loginPin} onChange={(e) => { setLoginPin(e.target.value.replace(/\D/g, "")); setLoginPinError(""); }} placeholder="••••" className="w-full px-4 py-3.5 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors text-center tracking-[0.5em]" />
                          {loginPinError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{loginPinError}</p>}
                        </div>
                      </div>

                      <button onClick={handleMonthlyLoginSubmit} disabled={!loginMemberId.trim() || loginPhone.length < 10 || loginPin.length !== 4} className="w-full py-4 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color) text-(--theme-color)-foreground font-montserrat disabled:opacity-20 transition-all active:scale-[0.99] cursor-pointer mt-2">CONFIRM CHECK-IN</button>
                    </div>
                  )}

                  {/* TAB 2: REGISTER */}
                  {monthlyTab === "register" && (
                    <div className="flex flex-col gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Full Name</label>
                        <input type="text" value={registerName} onChange={(e) => { setRegisterName(e.target.value); setRegisterError(""); }} placeholder="e.g. Juan Dela Cruz" className="w-full px-4 py-3 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Mobile No.</label>
                          <div className="flex items-center bg-[#2A2A2C] border border-neutral-800 rounded-xl overflow-hidden focus-within:border-(--theme-color)/40 transition-colors">
                            <span className="px-2.5 text-xs font-bold text-neutral-500 select-none border-r border-neutral-800 bg-neutral-900/40 py-3 font-montserrat">+63</span>
                            <input type="text" value={registerPhone} onChange={(e) => handlePhoneTyping(e.target.value, setRegisterPhone, setRegisterError)} placeholder="917 123 4567" className="w-full px-3 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none" />
                          </div>
                          {registerError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{registerError}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Emergency No.</label>
                          <div className="flex items-center bg-[#2A2A2C] border border-neutral-800 rounded-xl overflow-hidden focus-within:border-(--theme-color)/40 transition-colors">
                            <span className="px-2.5 text-xs font-bold text-neutral-500 select-none border-r border-neutral-800 bg-neutral-900/40 py-3 font-montserrat">+63</span>
                            <input type="text" value={registerEmergencyPhone} onChange={(e) => handlePhoneTyping(e.target.value, setRegisterEmergencyPhone, setRegisterEmergencyError)} placeholder="917 123 4567" className="w-full px-3 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none" />
                          </div>
                          {registerEmergencyError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{registerEmergencyError}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Date of Birth</label>
                          <input type="date" value={registerDob} onChange={(e) => { setRegisterDob(e.target.value); setRegisterDobError(""); }} className="w-full px-4 py-3 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors scheme-dark" />
                          {registerDobError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{registerDobError}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">4-Digit PIN</label>
                          <input type="password" maxLength={4} value={registerPin} onChange={(e) => { setRegisterPin(e.target.value.replace(/\D/g, "")); setRegisterPinError(""); }} placeholder="••••" className="w-full px-4 py-3 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors text-center tracking-[0.5em]" />
                          {registerPinError && <p className="text-red-500 text-[10px] font-semibold tracking-wide">{registerPinError}</p>}
                        </div>
                      </div>

                      {/* DYNAMIC REGISTRATION PRICE DISPLAY */}
                      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 mt-1">
                        <span className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Registration Fee</span>
                        <span className="text-(--theme-color) text-lg font-black font-montserrat">₱ {dynamicMonthlyFee}</span>
                      </div>

                      <button onClick={handleMonthlyRegisterSubmit} disabled={!registerName.trim() || registerPhone.length < 10 || registerEmergencyPhone.length < 10 || registerPin.length !== 4 || !registerDob} className="w-full py-4 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color) text-(--theme-color)-foreground font-montserrat disabled:opacity-20 transition-all active:scale-[0.99] cursor-pointer mt-1">CREATE MEMBERSHIP</button>
                    </div>
                  )}

                  {/* TAB 3: RENEW */}
                  {monthlyTab === "renew" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Your Member ID</label>
                        <input type="text" value={renewMemberId} onChange={(e) => { setRenewMemberId(e.target.value.toUpperCase()); setRenewError(""); }} placeholder="e.g. LMT-1001" className="w-full px-4 py-3.5 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Associated Mobile Number</label>
                        <div className="flex items-center bg-[#2A2A2C] border border-neutral-800 rounded-xl overflow-hidden focus-within:border-(--theme-color)/40 transition-colors">
                          <span className="px-3 text-sm font-bold text-neutral-500 select-none border-r border-neutral-800 bg-neutral-900/40 py-3.5 font-montserrat">+63</span>
                          <input type="text" value={renewPhone} onChange={(e) => handlePhoneTyping(e.target.value, setRenewPhone, setRenewError)} placeholder="917 123 4567" className="w-full px-4 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none" />
                        </div>
                        {renewError && <p className="text-red-500 text-[11px] font-semibold mt-0.5 tracking-wide">{renewError}</p>}
                      </div>

                      {/* DYNAMIC RENEWAL PRICE DISPLAY */}
                      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 mt-1">
                        <span className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">30-Day Renewal Fee</span>
                        <span className="text-(--theme-color) text-lg font-black font-montserrat">₱ {dynamicMonthlyFee}</span>
                      </div>

                      <button onClick={handleMonthlyRenewSubmit} disabled={!renewMemberId.trim() || renewPhone.length < 10} className="w-full py-4 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color) text-(--theme-color)-foreground font-montserrat disabled:opacity-20 transition-all active:scale-[0.99] cursor-pointer mt-2">PROCESS 30-DAY RENEWAL</button>
                    </div>
                  )}

                </div>
              ) : (
                // SUCCESS SCREEN (UNTOUCHED)
                <div className="flex flex-col items-center py-2 text-center">
                  <div className="w-16 h-16 rounded-full bg-(--theme-color)/10 flex items-center justify-center mb-5 border border-(--theme-color)/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-(--theme-color)"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  
                  {successMode === "logged_in" && (
                    <>
                      <h3 className="text-neutral-100 text-2xl font-black uppercase tracking-tight mb-1.5 font-montserrat">ACCESS GRANTED</h3>
                      <p className="text-muted-foreground text-sm font-medium px-4 leading-relaxed">ID <span className="text-(--theme-color) font-bold">{loginMemberId}</span> verified successfully.<br />Welcome back to Limitless Fitness Gym!</p>
                    </>
                  )}

                  {successMode === "register" || successMode === "registered" ? (
                    <>
                      <div className="bg-neutral-900 border border-neutral-800 px-6 py-4 rounded-xl w-full mb-4">
                        <p className="text-neutral-500 text-[9px] uppercase tracking-[0.2em] font-bold font-montserrat mb-1">YOUR EXCLUSIVE KEY</p>
                        <h3 className="text-(--theme-color) text-3xl font-black tracking-widest font-montserrat select-text">{generatedId}</h3>
                      </div>
                      <p className="text-neutral-100 text-sm uppercase tracking-wider font-black font-montserrat mb-2">Registration Complete</p>
                      <p className="text-muted-foreground text-xs font-medium px-2 leading-relaxed mb-1">
                        Please <span className="text-neutral-200 font-bold underline decoration-(--theme-color)">TAKE A PICTURE</span> or write down this Member ID code to check-in for future gym sessions.
                      </p>
                      <p className="text-neutral-500 text-[10px] font-medium italic mt-2">
                        An SMS confirmation has been pushed to +63 {registerPhone}
                      </p>
                    </>
                  ) : null}

                  {successMode === "renewed" && (
                    <>
                      <h3 className="text-neutral-100 text-2xl font-black uppercase tracking-tight mb-1.5 font-montserrat">RENEWAL SUCCESSFUL</h3>
                      <p className="text-muted-foreground text-sm font-medium px-4 leading-relaxed">Account <span className="text-(--theme-color) font-bold">{renewMemberId}</span> extended for another 30 days.<br />Your status is active.</p>
                    </>
                  )}

                  <button 
                    onClick={closeMonthlyPortal} 
                    className="w-full mt-6 py-4 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color) text-(--theme-color)-foreground font-montserrat hover:brightness-110 shadow-lg shadow-(--theme-color)/10 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    GOT IT, CLOSE WINDOW
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: SECURE ADMIN SIGN IN ─── */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 bg-[radial-gradient(#222_1px,transparent_1px)] bg-size-[16px_16px]">
          <div className="relative w-full max-w-md bg-[#1C1C1E] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl p-8">
            
            {/* Close Button */}
            <button 
              onClick={() => { setIsAdminOpen(false); setAdminError(""); setAdminUsername(""); setAdminPassword(""); }} 
              className="absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            {/* Header branding block */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-(--theme-color) text-(--theme-color)-foreground p-2 rounded-xl mb-3">
                <Dumbbell className="h-4 w-4 stroke-[2.5]" />
              </div>
              {/* NOW USING DYNAMIC GYM NAME */}
              <h2 className="font-montserrat font-black text-lg tracking-wider uppercase text-neutral-100">
                {dynamicGymName}
              </h2>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Admin Portal</p>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-neutral-100 text-xl font-black tracking-tight font-montserrat">Secure Sign In</h3>
                <p className="text-neutral-500 text-xs mt-0.5 font-medium">Authorized personnel only.</p>
              </div>

              {adminError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
                  {adminError}
                </div>
              )}

              {/* Username Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Username</label>
                <input 
                  type="text" 
                  value={adminUsername} 
                  onChange={(e) => setAdminUsername(e.target.value)} 
                  placeholder="admin" 
                  className="w-full px-4 py-3.5 rounded-xl bg-[#2A2A2C] border border-neutral-800 text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none focus:border-(--theme-color)/40 transition-colors" 
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-neutral-400 text-[10px] uppercase tracking-[0.15em] font-bold font-montserrat">Password</label>
                <div className="relative flex items-center bg-[#2A2A2C] border border-neutral-800 rounded-xl overflow-hidden focus-within:border-(--theme-color)/40 transition-colors">
                  <input 
                    type={showAdminPassword ? "text" : "password"} 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    placeholder="••••••••••••" 
                    className="w-full pl-4 pr-12 py-3.5 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm font-medium outline-none" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    {showAdminPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Sign In */}
              <button 
                onClick={handleAdminLoginSubmit}
                disabled={!adminUsername.trim() || !adminPassword.trim()}
                className="w-full py-4 mt-2 rounded-xl font-black text-xs tracking-[0.15em] bg-(--theme-color)/20 hover:bg-(--theme-color) text-(--theme-color) hover:text-(--theme-color)-foreground border border-(--theme-color)/30 hover:border-transparent font-montserrat disabled:opacity-20 transition-all active:scale-[0.99] cursor-pointer"
              >
                SIGN IN
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
    
  );
}