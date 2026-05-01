"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Battery, Star, MapPin, Filter, Search, Zap, ChevronRight, RefreshCw, WifiOff, Calendar } from "lucide-react";
import { getBikes, type BikeItem } from "@/lib/api";

// ─── Bike metadata not returned by the API (colour, emoji, desc) ─────────────
const BIKE_META: Record<string, { color: string; emoji: string; desc: string }> = {
  "Ather 450X":     { color: "#6366f1", emoji: "⚡", desc: "Premium EV scooter with smart dashboard & regenerative braking." },
  "Bounce Infinity":{ color: "#00f5ff", emoji: "⚡", desc: "Mid-range EV with swappable battery. Lightweight and easy to manoeuvre." },
  "Yulu Move":      { color: "#00ff88", emoji: "⚡", desc: "Compact city EV. Perfect for short commutes. Lock/unlock via app." },
  "Honda Activa":   { color: "#f59e0b", emoji: "🏍️", desc: "India's most trusted scooter. Reliable, fuel-efficient, comfortable ride." },
  "Royal Enfield":  { color: "#a78bfa", emoji: "👑", desc: "Classic 350cc. Weekend warrior. Book in advance — very popular!" },
  "Rapido Bike":    { color: "#94a3b8", emoji: "💰", desc: "Budget-friendly. Get around without breaking the bank." },
};
const getMeta = (name: string) =>
  BIKE_META[name] ?? { color: "#6366f1", emoji: "🚲", desc: "Available for rent in Bangalore." };

const TYPES = ["All", "EV", "Scooter", "Premium", "Budget"];
const AREAS = ["All", "Indiranagar", "Koramangala", "Whitefield", "Marathahalli", "HSR Layout", "Jayanagar", "Electronic City", "Hebbal"];

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="h-1.5 bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/5 rounded w-2/3" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
          </div>
          <div className="w-14 h-8 bg-white/5 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-10 bg-white/5 rounded-full" />
          <div className="h-5 w-14 bg-white/5 rounded-full" />
          <div className="h-5 w-16 bg-white/5 rounded-full" />
        </div>
        <div className="h-8 bg-white/5 rounded w-full" />
        <div className="h-10 bg-white/5 rounded-lg w-full" />
      </div>
    </div>
  );
}

// ─── Bike Card ────────────────────────────────────────────────────────────────
function BikeCard({ bike }: { bike: BikeItem }) {
  const [booked, setBooked] = useState(false);
  const meta = getMeta(bike.name);
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-2xl overflow-hidden hover-lift transition-all ${!bike.available ? "opacity-60" : ""}`}>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
              {meta.emoji}
            </div>
            <div>
              <div className="font-display font-semibold text-white">{bike.name}</div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />{bike.area}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-xl text-white">₹{bike.price_per_hr}<span className="text-xs text-slate-500 font-normal">/hr</span></div>
            <div className="flex items-center gap-1 text-xs text-amber-400 justify-end">
              <Star className="w-3 h-3 fill-amber-400" />{bike.rating}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full border"
            style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}>
            {bike.type}
          </span>
          {bike.battery != null && (
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${bike.battery > 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
              <Battery className="w-3 h-3" />{bike.battery}%
            </span>
          )}
          {bike.range_km != null && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30">
              {bike.range_km}km range
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${bike.available ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {bike.available ? "Available" : "Unavailable"}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">{meta.desc}</p>

        <button
          disabled={!bike.available}
          onClick={() => setBooked(true)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            booked ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
            : bike.available ? "btn-primary" : "bg-slate-700/30 text-slate-600 cursor-not-allowed"
          }`}>
          {booked ? <><Zap className="w-4 h-4" />Booking Confirmed!</> :
           bike.available ? <>Book Now <ChevronRight className="w-4 h-4" /></> : "Not Available"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [bikes,      setBikes]      = useState<BikeItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [isLive,     setIsLive]     = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState<"price" | "rating">("price");
  const [availOnly,  setAvailOnly]  = useState(false);
  const [targetTime, setTargetTime] = useState("");

  const fetchBikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedTime = targetTime ? new Date(targetTime).toISOString() : undefined;
      const data = await getBikes(undefined, undefined, formattedTime);
      setBikes(data);
      // Detect live data: real backend returns non-round ratings
      setIsLive(data.length > 0 && data[0].rating % 1 !== 0 || data.length > 8);
    } catch {
      setError("Could not reach backend. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [targetTime]);

  useEffect(() => { fetchBikes(); }, [fetchBikes]);

  // Client-side filter & sort applied on fetched data
  const filtered = bikes
    .filter(b => typeFilter === "All" || b.type === typeFilter)
    .filter(b => areaFilter === "All" || b.area === areaFilter)
    .filter(b => !availOnly || b.available)
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.area.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "price" ? a.price_per_hr - b.price_per_hr : b.rating - a.rating);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-brand-400" /> Bike Marketplace
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Loading bikes..." : `${filtered.length} bikes found across Bangalore`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge-${isLive ? "success" : "info"} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-blue-400"}`} />
            {isLive ? "Live" : "Demo"}
          </span>
          <button onClick={fetchBikes} disabled={loading} title="Refresh bikes from backend"
            className="glass rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
          <WifiOff className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search bikes or areas..."
              className="input-dark w-full pl-9 py-1.5 text-sm" />
          </div>
          <div className="relative shrink-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="datetime-local" 
              value={targetTime} onChange={e => setTargetTime(e.target.value)}
              className="input-dark w-full pl-9 py-1.5 text-sm" />
          </div>
          <button onClick={() => setAvailOnly(!availOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${availOnly ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "glass text-slate-400 hover:text-white"}`}>
            ✓ Available Only
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input-dark text-sm py-1.5 shrink-0">
            <option value="price">Sort: Price</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>

        {/* Type pills */}
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${typeFilter === t ? "bg-brand-500 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
              {t === "EV" ? "⚡ EV" : t === "Premium" ? "👑 Premium" : t === "Budget" ? "💰 Budget" : t === "Scooter" ? "🛵 Scooter" : "All"}
            </button>
          ))}
        </div>

        {/* Area pills */}
        <div className="flex gap-2 flex-wrap">
          {AREAS.map(a => (
            <button key={a} onClick={() => setAreaFilter(a)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${areaFilter === a ? "bg-brand-500 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </motion.div>
        ) : filtered.length > 0 ? (
          <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(bike => <BikeCard key={bike.id} bike={bike} />)}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-16 text-center">
            <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 font-medium">No bikes found</div>
            <div className="text-slate-600 text-sm mt-1">Try adjusting your filters</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
