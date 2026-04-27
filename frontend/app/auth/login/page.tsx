// "use client";
// import { useState } from "react";
// import { useSignIn } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Bike, Loader2 } from "lucide-react";
// import toast from "react-hot-toast";

// export default function LoginPage() {
//   const { signIn, setActive, isLoaded } = useSignIn();
//   const router = useRouter();
//   const [form, setForm] = useState({ email:"", password:"" });
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isLoaded) return;
//     setLoading(true);
//     try {
//       const result = await signIn.create({
//         identifier: form.email,
//         password:   form.password,
//       });
//       if (result.status === "complete") {
//         await setActive({ session: result.createdSessionId });
//         // Route based on role in metadata
//         const user = result.createdSessionId;
//         toast.success("Welcome back! 🚲");
//         // Check role from Clerk user metadata
//         router.push("/admin/dashboard"); // Default; middleware handles role split
//       }
//     } catch (err: any) {
//       toast.error(err.errors?.[0]?.message || "Invalid credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-8">
//       <div className="w-full max-w-md">
//         <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
//           <div className="flex items-center justify-center gap-2 mb-8">
//             <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
//               <Bike className="w-5 h-5 text-white" />
//             </div>
//             <span className="font-display font-bold text-xl text-white">Bike<span className="text-brand-400">Sense</span></span>
//           </div>

//           <div className="glass rounded-2xl p-8">
//             <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Sign in</h1>
//             <p className="text-slate-400 text-center text-sm mb-6">Access your dashboard</p>

//             <form onSubmit={handleLogin} className="space-y-4">
//               <div>
//                 <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
//                 <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
//                   placeholder="you@example.com" className="input-dark w-full" />
//               </div>
//               <div>
//                 <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
//                 <input required type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
//                   placeholder="Your password" className="input-dark w-full" />
//               </div>
//               <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
//                 {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Signing in...</> : "Sign In"}
//               </button>
//             </form>

//             <div className="mt-4 text-center text-sm">
//               <Link href="#" className="text-slate-500 hover:text-white text-xs">Forgot password?</Link>
//             </div>
//           </div>

//           <p className="text-center text-sm text-slate-500 mt-4">
//             Don't have an account? <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">Sign up free</Link>
//           </p>
//         </motion.div>
//       </div>
//     </div>
//   );
// }


"use client";
import { useState } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bike, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect immediately
  if (userLoaded && user) {
    const role = user.unsafeMetadata?.role as string;
    router.push(role === "consumer" ? "/consumer/home" : "/admin/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: form.email,
        password:   form.password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back! 🚲");
        router.push("/redirect");
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Bike<span className="text-brand-400">Sense</span></span>
          </div>
          <div className="glass rounded-2xl p-8">
            <h1 className="font-display font-bold text-2xl text-white text-center mb-1">Sign in</h1>
            <p className="text-slate-400 text-center text-sm mb-6">Access your dashboard</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Email</label>
                <input required type="email" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})}
                  placeholder="you@example.com" className="input-dark w-full" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Password</label>
                <input required type="password" value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})}
                  placeholder="Your password" className="input-dark w-full" />
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Signing in...</> : "Sign In"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="#" className="text-slate-500 hover:text-white text-xs">Forgot password?</Link>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account? <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}