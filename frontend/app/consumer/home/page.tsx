"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MapPin, Clock, Zap, TrendingUp, Star, Battery, ChevronRight,
  Sparkles, AlertTriangle, CheckCircle, RefreshCw, WifiOff,
} from "lucide-react";
import {
  predictDemand, getBikes, getBestTime, getHourlyPricing,
  type BikeItem, type HourlyPricePoint,
} from "@/lib/api";

const AREAS  = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];
const MODELS = ["Ather 450X","Bounce Infinity","Yulu Move","Rapido Bike","Royal Enfield","Honda Activa"];

const BASE_PRICES: Record<string, number> = {
  "Ather 450X": 81, "Bounce Infinity": 69, "Yulu Move": 45,
  "Rapido Bike": 38, "Royal Enfield": 120, "Honda Activa": 55,
};

const BIKE_META: Record<string, { color: string; emoji: string }> = {
  "Ather 450X":     { color: "#6366f1", emoji: "⚡" },
  "Bounce Infinity":{ color: "#00f5ff", emoji: "⚡" },
  "Yulu Move":      { color: "#00ff88", emoji: "⚡" },
  "Honda Activa":   { color: "#f59e0b", emoji: "🏍️" },
  "Royal Enfield":  { color: "#a78bfa", emoji: "👑" },
  "Rapido Bike":    { color: "#94a3b8", emoji: "💰" },
};
const getMeta = (name: string) => BIKE_META[name] ?? { color: "#6366f1", emoji: "🚲" };

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold text-white">
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

