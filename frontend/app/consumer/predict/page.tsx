"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Zap, Clock, TrendingDown, Bike, AlertTriangle, CheckCircle,
  Sparkles, WifiOff, RefreshCw,
} from "lucide-react";
import { predictDemand, type PredictionResult } from "@/lib/api";

const AREAS  = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];
const MODELS = ["Ather 450X","Bounce Infinity","Yulu Move","Rapido Bike","Royal Enfield","Honda Activa"];

// Base price per model (₹/hr at ×1.00 surge)
const BASE_PRICES: Record<string, number> = {
  "Ather 450X": 81, "Bounce Infinity": 69, "Yulu Move": 45,
  "Rapido Bike": 38, "Royal Enfield": 120, "Honda Activa": 55,
};

// Static hourly price schedule (used for the "Today's Pricing" chart — always shown)
const hourlyForecast = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, "00")}:00`,
  price: h < 6 || h > 22 ? 65 : (h >= 7 && h <= 9) || (h >= 17 && h <= 20) ? 81.25 : h >= 10 && h <= 15 ? 65 : 70.2,
  demand: Math.round(200 + Math.exp(-0.5 * ((h - 8) / 2.5) ** 2) * 400 + Math.exp(-0.5 * ((h - 18) / 2.5) ** 2) * 300),
}));

const weeklyForecast = [
  { day: "Mon", price: 70.2, demand: "Moderate" },
  { day: "Tue", price: 65,   demand: "Low" },
  { day: "Wed", price: 65,   demand: "Low" },
  { day: "Thu", price: 70.2, demand: "Moderate" },
  { day: "Fri", price: 76,   demand: "High" },
  { day: "Sat", price: 81.25,demand: "Peak" },
  { day: "Sun", price: 76,   demand: "High" },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold text-white">
            {p.name === "Price (₹)" ? `₹${p.value}` : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PredictorPage() {
  const [form, setForm] = useState({
    area: "Indiranagar",
    model: "Ather 450X",
    date: "",
    time: "09:00",
    duration: 2,
  });
  const [result, setResult]   = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLive,  setIsLive]  = useState<boolean | null>(null); // null = not yet tried
  const [error,   setError]   = useState<string | null>(null);
  const [history, setHistory] = useState<Array<PredictionResult & { id: number; duration: number; model: string; area: string }>>([]);

  const predict = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use today if no date selected
      const date = form.date || new Date().toISOString().split("T")[0];
      const res = await predictDemand({
        date,
        time:       form.time,
        location:   form.area,
        bike_model: form.model,
      });

      // The ML engine returns city-level demand. We scale price by bike model base.
      const baseP  = BASE_PRICES[form.model] ?? 65;
      const scaled = parseFloat((baseP * res.surge_multiplier).toFixed(2));

      const enriched: PredictionResult = {
        ...res,
        predicted_price: scaled,
        base_price:      baseP,
        savings_vs_peak: parseFloat((baseP * 1.25 - scaled).toFixed(2)),
      };

      // Detect live vs fallback: real SARIMA gives non-round demand figures
      setIsLive(res.expected_demand % 10 !== 0);
      setResult(enriched);
      setHistory(prev => [{ ...enriched, id: Date.now(), duration: form.duration, model: form.model, area: form.area }, ...prev.slice(0, 4)]);
    } catch (e: any) {
      setError("Prediction failed. Check your connection.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = result ? parseFloat((result.predicted_price * form.duration).toFixed(2)) : 0;

  // Best time to rent: 10–15 h (standard pricing window)
  const cheapHours = [10, 11, 12, 13, 14, 15];
  const currentHour = parseInt(form.time.split(":")[0]);
  const altHour = result?.surge_multiplier > 1.0
    ? cheapHours.filter(h => h !== currentHour)[0]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-brand-400" /> Smart Price Predictor
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">SARIMA-powered demand &amp; pricing predictions for your rental</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Form ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" /> Configure Your Ride
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Pickup Zone</label>
                <select id="predict-area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="input-dark w-full">
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Bike Model</label>
                <select id="predict-model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input-dark w-full">
                  {MODELS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Date</label>
                  <input id="predict-date" type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Time</label>
                  <input id="predict-time" type="time" value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="input-dark w-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-500">Duration (hours)</label>
                  <span className="text-xs font-mono text-brand-300">{form.duration}h</span>
                </div>
                <input type="range" min={1} max={12} value={form.duration}
                  onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
                  className="w-full accent-brand-500" />
              </div>
              <button id="predict-btn" onClick={predict} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Predicting...</>
                  : <><Zap className="w-4 h-4" />Predict Price</>}
              </button>
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <WifiOff className="w-3 h-3" /> {error}
                </p>
              )}
            </div>
          </div>

          {/* Prediction History */}
          {history.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Recent Predictions</h4>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-2.5 glass-light rounded-lg">
                    <div>
                      <div className="text-xs font-medium text-white">{h.model} · {h.area}</div>
                      <div className="text-xs text-slate-500">{h.datetime?.split(" ")[1] ?? form.time} · {h.duration}h</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-white">₹{(h.predicted_price * h.duration).toFixed(2)}</div>
                      <div className={`text-xs ${h.surge_multiplier > 1.1 ? "text-red-400" : h.surge_multiplier > 1 ? "text-amber-400" : "text-emerald-400"}`}>
                        {h.price_label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Source badge */}
                {isLive !== null && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-fit ${isLive ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-blue-500/10 text-blue-300 border border-blue-500/20"}`}>
                    {isLive ? <CheckCircle className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isLive ? "Live SARIMA prediction" : "Demo mode (backend offline)"}
                  </div>
                )}

                {/* Main result card */}
                <div className={`glass rounded-2xl p-6 border ${result.surge_multiplier > 1.1 ? "border-red-500/20" : result.surge_multiplier > 1 ? "border-amber-500/20" : "border-emerald-500/20"}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Predicted Price / hr</div>
                      <div className="text-5xl font-display font-bold text-white">₹{result.predicted_price}</div>
                      <div className="text-slate-400 text-sm mt-1">per hour · {form.model}</div>
                    </div>
                    <div className={`text-right ${result.surge_multiplier > 1.1 ? "text-red-400" : result.surge_multiplier > 1 ? "text-amber-400" : "text-emerald-400"}`}>
                      <div className="text-2xl font-display font-bold">×{result.surge_multiplier.toFixed(2)}</div>
                      <div className="text-sm font-medium">{result.price_label}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="glass-light rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="font-bold text-white">{form.duration}h</div>
                    </div>
                    <div className="glass-light rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500">Total Cost</div>
                      <div className="font-bold text-white">₹{totalCost}</div>
                    </div>
                    <div className="glass-light rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500">Demand</div>
                      <div className={`font-bold ${result.demand_level === "Very High" ? "text-red-400" : result.demand_level === "Low" ? "text-emerald-400" : "text-amber-400"}`}>
                        {result.demand_level}
                      </div>
                    </div>
                  </div>

                  {/* Expected demand from ML */}
                  <div className="flex items-center gap-2 p-3 bg-white/3 rounded-lg mb-2">
                    <Bike className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-400">
                      Expected city demand: <strong className="text-white">{result.expected_demand.toFixed(0)} rides</strong>
                      &nbsp;(CI: {result.confidence_interval[0].toFixed(0)} – {result.confidence_interval[1].toFixed(0)})
                    </span>
                  </div>

                  {result.savings_vs_peak > 0 && (
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mt-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-emerald-300">
                        You're saving <strong>₹{result.savings_vs_peak}</strong>/hr vs peak pricing!
                      </span>
                    </div>
                  )}
                  {altHour && (
                    <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm text-amber-200">
                        💡 Rent at <strong>{altHour.toString().padStart(2,"0")}:00</strong> instead — Standard pricing (₹{BASE_PRICES[form.model]}/hr)
                      </span>
                    </div>
                  )}
                </div>

                {/* Bike model comparison */}
                <div className="glass rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-3">Compare All Models · {result.location}</h4>
                  <div className="space-y-2">
                    {MODELS.map(m => {
                      const bp = BASE_PRICES[m] ?? 65;
                      const pr = parseFloat((bp * result.surge_multiplier).toFixed(2));
                      return (
                        <div key={m} className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${m === form.model ? "bg-brand-500/10 border border-brand-500/20" : "glass-light"}`}>
                          <span className="text-sm text-slate-300">{m}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">₹{pr}/hr</span>
                            {m === form.model && <span className="badge-info text-xs">Selected</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass rounded-2xl p-16 text-center">
                <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <div className="text-slate-400 font-medium">Configure your ride and click Predict</div>
                <div className="text-slate-600 text-sm mt-1">SARIMA AI will forecast your price &amp; demand level</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hourly price chart (always visible) */}
          <div className="glass rounded-2xl p-6">
            <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Today's Hourly Pricing
            </h4>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={hourlyForecast}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis domain={[60, 85]} tick={{ fontSize: 9 }} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={65}    stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={81.25} stroke="#ef4444" strokeDasharray="3 3" />
                <Area type="stepAfter" dataKey="price" name="Price (₹)" stroke="#6366f1" fill="url(#pGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 text-xs text-slate-500">
              🟢 Green = Standard (₹65) · 🔴 Red = Peak Surge (₹81.25) · Best window: 10 AM – 4 PM
            </div>
          </div>

          {/* Weekly best days */}
          <div className="glass rounded-2xl p-6">
            <h4 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" /> Best Day This Week
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {weeklyForecast.map(d => (
                <div key={d.day} className={`rounded-xl p-3 text-center ${d.price === 65 ? "bg-emerald-500/10 border border-emerald-500/20" : d.price === 81.25 ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                  <div className="text-xs text-slate-500">{d.day}</div>
                  <div className={`text-sm font-mono font-bold mt-1 ${d.price === 65 ? "text-emerald-400" : d.price === 81.25 ? "text-red-400" : "text-amber-400"}`}>
                    ₹{d.price}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">💡 Tue &amp; Wed are cheapest — Standard pricing all day!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
