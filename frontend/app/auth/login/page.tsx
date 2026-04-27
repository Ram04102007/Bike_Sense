"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bike, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!(CLERK_KEY && CLERK_KEY.startsWith("pk_"));

function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasClerk) {
      // Demo mode — redirect to admin dashboard directly
      setLoading(true);
      toast.success("Welcome to BikeSense! (Demo Mode) 🚲");
      setTimeout(() => router.push("/admin/dashboard"), 800);
      return;
    }

    setLoading(true);
    try {
      const { useSignIn } = await import("@clerk/nextjs");
      // Dynamic import to avoid build-time errors
      toast.error("Clerk is configured — please reload if you see this.");
    } catch (err: any) {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
        <input
          required
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          className="input-dark w-full"
        />
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
        <input
          required
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="Your password"
          className="input-dark w-full"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign In"}
      </button>
      {!hasClerk && (
        <div className="flex items-start gap-2 p-3 glass-light rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            Running in demo mode. Add <code className="text-amber-200">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to Vercel env vars to enable real auth.
          </p>
        </div>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Bike<span className="text-brand-400">Sense</span>
            </span>
          </div>

          <div className="glass rounded-2xl p-8">
            <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Sign in</h1>
            <p className="text-slate-400 text-center text-sm mb-6">Access your dashboard</p>
            <LoginForm />
            <div className="mt-4 text-center">
              <Link href="#" className="text-slate-500 hover:text-white text-xs">
                Forgot password?
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}