"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FileBarChart2, Download, TrendingUp, TrendingDown,
  RefreshCw, BarChart2, DollarSign, Bike, Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { getMonthlyReport } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthRow {
  month: string;
  rides: number;
  revenue: number;
  growth: number | null;
  avgPrice: number;
  isForecast?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function transformRaw(raw: any[]): MonthRow[] {
  return raw.map((cur, i) => {
    const prev = raw[i - 1];
    const growth = prev && prev.revenue > 0
      ? parseFloat((((cur.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1))
      : null;
    const [year, month] = cur.period.split("-");
    const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      month: "short", year: "2-digit",
    });
    return {
      month: label,
      rides: cur.rides,
      revenue: cur.revenue,
      growth,
      avgPrice: cur.rides > 0 ? parseFloat(((cur.revenue * 1000) / cur.rides).toFixed(1)) : 0,
      isForecast: !!cur.is_forecast
    };
  });
}

function exportCSV(rows: MonthRow[]) {
  const header = "Month,Type,Total Rides,Revenue (₹L),Growth (%),Avg Price (₹)\n";
  const body = rows
    .map(r => `${r.month},${r.isForecast ? 'Forecast' : 'Actual'},${r.rides},${r.revenue},${r.growth ?? "—"},${r.avgPrice}`)
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bikesense_ml_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isForecast = payload[0]?.payload?.isForecast;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1 font-semibold flex items-center gap-2">
        {label}
        {isForecast && <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px] uppercase">ML Forecast</span>}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">
            {p.name.includes("₹") || p.name === "Revenue"
              ? `₹${p.value}L`
              : p.name === "Avg Price"
              ? `₹${p.value}`
              : p.name === "Growth"
              ? `${p.value}%`
              : p.value?.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Report Type Tabs ─────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { id: "overview",  label: "Overview",       icon: BarChart2 },
  { id: "revenue",   label: "Revenue Trend",  icon: DollarSign },
  { id: "rides",     label: "Rides Volume",   icon: Bike },
  { id: "growth",    label: "Growth Rate",    icon: TrendingUp },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeReport, setActiveReport] = useState("overview");
  const [generating, setGenerating]   = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const raw = await getMonthlyReport();
      if (raw && raw.length > 0) {
        // ML Data successfully loaded! (Historical + Forecast)
        setMonthlyData(transformRaw(raw));
      } else {
        // Empty array
        setMonthlyData([]);
      }
    } catch {
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Derived KPIs — split actual vs forecast ──
  const historical     = monthlyData.filter(r => !r.isForecast);
  const forecast       = monthlyData.filter(r => r.isForecast);
  const historicalRevenue = historical.reduce((a, r) => a + r.revenue, 0);
  const forecastRevenue   = forecast.reduce((a, r) => a + r.revenue, 0);
  const totalRevenue      = (historicalRevenue + forecastRevenue).toFixed(1);
  const totalRides        = monthlyData.reduce((a, r) => a + r.rides, 0);
  const totalHistRides    = historical.reduce((a, r) => a + r.rides, 0);
  const totalFcRides      = forecast.reduce((a, r) => a + r.rides, 0);
  const lastGrowth        = monthlyData.at(-1)?.growth ?? null;
  const avgRevenuePerRide =
    totalRides > 0
      ? ((parseFloat(totalRevenue) * 100000) / totalRides).toFixed(0)
      : "0";
  const bestMonth = monthlyData.reduce(
    (best, r) => (r.revenue > (best?.revenue ?? 0) ? r : best),
    monthlyData[0]
  );
  // Revenue progress %  actual / (actual + forecast)
  const revenueProgress =
    parseFloat(totalRevenue) > 0
      ? Math.round((historicalRevenue / parseFloat(totalRevenue)) * 100)
      : 0;

  // ── Export handlers ──
  const handleExport = async (type: string) => {
    if (monthlyData.length === 0) {
      toast.error("No data available to export.");
      return;
    }
    setGenerating(type);
    if (type === "Raw Data CSV") {
      exportCSV(monthlyData);
      toast.success("CSV exported successfully!");
    } else {
      // Simulate PDF generation for other report types
      await new Promise(r => setTimeout(r, 1500));
      toast.success(`${type} exported! (demo mode)`);
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-purple-400" />
            ML Performance Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Historical data + real-time SARIMA model forecasts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-success flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
            ML Engine Live
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh from backend"
            className="glass rounded-lg px-3 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading spinner */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Querying ML Engine &amp; Historical Data…</p>
        </div>
      ) : monthlyData.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
          <FileBarChart2 className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-sm">Ensure the ML backend is running. No fallback static data is used.</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="space-y-4">
            {/* ── Revenue Split Widget (replaces single total) ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00f5ff18", border: "1px solid #00f5ff28" }}>
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Revenue Breakdown</div>
                    <div className="text-white font-semibold text-sm">Actual + ML Forecast</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-white">₹{totalRevenue}L</div>
                  <div className={`text-xs mt-0.5 ${lastGrowth !== null && lastGrowth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {lastGrowth !== null ? `${lastGrowth >= 0 ? "↑" : "↓"} ${Math.abs(lastGrowth)}% MoM` : "—"}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Actual Revenue
                  </span>
                  <span className="text-purple-400 flex items-center gap-1">
                    ML Forecast (12m)
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${revenueProgress}%`,
                      background: "linear-gradient(90deg, #10b981, #00f5ff)",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
              </div>

              {/* Split figures */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="glass-light rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Revenue Till Now</div>
                  <div className="text-xl font-display font-bold text-emerald-400">₹{historicalRevenue.toFixed(1)}L</div>
                  <div className="text-xs text-slate-500 mt-0.5">{totalHistRides.toLocaleString()} actual rides</div>
                </div>
                <div className="glass-light rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">SARIMA 12m Forecast</div>
                  <div className="text-xl font-display font-bold text-purple-400">₹{forecastRevenue.toFixed(1)}L</div>
                  <div className="text-xs text-slate-500 mt-0.5">{totalFcRides.toLocaleString()} predicted rides</div>
                </div>
              </div>
            </motion.div>

            {/* ── Remaining 3 KPI cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Total Rides",
                  value: totalRides.toLocaleString(),
                  sub: "Actual + Predicted trips",
                  subColor: "text-slate-500",
                  icon: Bike, color: "#6366f1",
                },
                {
                  label: "Avg Revenue / Ride",
                  value: `₹${avgRevenuePerRide}`,
                  sub: "Including surge pricing",
                  subColor: "text-slate-500",
                  icon: Activity, color: "#00ff88",
                },
                {
                  label: "Best Month",
                  value: bestMonth?.month ?? "—",
                  sub: bestMonth ? `₹${bestMonth.revenue}L revenue` : "",
                  subColor: "text-amber-400",
                  icon: TrendingUp, color: "#f59e0b",
                },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${k.color}18`, border: `1px solid ${k.color}28` }}
                    >
                      <k.icon className="w-4 h-4" style={{ color: k.color }} />
                    </div>
                    <span className="text-xs text-slate-500">{k.label}</span>
                  </div>
                  <div className="text-2xl font-display font-bold text-white">{k.value}</div>
                  <div className={`text-xs mt-1 ${k.subColor}`}>{k.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Report Type Selector */}
          <div className="glass rounded-xl p-1 flex gap-1 w-fit">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => setActiveReport(rt.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeReport === rt.id
                    ? "bg-white/10 text-white shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <rt.icon className="w-3.5 h-3.5" />
                {rt.label}
              </button>
            ))}
          </div>

          {/* Dynamic Chart Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReport}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-xl p-6"
            >
              {activeReport === "overview" && (
                <>
                  <h3 className="font-display font-semibold text-white mb-1">Performance Overview</h3>
                  <p className="text-xs text-slate-500 mb-5">Historical vs Forecasted metrics</p>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Monthly Rides</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={20} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip content={<ChartTooltip />} />
                          {/* We can use a custom bar color via Cell if needed, but for simplicity: */}
                          <Bar dataKey="rides" name="Rides" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Monthly Revenue</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={20} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Line type="monotone" dataKey="revenue" name="Revenue (₹L)" stroke="#00f5ff" strokeWidth={2.5} dot={{ fill: "#00f5ff", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {activeReport === "revenue" && (
                <>
                  <h3 className="font-display font-semibold text-white mb-1">Revenue Trend</h3>
                  <p className="text-xs text-slate-500 mb-5">Monthly revenue trajectory including SARIMA predictions</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (₹L)" stroke="#00f5ff" fill="url(#revGrad2)" strokeWidth={2.5} dot={{ fill: "#00f5ff", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeReport === "rides" && (
                <>
                  <h3 className="font-display font-semibold text-white mb-1">Rides Volume</h3>
                  <p className="text-xs text-slate-500 mb-5">Total trips completed and forecasted</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="ridesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="rides" name="Rides" stroke="#6366f1" fill="url(#ridesGrad)" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}

              {activeReport === "growth" && (
                <>
                  <h3 className="font-display font-semibold text-white mb-1">Month-over-Month Growth</h3>
                  <p className="text-xs text-slate-500 mb-5">Revenue growth % vs prior month</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData.filter(r => r.growth !== null)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="growth" name="Growth" radius={[4, 4, 0, 0]} fill="#00ff88" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Monthly Breakdown Table */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold text-white mb-4">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Month", "Total Rides", "Revenue (₹L)", "Growth", "Avg Price", "Status"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyData].reverse().map((r, i) => (
                    <motion.tr
                      key={r.month}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        {r.month}
                        {r.isForecast && (
                          <span className="text-[10px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            Forecast
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{r.rides.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-white">₹{r.revenue}L</td>
                      <td className="py-3 px-3">
                        {r.growth !== null ? (
                          <span className={`font-medium flex items-center gap-1 ${r.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {r.growth >= 0
                              ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />}
                            {r.growth >= 0 ? "+" : ""}{r.growth}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">₹{r.avgPrice}</td>
                      <td className="py-3 px-3">
                        {r.isForecast ? (
                          <span className="badge-info">Predicted</span>
                        ) : (
                          <span className={
                            r.growth && r.growth > 10
                              ? "badge-success"
                              : r.growth && r.growth < 0
                              ? "badge-danger"
                              : "badge-warning"
                          }>
                            {r.growth && r.growth > 10 ? "Strong" : r.growth && r.growth < 0 ? "Decline" : "Steady"}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Export Section */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Export Reports</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { type: "Monthly PDF",     desc: "Full monthly analytics with charts and KPIs", icon: "📊", format: "PDF" },
            { type: "Investor Report", desc: "Executive summary with ML forecasts and growth",  icon: "💼", format: "PDF" },
            { type: "Raw Data CSV",    desc: "Complete dataset including ML predictions", icon: "📋", format: "CSV" },
          ].map(r => (
            <div key={r.type} className="glass-light rounded-xl p-4">
              <div className="text-2xl mb-2">{r.icon}</div>
              <div className="font-semibold text-white mb-1">{r.type}</div>
              <p className="text-xs text-slate-500 mb-3">{r.desc}</p>
              <button
                onClick={() => handleExport(r.type)}
                disabled={generating === r.type || loading || monthlyData.length === 0}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50"
              >
                {generating === r.type ? (
                  <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                ) : (
                  <><Download className="w-3.5 h-3.5" />Export {r.format}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
