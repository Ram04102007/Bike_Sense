"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { DollarSign, Zap, TrendingUp, Settings, RefreshCw, WifiOff, MapPin, Clock } from "lucide-react";
import { getPricingRec, getHourlyPriceSchedule, getZonePriceMatrix } from "@/lib/api";

const AREAS = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];

// Festival events — business-defined (not ML), shown as reference context
const FESTIVAL_EVENTS = [
  { event:"Diwali (Oct 20–24)",    multiplier:2.30, expected_rides:"4,200/day", impact:"High" },
  { event:"New Year (Dec 31)",     multiplier:1.85, expected_rides:"3,800",     impact:"High" },
  { event:"Bangalore Marathon",    multiplier:1.60, expected_rides:"2,100",     impact:"Moderate" },
  { event:"IPL Match Days",        multiplier:1.45, expected_rides:"1,800",     impact:"Moderate" },
  { event:"Republic Day",          multiplier:1.30, expected_rides:"1,500",     impact:"Low" },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="mt-0.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">
            {p.name === "Price" ? `₹${p.value}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

// Color bar based on surge
function surgeColor(surge: number) {
  if (surge >= 1.25) return "#ef4444";
  if (surge >= 1.17) return "#f97316";
  if (surge >= 1.08) return "#f59e0b";
  return "#10b981";
}

export default function PricingPage() {
  const [basePrice, setBasePrice]     = useState(65);
  const [selectedArea, setSelectedArea] = useState("Indiranagar");
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [isWeekend, setIsWeekend]     = useState(false);

  // Calculator ML rec
  const [mlRec, setMlRec]             = useState<any>(null);
  const [recLoading, setRecLoading]   = useState(false);
  const [isLive, setIsLive]           = useState<boolean | null>(null);

  // 24-hour chart
  const [hourlyData, setHourlyData]   = useState<any[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [hourlySource, setHourlySource] = useState<"live"|"fallback">("fallback");

  // Zone matrix
  const [zoneData, setZoneData]       = useState<any[]>([]);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneSource, setZoneSource]   = useState<"live"|"fallback">("fallback");

  // ── Fetch calculator recommendation ──────────────────────────────────────────
  const fetchRecommendation = useCallback(async () => {
    setRecLoading(true);
    try {
      const rec = await getPricingRec(selectedArea, selectedHour, isWeekend);
      if (rec) { setMlRec(rec); setIsLive(true); }
      else      { setIsLive(false); }
    } catch { setIsLive(false); }
    finally   { setRecLoading(false); }
  }, [selectedArea, selectedHour, isWeekend]);

  useEffect(() => { fetchRecommendation(); }, [fetchRecommendation]);

  // ── Fetch 24-hour schedule (re-fetch on area/weekend change) ─────────────────
  const fetchHourly = useCallback(async () => {
    setHourlyLoading(true);
    try {
      const data = await getHourlyPriceSchedule(selectedArea, isWeekend);
      setHourlyData(data);
      // Detect live vs fallback: live data will have varying demand_index
      const uniq = new Set(data.map((d: any) => d.demand_index)).size;
      setHourlySource(uniq > 3 ? "live" : "fallback");
    } catch { setHourlyData([]); }
    finally  { setHourlyLoading(false); }
  }, [selectedArea, isWeekend]);

  useEffect(() => { fetchHourly(); }, [fetchHourly]);

  // ── Fetch zone matrix ─────────────────────────────────────────────────────────
  const fetchZones = useCallback(async () => {
    setZoneLoading(true);
    try {
      const data = await getZonePriceMatrix(isWeekend);
      setZoneData(data);
      const uniq = new Set(data.map((d: any) => d.price)).size;
      setZoneSource(uniq > 2 ? "live" : "fallback");
    } catch { setZoneData([]); }
    finally  { setZoneLoading(false); }
  }, [isWeekend]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // ── Derived price from calculator ─────────────────────────────────────────────
  const weekendBoost  = isWeekend ? 1.1 : 1.0;
  const activeSurge   = mlRec?.surge_multiplier ?? 1.0;
  const finalPrice    = parseFloat((basePrice * activeSurge * weekendBoost).toFixed(2));

  const refreshAll = () => { fetchRecommendation(); fetchHourly(); fetchZones(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" /> Dynamic Pricing Engine
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            AI-driven surge pricing · 4-tier model · SARIMA-calibrated · Bangalore
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLive !== null && (
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
              isLive
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
            }`}>
              {isLive ? <TrendingUp className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? "ML Live" : "Formula Mode"}
            </span>
          )}
          <button onClick={refreshAll} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${(recLoading || hourlyLoading || zoneLoading) ? "animate-spin" : ""}`} />
            Refresh All
          </button>
        </div>
      </div>

      {/* Surge tier legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Standard", mult:"×1.00", price:"₹65.00", color:"#10b981", desc:"Low demand · Off-peak" },
          { label:"Moderate", mult:"×1.08", price:"₹70.20", color:"#f59e0b", desc:"Moderate demand · Evenings" },
          { label:"High",     mult:"×1.17", price:"₹76.05", color:"#f97316", desc:"High demand · Near rush" },
          { label:"Peak",     mult:"×1.25", price:"₹81.25", color:"#ef4444", desc:"Rush hours · Festivals" },
        ].map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass rounded-xl p-4 border border-white/5">
            <div className="text-xs text-slate-500 mb-2">{t.label}</div>
            <div className="font-display font-bold text-2xl mb-0.5" style={{ color: t.color }}>{t.price}</div>
            <div className="font-mono text-sm text-slate-400 mb-2">{t.mult} surge</div>
            <div className="text-xs text-slate-600">{t.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Calculator + 24h Chart row */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Price Calculator ── */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-brand-400" />
            <h3 className="font-display font-semibold text-white">ML Price Calculator</h3>
          </div>
          <div className="space-y-4">
            {/* Zone */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Zone
              </label>
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="input-dark w-full">
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            {/* Hour slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Hour of Day
                </label>
                <span className="text-xs font-mono text-brand-300">{selectedHour.toString().padStart(2,"0")}:00</span>
              </div>
              <input type="range" min={0} max={23} value={selectedHour}
                onChange={e => setSelectedHour(parseInt(e.target.value))}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>00:00</span><span>12:00</span><span>23:00</span>
              </div>
            </div>
            {/* Base price slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500">Base Price (₹)</label>
                <span className="text-xs font-mono text-brand-300">₹{basePrice}</span>
              </div>
              <input type="range" min={50} max={100} value={basePrice}
                onChange={e => setBasePrice(parseInt(e.target.value))}
                className="w-full accent-brand-500" />
            </div>
            {/* Weekend toggle */}
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <span className="text-sm text-slate-300">Weekend pricing (+10%)</span>
              <button onClick={() => setIsWeekend(!isWeekend)}
                className={`w-10 h-5 rounded-full transition-all ${isWeekend ? "bg-brand-500" : "bg-slate-700"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isWeekend ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Result card */}
          <div className="mt-5 p-5 rounded-xl" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(0,245,255,0.05))" }}>
            <div className="text-xs text-slate-500 mb-1">
              {mlRec ? "SARIMA ML-Calibrated Price" : "Formula-Based Price"}
            </div>
            {recLoading ? (
              <div className="h-10 w-32 animate-pulse bg-white/10 rounded-lg mb-1" />
            ) : (
              <div className="text-4xl font-display font-bold text-white mb-1">₹{finalPrice}</div>
            )}
            <div className="text-xs text-slate-400">
              ×{activeSurge.toFixed(2)} surge · {isWeekend ? "×1.1 weekend" : "standard"} · {selectedArea}
            </div>
            {mlRec && (
              <div className="text-xs text-slate-500 mt-0.5">
                Demand Index: {mlRec.demand_index} · {mlRec.strategy}
              </div>
            )}
            <div className="mt-3 text-xs">
              <span className={`${activeSurge >= 1.25 ? "badge-danger" : activeSurge >= 1.08 ? "badge-warning" : "badge-success"}`}>
                {activeSurge >= 1.25 ? "Peak Surge" : activeSurge >= 1.08 ? "Moderate" : "Standard"}
              </span>
            </div>
          </div>
        </div>

        {/* ── 24-Hour ML Price Chart ── */}
        <div className="lg:col-span-3 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">24-Hour Price Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                SARIMA-computed per-hour pricing · {selectedArea}{isWeekend ? " · Weekend" : ""}
              </p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
              hourlySource === "live"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hourlySource === "live" ? "bg-emerald-400" : "bg-blue-400"} animate-pulse`} />
              {hourlySource === "live" ? "Live" : "Demo"}
            </span>
          </div>
          {hourlyLoading ? (
            <Skeleton className="h-56" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selectedArea + isWeekend} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={hourlyData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="hour_label" tick={{ fontSize: 8 }} interval={2} />
                    <YAxis domain={[60, 85]} tick={{ fontSize: 9 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={65}    stroke="#10b981" strokeDasharray="3 3" label={{ value:"Base", fill:"#10b981", fontSize:9 }} />
                    <ReferenceLine y={81.25} stroke="#ef4444" strokeDasharray="3 3" label={{ value:"Peak", fill:"#ef4444", fontSize:9 }} />
                    <Bar dataKey="price" name="Price" radius={[3,3,0,0]}>
                      {hourlyData.map((entry, i) => (
                        <Cell key={i} fill={surgeColor(entry.surge)} fillOpacity={selectedHour === entry.hour ? 1 : 0.65} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-600 text-right mt-1">
                  Highlighted bar = selected hour ({selectedHour.toString().padStart(2,"0")}:00)
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Zone Pricing Matrix (ML-live) ── */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-white">Live Zone Pricing Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time SARIMA recommendation for current hour across all zones
            </p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
            zoneSource === "live"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${zoneSource === "live" ? "bg-emerald-400" : "bg-blue-400"} animate-pulse`} />
            {zoneSource === "live" ? "ML Live" : "Demo"}
          </span>
        </div>
        {zoneLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {zoneData.map((z, i) => (
              <motion.div key={z.zone} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`glass-light rounded-xl p-4 border ${selectedArea === z.zone ? "border-brand-500/40" : "border-transparent"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{z.zone}</span>
                  <span className={`font-mono text-xs ${z.surge >= 1.17 ? "text-red-400" : z.surge >= 1.08 ? "text-amber-400" : "text-emerald-400"}`}>
                    ×{z.surge.toFixed(2)}
                  </span>
                </div>
                <div className="text-2xl font-display font-bold mb-1" style={{ color: surgeColor(z.surge) }}>
                  ₹{z.price.toFixed(2)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`${z.demand === "High" ? "badge-danger" : z.demand === "Moderate" ? "badge-warning" : "badge-success"}`}>
                    {z.demand}
                  </span>
                  <span className="text-xs text-slate-600">
                    {z.rides ? `${z.rides.toLocaleString()} rides` : ""}
                  </span>
                </div>
                {z.revenue > 0 && (
                  <div className="text-xs text-slate-600 mt-1">₹{(z.revenue / 1000).toFixed(0)}K revenue</div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Festival Pricing (business rules — shown as reference) ── */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-display font-semibold text-white">Festival &amp; Event Pricing Calendar</h3>
            <p className="text-xs text-slate-500 mt-0.5">Business-rule overrides applied on top of SARIMA base pricing</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Event","Surge Multiplier","Expected Rides","Impact","Base + Festival Price"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FESTIVAL_EVENTS.map((f, i) => {
                const festPrice = parseFloat((basePrice * f.multiplier).toFixed(2));
                return (
                  <motion.tr key={f.event} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="border-b border-white/3 hover:bg-white/2">
                    <td className="py-3 px-3 font-medium text-white">{f.event}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-amber-400">×{f.multiplier.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{f.expected_rides}</td>
                    <td className="py-3 px-3">
                      <span className={`${f.impact === "High" ? "badge-danger" : f.impact === "Moderate" ? "badge-warning" : "badge-success"}`}>
                        {f.impact}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold" style={{ color: surgeColor(f.multiplier > 1.25 ? 1.25 : f.multiplier) }}>
                      ₹{festPrice}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          * Festival prices = Base Price (₹{basePrice}) × Festival Multiplier. Adjust base price above to see impact.
        </p>
      </div>
    </div>
  );
}
