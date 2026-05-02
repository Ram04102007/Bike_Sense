"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Zap, Clock, TrendingDown, Bike, AlertTriangle, CheckCircle,
  Sparkles, WifiOff, RefreshCw,
} from "lucide-react";
import {
  predictDemand, getHourlyPricing, getWeeklyDayForecast, getDynamicZones, getDynamicModels,
  type PredictionResult, type HourlyPricePoint, type WeeklyDayForecast,
} from "@/lib/api";

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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PredictorPage() {
  const [form, setForm] = useState({
    area: "Indiranagar", model: "Ather 450X", date: "", time: "09:00", duration: 2,
  });
  const [result,   setResult]   = useState<PredictionResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [isLive,   setIsLive]   = useState<boolean | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [history,  setHistory]  = useState<Array<PredictionResult & { id: number; duration: number; model: string; area: string }>>([]);

  // ── Dynamic Zones & Models ──────────────────────────────────────────────────
  const [dynamicAreas, setDynamicAreas] = useState<string[]>([]);
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);

  useEffect(() => {
    const initConfig = async () => {
      try {
        const [zones, models] = await Promise.all([getDynamicZones(), getDynamicModels()]);
        setDynamicAreas(zones);
        setDynamicModels(models);
        if (zones.length > 0) setForm(f => ({ ...f, area: zones[0] }));
        if (models.length > 0) setForm(f => ({ ...f, model: models[0] }));
      } catch (e) {}
    };
    initConfig();
  }, []);

  // ── Chart data — fetched from backend ──────────────────────────────────────
  const [hourlyData,  setHourlyData]  = useState<HourlyPricePoint[]>([]);
  const [weeklyData,  setWeeklyData]  = useState<WeeklyDayForecast[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsLive,    setChartsLive]    = useState(false);

  const loadCharts = async () => {
    setChartsLoading(true);
    try {
      const [hourly, weekly] = await Promise.all([getHourlyPricing(), getWeeklyDayForecast()]);
      setHourlyData(hourly);
      setWeeklyData(weekly);
      // Detect live: real SARIMA produces non-standard prices (not exactly 65/70.2/81.25)
      const liveDetected = hourly.some(h => h.price !== 65 && h.price !== 70.2 && h.price !== 81.25);
      setChartsLive(liveDetected);
    } catch {
      // fallback already handled inside apiFetch
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => { loadCharts(); }, []);

  // ── Peak price from live data for reference lines ──────────────────────────
  const peakPrice  = hourlyData.length ? Math.max(...hourlyData.map(h => h.price)) : 81.25;
  const stdPrice   = hourlyData.length ? Math.min(...hourlyData.map(h => h.price)) : 65;
  const cheapestDay = weeklyData.length
    ? weeklyData.reduce((a, b) => a.price < b.price ? a : b)
    : null;

  // ── Prediction ─────────────────────────────────────────────────────────────
  const predict = async () => {
    setLoading(true);
    setError(null);
    try {
      const date = form.date || new Date().toISOString().split("T")[0];
      const res = await predictDemand({ date, time: form.time, location: form.area, bike_model: form.model });

      // Use backend-computed prices directly — backend now applies area weight + model base + SARIMA surge
      const enriched: PredictionResult = {
        ...res,
        predicted_price: res.predicted_price,
        base_price:      res.base_price,
        savings_vs_peak: res.savings_vs_peak > 0 ? res.savings_vs_peak : 0,
      };

      setIsLive(res.expected_demand % 10 !== 0);
      setResult(enriched);
      setHistory(prev => [{ ...enriched, id: Date.now(), duration: form.duration, model: form.model, area: form.area }, ...prev.slice(0, 4)]);
    } catch {
      setError("Prediction failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = result ? parseFloat((result.predicted_price * form.duration).toFixed(2)) : 0;
  const cheapHours = hourlyData.filter(h => h.price === stdPrice).map(h => h.hour);
  const currentHour = parseInt(form.time.split(":")[0]);
  const altHour = result?.surge_multiplier > 1.0 && cheapHours.length
    ? cheapHours.filter(h => h !== currentHour)[0] ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-400" /> Smart Price Predictor
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">SARIMA-powered demand &amp; pricing predictions for your rental</p>
        </div>
        <div className="flex items-center gap-2">
          {chartsLive && (
            <span className="badge-success flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live SARIMA
            </span>
          )}
          <button onClick={loadCharts} disabled={chartsLoading} title="Refresh chart data"
            className="glass rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${chartsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Form ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" /> Configure Your Ride
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Pickup Zone</label>
                <select id="predict-area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="input-dark w-full">
                  {dynamicAreas.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Bike Model</label>
                <select id="predict-model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input-dark w-full">
                  {dynamicModels.map(m => <option key={m}>{m}</option>)}
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

        {/* ── Results ───────────────────────────────────────────────────── */}
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
                  {altHour != null && (
                    <div className="flex items-center gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm text-amber-200">
                        💡 Rent at <strong>{altHour.toString().padStart(2,"0")}:00</strong> instead — Standard pricing (₹{stdPrice}/hr)
                      </span>
                    </div>
                  )}
                </div>

                {/* Bike model comparison */}
                <div className="glass rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-3">Compare All Models · {result.location}</h4>
                  <div className="space-y-2">
                    {dynamicModels.map(m => {
                      const bp = 65; // Dynamic models default to 65 unless specified in backend
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

          {/* Hourly price chart — DYNAMIC from backend */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" /> Today's Hourly Pricing
              </h4>
              {chartsLive && <span className="badge-success text-xs">Live SARIMA</span>}
            </div>
            {chartsLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour_label" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis domain={[stdPrice - 5, peakPrice + 5]} tick={{ fontSize: 9 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={stdPrice}  stroke="#10b981" strokeDasharray="3 3" />
                  <ReferenceLine y={peakPrice} stroke="#ef4444" strokeDasharray="3 3" />
                  <Area type="stepAfter" dataKey="price" name="Price (₹)" stroke="#6366f1" fill="url(#pGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 text-xs text-slate-500">
              🟢 Green = Standard (₹{stdPrice}) · 🔴 Red = Peak Surge (₹{peakPrice})
              {cheapestDay && ` · Best window: hours with ₹${stdPrice}`}
            </div>
          </div>

          {/* Weekly best days — DYNAMIC from backend */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" /> Best Day This Week
              </h4>
              {chartsLive && <span className="badge-success text-xs">SARIMA Forecast</span>}
            </div>
            {chartsLoading ? <Skeleton className="h-24" /> : (
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map(d => {
                  const isCheapest = d.price === stdPrice;
                  const isPeak = d.price === peakPrice;
                  return (
                    <div key={d.day} className={`rounded-xl p-3 text-center border ${
                      isCheapest ? "bg-emerald-500/10 border-emerald-500/20"
                      : isPeak   ? "bg-red-500/10 border-red-500/20"
                                 : "bg-amber-500/10 border-amber-500/20"
                    }`}>
                      <div className="text-xs text-slate-500">{d.day}</div>
                      <div className={`text-sm font-mono font-bold mt-1 ${
                        isCheapest ? "text-emerald-400" : isPeak ? "text-red-400" : "text-amber-400"
                      }`}>₹{d.price}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{d.demand_label}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {cheapestDay && (
              <p className="text-xs text-slate-500 mt-3">
                💡 <strong className="text-slate-400">{weeklyData.filter(d => d.price === stdPrice).map(d => d.day).join(" & ")}</strong> are cheapest — Standard pricing all day!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
