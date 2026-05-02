"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn({ email: form.email, password: form.password });
      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(`Welcome back, ${result.session.user.firstName}! 👋`);
      // Route based on role
      if (result.session.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/consumer/home");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-2/5 relative overflow-hidden items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.25) 0%, transparent 60%)" }} />
        <div className="relative text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Bike className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="font-display font-bold text-4xl text-white mb-3">BikeSense AI</h1>
          <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
            Intelligent bike rental demand forecasting for Bangalore's mobility ecosystem.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {[["17,379", "Training Records"], ["94.2%", "Forecast Accuracy"], ["8", "City Zones"], ["SARIMA", "ML Model"]].map(([v, l]) => (
              <motion.div key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-4 text-center border border-white/5">
                <div className="text-xl font-display font-bold text-white">{v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{l}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 flex items-center gap-2 text-xs text-slate-600">
          <Shield className="w-3 h-3" /> Secured with SHA-256 session tokens
        </div>
      </div>

      {/* ── Right login form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Bike<span className="text-brand-400">Sense</span>
            </span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-white">Sign in</h2>
                <p className="text-slate-400 text-sm mt-1">Access your BikeSense dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-medium">Email address</label>
                  <input
                    required type="email" autoComplete="email"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input-dark w-full"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-500 font-medium">Password</label>
                    <Link href="#" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      required type={showPwd ? "text" : "password"} autoComplete="current-password"
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Your password"
                      className="input-dark w-full pr-10"
                    />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                    : "Sign In"}
                </button>
              </form>

              {/* Quick demo accounts */}
              <div className="mt-5 pt-5 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-3 text-center">Quick demo access</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => {
                    setForm({ email: "admin@bikesense.ai", password: "Admin@1234" });
                  }} className="glass-light rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors text-center border border-white/5">
                    🏢 Admin Demo
                  </button>
                  <button onClick={() => {
                    setForm({ email: "rider@bikesense.ai", password: "Rider@1234" });
                  }} className="glass-light rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors text-center border border-white/5">
                    🚲 Rider Demo
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  First time? <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">Create the demo accounts via Sign Up</Link>
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
                Sign up free
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}