// ─── Dynamic Price Predictor (uses real backend) ──────────────────────────────
function PricePredictor({ stdPrice, selectedArea, onAreaChange }: { stdPrice: number, selectedArea: string, onAreaChange: (a: string) => void }) {
  const [form,    setForm]    = useState({ model: "Ather 450X", date: "", time: "09:00" });
  const [result,  setResult]  = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isLive,  setIsLive]  = useState<boolean | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const predict = async () => {
    setLoading(true);
    setError(null);
    try {
      const date = form.date || new Date().toISOString().split("T")[0];
      const res = await predictDemand({ date, time: form.time, location: selectedArea, bike_model: form.model });
      const baseP  = BASE_PRICES[form.model] ?? 65;
      const scaled = parseFloat((baseP * res.surge_multiplier).toFixed(2));
      setIsLive(res.expected_demand % 10 !== 0);
      setIsLive(res.expected_demand % 10 !== 0);

      setResult({
        price:   scaled,
        surge:   res.surge_multiplier,
        label:   res.price_label,
        demand:  res.demand_level,
        saving:  parseFloat((baseP * 1.25 - scaled).toFixed(2)),
        altTime: res.surge_multiplier > 1.0 ? res.alt_time : null,
        altPrice: baseP,
      });
    } catch {
      setError("Prediction failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-brand-400" />
        <h2 className="font-display font-semibold text-white">Smart Price Predictor</h2>
        <span className="badge-info ml-auto">
          {isLive === true ? "SARIMA Live" : isLive === false ? "Demo Mode" : "SARIMA AI"}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Pickup Area</label>
          <select value={selectedArea} onChange={e => onAreaChange(e.target.value)} className="input-dark w-full">
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Bike Type</label>
          <select value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input-dark w-full">
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Date</label>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-dark w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Time</label>
          <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-dark w-full" />
        </div>
      </div>

      <button onClick={predict} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analysing with SARIMA...</>
          : <><Sparkles className="w-4 h-4" />Predict Price &amp; Demand</>}
      </button>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 mb-2">
          <WifiOff className="w-3 h-3" /> {error}
        </p>
      )}

      {result && (
        <motion.div key={Date.now()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`rounded-xl p-5 ${result.surge > 1.1 ? "card-gradient-orange" : result.surge > 1 ? "card-gradient-blue" : "card-gradient-green"} border border-white/10`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-3xl font-display font-bold text-white mb-0.5">₹{result.price}/hr</div>
                <div className={`text-sm font-medium ${result.surge > 1.1 ? "text-red-400" : result.surge > 1 ? "text-amber-400" : "text-emerald-400"}`}>
                  {result.label} · ×{result.surge.toFixed(2)} surge
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Demand</div>
                <div className="font-semibold text-white">{result.demand}</div>
              </div>
            </div>

            {result.saving > 0 && (
              <div className="flex items-center gap-2 p-3 glass-light rounded-lg mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-300">
                  You save <strong>₹{result.saving}/hr</strong> vs peak pricing!
                </span>
              </div>
            )}

            {result.altTime && (
              <div className="flex items-center gap-2 p-3 glass-light rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">
                  Better deal at <strong>{result.altTime}</strong> — just ₹{result.altPrice}/hr!
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConsumerHome() {
  const [selectedArea, setSelectedArea] = useState("Indiranagar"); // Default nearby location
  const [bikes,       setBikes]       = useState<BikeItem[]>([]);
  const [hourlyData,  setHourlyData]  = useState<HourlyPricePoint[]>([]);
  const [tips,        setTips]        = useState<{ icon: string; title: string; desc: string; tag: string }[]>([]);
  const [loadingBikes,  setLoadingBikes]  = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [isLive,        setIsLive]        = useState(false);

  // Derived values from live data
  const stdPrice  = hourlyData.length ? Math.min(...hourlyData.map(h => h.price)) : 65;
  const peakPrice = hourlyData.length ? Math.max(...hourlyData.map(h => h.price)) : 81.25;
  const currentHour = new Date().getHours();
  const currentPricing = hourlyData.find(h => h.hour === currentHour);
  const savingNow = currentPricing ? parseFloat((peakPrice - currentPricing.price).toFixed(2)) : 0;

  useEffect(() => {
    // Load bikes
    const loadBikes = async () => {
      setLoadingBikes(true);
      try {
        const data = await getBikes(selectedArea);
        setBikes(data.filter(b => b.available).slice(0, 4));
        setIsLive(data.length > 0);
      } catch { /* fallback empty */ }
      finally { setLoadingBikes(false); }
    };

    // Load charts + tips
    const loadCharts = async () => {
      setLoadingCharts(true);
      try {
        const [hourly, bestTime] = await Promise.all([getHourlyPricing(selectedArea), getBestTime(selectedArea)]);
        setHourlyData(hourly);

        // Build tips from live best-time API data
        if (bestTime && bestTime.tip) {
          const cheapestHour = bestTime.cheapest_hours?.[0];
          const liveTips = [
            {
              icon: "💚",
              title: "Best time now",
              desc: currentPricing
                ? `${currentPricing.demand_label} pricing active · ₹${currentPricing.price}/hr`
                : bestTime.tip,
              tag: savingNow > 0 ? `Save ₹${savingNow}/hr` : "Good time",
            },
            {
              icon: "📅",
              title: "Cheapest day",
              desc: `${bestTime.cheapest_day ?? "Wednesday"} — avg demand lowest`,
              tag: "Book ahead",
            },
            {
              icon: "⚡",
              title: "Peak hours",
              desc: bestTime.peak_hours?.length
                ? `Avoid ${bestTime.peak_hours.map((p: any) => `${p.hour}:00`).slice(0, 2).join(", ")} (surge pricing)`
                : "Avoid 5–8 PM (×1.25 surge)",
              tag: "Rush hour",
            },
          ];
          setTips(liveTips);
        }
      } catch { /* fallback empty */ }
      finally { setLoadingCharts(false); }
    };

    loadBikes();
    loadCharts();
  }, [selectedArea]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Welcome back 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Find the best bike deals in Bangalore today</p>
        </div>
        <div className="text-right flex items-center gap-3">
          {isLive && (
            <span className="badge-success flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          )}
          <div>
            <div className="text-xs text-slate-500">Current Price</div>
            <div className="font-display font-bold text-xl text-brand-400">
              {loadingCharts ? "..." : `₹${currentPricing?.price ?? stdPrice}/hr`}
            </div>
          </div>
        </div>
      </div>

      {/* Quick tips — dynamic from getBestTime() */}
      <div className="grid md:grid-cols-3 gap-3">
        {loadingCharts
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : tips.map((t, i) => (
              <motion.div key={t.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 flex items-start gap-3 hover-lift">
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{t.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                </div>
                <span className="badge-success text-xs whitespace-nowrap">{t.tag}</span>
              </motion.div>
            ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Price Predictor */}
        <div className="lg:col-span-2">
          <PricePredictor stdPrice={stdPrice} selectedArea={selectedArea} onAreaChange={setSelectedArea} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Today's Price Trend — DYNAMIC from getHourlyPricing() */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-white">Today's Price Trend</h3>
                <p className="text-xs text-slate-500">Hourly pricing across Bangalore · SARIMA model</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            {loadingCharts ? <Skeleton className="h-40" /> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour_label" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis domain={[stdPrice - 5, peakPrice + 5]} tick={{ fontSize: 9 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="stepAfter" dataKey="price" name="Price" stroke="#10b981" fill="url(#priceGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" /> Peak surge (₹{peakPrice})</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Best time (₹{stdPrice})</span>
            </div>
          </div>

          {/* Nearby Bikes — DYNAMIC from getBikes() */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Nearby Available Bikes</h3>
              <a href="/consumer/marketplace" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-3">
              {loadingBikes
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)
                : bikes.length > 0
                ? bikes.map((b, i) => {
                    const meta = getMeta(b.name);
                    return (
                      <motion.div key={b.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4 p-3 glass-light rounded-xl hover-lift cursor-pointer">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                          {meta.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-white">{b.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <MapPin className="w-3 h-3" />{b.area}
                            {b.battery != null && <><Battery className="w-3 h-3 ml-1 text-emerald-400" />{b.battery}%</>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold text-white">₹{b.price_per_hr}<span className="text-xs text-slate-500">/hr</span></div>
                          <div className="flex items-center gap-1 text-xs text-amber-400 justify-end">
                            <Star className="w-3 h-3 fill-amber-400" />{b.rating}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </motion.div>
                    );
                  })
                : (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    <WifiOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    No bikes available. <a href="/consumer/marketplace" className="text-brand-400 hover:underline">Check marketplace →</a>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
