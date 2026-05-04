"use client";
import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike, Building2, ChevronRight, ArrowLeft,
  Loader2, Eye, EyeOff, AlertCircle, CheckCircle,
  Shield, Mail, RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { signUp, type Role } from "@/lib/auth";
import { sendVerificationEmail, verifyEmailCode } from "@/lib/api";

// ── Password strength indicator ───────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars",     ok: password.length >= 8 },
    { label: "Uppercase",    ok: /[A-Z]/.test(password) },
    { label: "Number",       ok: /\d/.test(password) },
    { label: "Special char", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const color  = passed <= 1 ? "#ef4444" : passed <= 2 ? "#f59e0b" : passed <= 3 ? "#3b82f6" : "#10b981";
  const label  = ["", "Weak", "Fair", "Good", "Strong"][passed];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= passed ? color : "rgba(255,255,255,0.07)" }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3">
          {checks.map(c => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.ok ? "text-emerald-400" : "text-slate-600"}`}>
              {c.ok ? <CheckCircle className="w-2.5 h-2.5" /> : <span className="w-2.5 h-2.5 inline-block" />}
              {c.label}
            </span>
          ))}
        </div>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ── 6-digit OTP input ─────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };
  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = digits.map((d, idx) => idx === i ? (v.slice(-1) || "") : d).join("");
    onChange(next);
    if (v && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); e.preventDefault(); }
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className={`w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl border transition-all outline-none
            ${d ? "border-brand-500/60 bg-brand-500/10 text-white" : "border-white/10 bg-white/5 text-slate-400"}
            focus:border-brand-500 focus:bg-brand-500/15 focus:ring-2 focus:ring-brand-500/20`}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<Role | null>((params.get("role") as Role) || null);
  const [step, setStep] = useState<"role" | "form" | "verify">(
    params.get("role") ? "form" : "role"
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPwd, setShowPwd]   = useState(false);
  const [otp, setOtp]           = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp]     = useState<string | null>(null);  // shown in dev mode
  const [form, setForm]         = useState({ firstName: "", lastName: "", email: "", password: "" });

  // Start resend countdown
  const startResendTimer = () => {
    setResendTimer(60);
    const id = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; });
    }, 1000);
  };

  // Submit form → create account directly (no OTP needed, auth is localStorage-based)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);

    try {
      const signUpResult = await signUp({ ...form, role });
      if (!signUpResult.success) {
        setError(signUpResult.error);
        return;
      }
      toast.success(`Welcome to BikeSense, ${form.firstName}! 🚲`);
      router.push(role === "admin" ? "/admin/dashboard" : "/consumer/home");
    } catch {
      setError("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setDevOtp(null);
    setOtp("");
    setLoading(true);
    try {
      const result = await sendVerificationEmail(form.email, form.firstName);
      if (result.dev_mode && result.dev_otp) {
        setDevOtp(result.dev_otp);
        toast(`🔑 New OTP: ${result.dev_otp}`, { duration: 30000 });
      } else {
        toast.success("New code sent!");
      }
      startResendTimer();
    } catch {
      setError("Resend failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → Dashboard: verify OTP then create account
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Please enter the full 6-digit code."); return; }
    if (!role) return;
    setError(null);
    setLoading(true);

    try {
      const verifyResult = await verifyEmailCode(form.email, otp);
      if (!verifyResult.success) {
        setError(verifyResult.error || "Invalid code.");
        return;
      }
      // OTP verified — now create the account
      const signUpResult = await signUp({ ...form, role });
      if (!signUpResult.success) {
        setError(signUpResult.error);
        return;
      }
      toast.success(`Welcome to BikeSense, ${form.firstName}! 🚲`);
      router.push(role === "admin" ? "/admin/dashboard" : "/consumer/home");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding ────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-2/5 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.25) 0%, transparent 60%)" }} />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Bike className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-3">BikeSense AI</h1>
          <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
            The smartest bike rental platform — powered by SARIMA forecasting.
          </p>
          <div className="mt-10 space-y-3 max-w-xs mx-auto text-left">
            {[
              "✅ Real-time demand predictions across 8 zones",
              "✅ Dynamic pricing engine powered by ML",
              "✅ Fleet rebalancing alerts & live insights",
              "✅ Consumer price predictor & best-time finder",
            ].map(f => <div key={f} className="text-sm text-slate-400">{f}</div>)}
          </div>
        </div>
        <div className="absolute bottom-8 flex items-center gap-2 text-xs text-slate-600">
          <Shield className="w-3 h-3" /> Email verified · SHA-256 secured
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">
              Bike<span className="text-brand-400">Sense</span>
            </span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Choose role ────────────────────────── */}
            {step === "role" && (
              <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display font-bold text-2xl text-white mb-2">Create your account</h1>
                <p className="text-slate-400 mb-8">How will you use BikeSense?</p>
                <div className="space-y-4">
                  {[
                    { r: "admin" as Role,    icon: Building2, label: "Rental Company / Fleet Operator",
                      desc: "Manage fleet, demand forecasting, dynamic pricing & revenue analytics" },
                    { r: "consumer" as Role, icon: Bike,      label: "Consumer / Rider",
                      desc: "Find best prices, predict ride costs & discover bikes near you" },
                  ].map(({ r, icon: Icon, label, desc }) => (
                    <button key={r} onClick={() => { setRole(r); setStep("form"); }}
                      className="w-full glass rounded-xl p-5 flex items-start gap-4 text-left border border-transparent hover:border-brand-500/30 transition-all hover-lift">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-brand-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{label}</div>
                        <div className="text-sm text-slate-400">{desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Account form ───────────────────────── */}
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => setStep("role")}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                    {role === "admin" ? <Building2 className="w-5 h-5 text-brand-400" /> : <Bike className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Signing up as</div>
                    <div className="font-semibold text-white">{role === "admin" ? "Rental Operator" : "Rider / Consumer"}</div>
                  </div>
                </div>
                <h1 className="font-display font-bold text-2xl text-white mb-6">Create your account</h1>
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">First Name</label>
                      <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                        placeholder="Sriram" className="input-dark w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">Last Name</label>
                      <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                        placeholder="Kumar" className="input-dark w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Email address</label>
                    <input required type="email" autoComplete="email"
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com" className="input-dark w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input required type={showPwd ? "text" : "password"}
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Min 8 characters" className="input-dark w-full pr-10" minLength={8} />
                      <button type="button" tabIndex={-1} onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} />
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
                      : <><CheckCircle className="w-4 h-4" />Create Account</>}
                  </button>
                </form>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Have an account?{" "}
                  <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 3: OTP verification ───────────────────── */}
            {step === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setStep("form"); setOtp(""); setError(null); setDevOtp(null); }}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-brand-400" />
                </div>

                <h1 className="font-display font-bold text-2xl text-white text-center mb-2">Check your email</h1>
                <p className="text-slate-400 text-center text-sm mb-2">
                  We sent a 6-digit code to
                </p>
                <p className="text-white font-medium text-center mb-6">{form.email}</p>

                {/* Dev mode banner */}
                {devOtp && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">🔑</span>
                    <div>
                      <div className="text-xs text-amber-400 font-medium">Dev Mode — No SMTP configured</div>
                      <div className="text-amber-200 font-mono font-bold text-lg tracking-widest">{devOtp}</div>
                      <div className="text-xs text-amber-600 mt-0.5">Set SMTP_USER & SMTP_PASSWORD to send real emails</div>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleVerify} className="space-y-5">
                  <OtpInput value={otp} onChange={setOtp} />

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading || otp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</>
                      : <><CheckCircle className="w-4 h-4" />Verify &amp; Create Account</>}
                  </button>
                </form>

                {/* Resend */}
                <div className="mt-5 text-center">
                  <span className="text-slate-500 text-sm">Didn&apos;t receive the code? </span>
                  <button onClick={handleResend} disabled={resendTimer > 0 || loading}
                    className={`text-sm font-medium flex items-center gap-1 mx-auto mt-1 transition-colors ${
                      resendTimer > 0 ? "text-slate-600 cursor-not-allowed" : "text-brand-400 hover:text-brand-300"
                    }`}>
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-600 mt-4">
                  Code expires in 10 minutes · Max 5 attempts
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignUpInner />
    </Suspense>
  );
}
