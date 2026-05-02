"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Building2, Bike, CheckCircle, Search,
  Trash2, RefreshCw, Shield, Calendar, Mail,
  UserX, Download, Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUser } from "@/lib/auth";

// ── Developer-only access ─────────────────────────────────────────────────────
// ONLY these emails can visit this page. Everyone else is redirected instantly.
const DEVELOPER_EMAILS = [
  "thiruveedhula.sriram2007@gmail.com",
  "ramasasankgudipati@gmail.com"
];

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "consumer";
  createdAt: string;
  registeredAt: string;
  lastSeenAt: string;
  verified: boolean;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function UsersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers]           = useState<AppUser[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<"all" | "admin" | "consumer">("all");
  const [deleting, setDeleting]     = useState<string | null>(null);

  // ── Step 1: Check developer email before rendering anything ───────────────
  useEffect(() => {
    const user = getUser();
    if (!user || !DEVELOPER_EMAILS.some(e => e.toLowerCase() === user.email.toLowerCase())) {
      toast.error("Access denied — developer only.");
      router.replace("/admin/dashboard");
      return;
    }
    setAuthorized(true);
  }, [router]);

  // ── Step 2: Only fetch users after authorization confirmed ─────────────────
  useEffect(() => {
    if (!authorized) return;
    fetchUsers();
  }, [authorized]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/ml/auth/users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      toast.error("Could not load users — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Delete ${user.firstName} ${user.lastName} (${user.email})?`)) return;
    setDeleting(user.id);
    try {
      const res  = await fetch(`/api/ml/auth/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.filter(x => x.id !== user.id));
        toast.success(`${user.firstName} deleted`);
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Delete request failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID","First Name","Last Name","Email","Role","Verified","Registered At"].join(","),
      ...filtered.map(u =>
        [u.id, u.firstName, u.lastName, u.email, u.role, u.verified, u.registeredAt].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `bikesense_users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  // ── Guard: render nothing until email check is done ───────────────────────
  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-slate-500 text-sm">Checking access...</p>
      </div>
    );
  }

  const filtered = users.filter(u => {
    const matchRole   = filter === "all" || u.role === filter;
    const matchSearch = !search || [u.firstName, u.lastName, u.email].some(
      f => f.toLowerCase().includes(search.toLowerCase())
    );
    return matchRole && matchSearch;
  });

  const adminCount    = users.filter(u => u.role === "admin").length;
  const consumerCount = users.filter(u => u.role === "consumer").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" /> User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Developer view · Only visible to <span className="text-brand-400">{DEVELOPER_EMAILS.join(", ")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} disabled={loading}
            className="glass rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="btn-primary flex items-center gap-2 text-sm py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length,    icon: Users,     color: "#6366f1" },
          { label: "Operators",   value: adminCount,       icon: Building2, color: "#00f5ff" },
          { label: "Consumers",   value: consumerCount,    icon: Bike,      color: "#10b981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-white">{loading ? "—" : value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-dark w-full pl-10" />
        </div>
        <div className="flex gap-2">
          {(["all", "admin", "consumer"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f ? "bg-brand-500 text-white" : "glass text-slate-400 hover:text-white"
              }`}>
              {f === "all" ? "All" : f === "admin" ? "Operators" : "Consumers"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Registered</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
                  <div className="col-span-4"><Skeleton className="h-10" /></div>
                  <div className="col-span-2"><Skeleton className="h-6" /></div>
                  <div className="col-span-2"><Skeleton className="h-6" /></div>
                  <div className="col-span-3"><Skeleton className="h-6" /></div>
                  <div className="col-span-1"><Skeleton className="h-6" /></div>
                </div>
              ))
            : filtered.length === 0
            ? (
              <div className="py-16 text-center">
                <UserX className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  {users.length === 0
                    ? "No users registered yet — they appear here after sign-up."
                    : "No users match your filter."}
                </p>
              </div>
            )
            : filtered.map((user, i) => (
              <motion.div key={user.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/2 transition-colors">

                {/* User */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    user.role === "admin" ? "bg-brand-500/20 text-brand-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white text-sm truncate">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <Mail className="w-2.5 h-2.5 shrink-0" />{user.email}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                    user.role === "admin"
                      ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {user.role === "admin" ? <Building2 className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                    {user.role === "admin" ? "Operator" : "Consumer"}
                  </span>
                </div>

                {/* Verified */}
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                </div>

                {/* Time */}
                <div className="col-span-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-600" />
                    {formatDate(user.registeredAt)}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{timeAgo(user.registeredAt)}</div>
                </div>

                {/* Delete */}
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => handleDelete(user)} disabled={deleting === user.id}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    {deleting === user.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            ))}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-slate-600">Showing {filtered.length} of {users.length} users</p>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Shield className="w-3 h-3" /> Resets on server restart
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
