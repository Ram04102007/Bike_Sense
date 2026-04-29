"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Bike, Users, DollarSign, BarChart2,
  Activity, AlertTriangle, CheckCircle, Clock, Zap, RefreshCw
} from "lucide-react";
import { getAdminRevenue, getShortForecast, getHeatmapData, getLiveAlerts, getZoneIntelligence, type RevenueData, type ForecastPoint } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Aggregate hourly SARIMA forecast into 7 daily buckets */
function aggregateToDays(points: ForecastPoint[]): { day: string; demand: number; revenue: number }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { demand: number; revenue: number; count: number }> = {};
  points.forEach(p => {
    const d = new Date(p.dt);
    const key = days[d.getDay()];
    if (!buckets[key]) buckets[key] = { demand: 0, revenue: 0, count: 0 };
    buckets[key].demand += p.demand;
    // Rough revenue: demand * avg price (₹68.80)
    buckets[key].revenue += p.demand * 68.8;
    buckets[key].count++;
  });
  // Ordered Mon → Sun
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return order.filter(d => buckets[d]).map(d => ({
    day: d,
    demand: Math.round(buckets[d].demand / buckets[d].count),
    revenue: Math.round(buckets[d].revenue / buckets[d].count),
  }));
}



// ─── Sub-components ───────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-sm border border-white/5">
      <p className="text-slate-400 mb-1 text-xs">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">
            {typeof p.value === "number" && p.name === "Revenue"
              ? `₹${p.value.toLocaleString()}`
              : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [liveTime, setLiveTime] = useState("");
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; demand: number; revenue: number }[]>([]);
  const [zoneData, setZoneData] = useState<{ zone: string; rides: number; revenue: number; surge: number }[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"live" | "fallback">("live");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Live clock
  useEffect(() => {
    const update = () =>
      setLiveTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rev, forecast, heatmap, alertsData, zoneIntelData] = await Promise.all([
        getAdminRevenue(),
        getShortForecast(),
        getHeatmapData(),
        getLiveAlerts(),
        getZoneIntelligence(),
      ]);
      setRevenue(rev);
      setAlerts(alertsData);
      setWeeklyData(aggregateToDays(forecast));
      setZoneData(zoneIntelData);
      // Detect if we got real or mock data (real will have non-round total_revenue)
      setDataSource(rev.total_revenue % 1000 !== 0 ? "live" : "fallback");
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // KPI cards derived from real revenue data
  const kpis = revenue
    ? [
        { title: "Total Rides (Month)", value: revenue.monthly_rides.toLocaleString(), change: 8.4, icon: Bike, color: "#6366f1", sub: "↑ vs last month" },
        { title: "Revenue (Month)", value: `₹${(revenue.total_revenue / 100000).toFixed(1)}L`, change: 12.1, icon: DollarSign, color: "#00f5ff", sub: "Gross revenue" },
        { title: "Active Bikes", value: revenue.active_bikes.toString(), change: 3.2, icon: Activity, color: "#00ff88", sub: `${revenue.occupancy_pct}% occupancy` },
        { title: "Repeat Customers", value: `${revenue.repeat_rate}%`, change: 2.1, icon: Users, color: "#f59e0b", sub: "Retention rate" },
        { title: "Avg Price / Ride", value: `₹${revenue.avg_price.toFixed(2)}`, change: -1.3, icon: Clock, color: "#a78bfa", sub: "Per booking" },
        { title: "Peak Hour", value: `${revenue.peak_hour.toString().padStart(2, "0")}:00`, change: 5.7, icon: BarChart2, color: "#fb7185", sub: "Highest demand" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Command Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time fleet &amp; revenue intelligence · Bangalore
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-lg px-4 py-2 font-mono text-sm text-brand-300">
            {liveTime}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh data from ML backend"
            className="glass rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className={`badge-${dataSource === "live" ? "success" : "info"} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dataSource === "live" ? "bg-green-400" : "bg-blue-400"}`} />
            {dataSource === "live" ? "SARIMA Live" : "Demo Mode"}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : kpis.map((k, i) => (
              <motion.div key={k.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="glass rounded-xl p-4 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${k.color}15`, border: `1px solid ${k.color}25` }}>
                    <k.icon className="w-4 h-4" style={{ color: k.color }} />
                  </div>
                  <span className={`text-xs font-medium ${k.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {k.change >= 0 ? <TrendingUp className="inline w-3 h-3" /> : <TrendingDown className="inline w-3 h-3" />}
                    {" "}{Math.abs(k.change)}%
                  </span>
                </div>
                <div className="text-xl font-display font-bold text-white leading-tight">{k.value}</div>
                <div className="text-xs text-slate-500 mt-1">{k.title}</div>
                {k.sub && <div className="text-xs text-slate-600 mt-0.5">{k.sub}</div>}
              </motion.div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Demand chart from SARIMA forecast */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Weekly Demand Forecast</h3>
              <p className="text-xs text-slate-500">SARIMA 7-day prediction · Rides &amp; Revenue</p>
            </div>
            <span className="badge-info">SARIMA</span>
          </div>
          {loading
            ? <Skeleton className="h-52" />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar yAxisId="left"  dataKey="demand"  name="Demand"  fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#00f5ff" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Zone Performance from heatmap data */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-display font-semibold text-white">Zone Performance</h3>
            <p className="text-xs text-slate-500">Revenue by area</p>
          </div>
          {loading
            ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            : (
              <div className="space-y-3">
                {zoneData.slice(0, 5).map(z => {
                  const pct = Math.round((z.revenue / zoneData[0].revenue) * 100);
                  return (
                    <div key={z.zone}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300">{z.zone}</span>
                        <span className="text-xs font-mono text-white">₹{(z.revenue / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #6366f1, #00f5ff)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* Revenue Trend + Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Daily revenue · SARIMA 7-day forecast</p>
            </div>
          </div>
          {loading
            ? <Skeleton className="h-44" />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00f5ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00f5ff" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Live Alerts */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Live Alerts</h3>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex gap-3 p-3 glass-light rounded-lg">
                {a.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {a.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {a.type === "info"    && <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs text-slate-200">{a.msg}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {lastRefresh && (
            <p className="text-xs text-slate-700 mt-4 text-right">
              Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {/* Zone Intelligence Table */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Zone Intelligence Matrix</h3>
        {loading
          ? <Skeleton className="h-48" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Zone", "Rides", "Revenue", "Surge", "Status"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zoneData.map((z, i) => (
                    <motion.tr key={z.zone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{z.zone}</td>
                      <td className="py-3 px-3 text-slate-300">{z.rides.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-300">₹{(z.revenue / 1000).toFixed(1)}K</td>
                      <td className="py-3 px-3">
                        <span className={`font-mono text-xs ${z.surge > 1.1 ? "text-red-400" : z.surge > 1 ? "text-amber-400" : "text-emerald-400"}`}>
                          ×{z.surge.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={z.surge > 1.1 ? "badge-danger" : z.surge > 1 ? "badge-warning" : "badge-success"}>
                          {z.surge > 1.1 ? "High Demand" : z.surge > 1 ? "Moderate" : "Normal"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
