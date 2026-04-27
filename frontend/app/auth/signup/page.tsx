"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bike, Building2, ChevronRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!(CLERK_KEY && CLERK_KEY.startsWith("pk_"));

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [role, setRole] = useState<"admin" | "consumer" | null>(
    (params.get("role") as any) || null
  );
  const [step, setStep] = useState<"role" | "form" | "verify">("role");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [code, setCode] = useState("");

  useEffect(() => {
    if (params.get("role")) setStep("form");
  }, [params]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);

    if (!hasClerk) {
      // Demo mode
      toast.success("Account created! (Demo Mode) 🚲");
      setTimeout(() => {
        router.push(role === "admin" ? "/admin/dashboard" : "/consumer/home");
      }, 800);
      setLoading(false);
      return;
    }

    try {
      const { useSignUp } = await import("@clerk/nextjs");
      toast.error("Clerk is configured — please reload.");
    } catch (err: any) {
      toast.error(err?.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.success("Verified! (Demo Mode) 🚲");
    setTimeout(() => {
      router.push(role === "admin" ? "/admin/dashboard" : "/consumer/home");
    }, 800);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col w-1/2 glass-light relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.3) 0%, transparent 70%)" }} />
        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-6">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display font-bold text-3xl text-white mb-3">BikeSense AI</h2>
          <p className="text-slate-400 text-lg max-w-xs mx-auto">
            Intelligent bike rental forecasting for Bangalore&apos;s mobility ecosystem.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[["17,379", "Data Points"], ["94.2%", "Accuracy"], ["8", "Zones"], ["₹81K", "Avg Savings"]].map(([v, l]) => (
              <div key={l} className="glass rounded-xl p-4 text-center">
                <div className="text-xl font-display font-bold text-white">{v}</div>
                <div className="text-xs text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white">
              Bike<span className="text-brand-400">Sense</span>
            </span>
          </div>

          {step === "role" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display font-bold text-2xl text-white mb-2">Create your account</h1>
              <p className="text-slate-400 mb-8">Choose how you&apos;ll use BikeSense</p>
              <div className="space-y-4">
                {[
                  { r: "admin", icon: Building2, label: "Rental Company / Operator", desc: "Manage fleet, demand forecasting, dynamic pricing & revenue analytics" },
                  { r: "consumer", icon: Bike, label: "Consumer / Rider", desc: "Find best prices, predict costs & discover bikes near you" },
                ].map(({ r, icon: Icon, label, desc }) => (
                  <button
                    key={r}
                    onClick={() => { setRole(r as any); setStep("form"); }}
                    className="w-full glass rounded-xl p-5 flex items-start gap-4 text-left hover:border-brand-500/30 border border-transparent transition-all hover-lift"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-brand-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{label}</div>
                      <div className="text-sm text-slate-400">{desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 mt-1" />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setStep("role")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
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
              <form onSubmit={handleSignUp} className="space-y-4">
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
                  <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com" className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
                  <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 8 characters" className="input-dark w-full" minLength={8} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : "Create Account"}
                </button>
                {!hasClerk && (
                  <div className="flex items-start gap-2 p-3 glass-light rounded-lg border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">Demo mode — add Clerk key to Vercel env vars for real auth.</p>
                  </div>
                )}
              </form>
              <p className="text-center text-sm text-slate-500 mt-4">
                Have an account?{" "}
                <Link href="/auth/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display font-bold text-2xl text-white mb-2">Check your email</h1>
              <p className="text-slate-400 mb-6">
                We sent a 6-digit code to <strong className="text-white">{form.email}</strong>
              </p>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Verification Code</label>
                  <input required value={code} onChange={e => setCode(e.target.value)}
                    placeholder="000000" maxLength={6}
                    className="input-dark w-full text-center text-2xl tracking-widest font-mono" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : "Verify & Continue"}
                </button>
              </form>
            </motion.div>
          )}
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
