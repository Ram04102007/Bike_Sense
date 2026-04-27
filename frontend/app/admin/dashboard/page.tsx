"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Bike, Users, DollarSign, BarChart2,
  Activity, AlertTriangle, CheckCircle, Clock, Zap
} from "lucide-react";

// ─── Mock data helpers ───────────────────────────────────────────────────
const weeklyData = [
  {day:"Mon",rides:1240,revenue:85320,demand:680},
  {day:"Tue",rides:980, revenue:67500,demand:540},
  {day:"Wed",rides:1100,revenue:75900,demand:610},
  {day:"Thu",rides:1340,revenue:92400,demand:740},
  {day:"Fri",rides:1580,revenue:108900,demand:870},
  {day:"Sat",rides:1820,revenue:125460,demand:1000},
  {day:"Sun",rides:1650,revenue:113725,demand:910},
];

const zoneData = [
  {zone:"Indiranagar", rides:3420, revenue:235980, surge:1.17},
  {zone:"Koramangala", rides:3120, revenue:215280, surge:1.08},
  {zone:"Whitefield",  rides:2780, revenue:191790, surge:1.00},
  {zone:"Marathahalli",rides:2340, revenue:161460, surge:1.00},
  {zone:"HSR Layout",  rides:2890, revenue:199410, surge:1.08},
  {zone:"Jayanagar",   rides:1980, revenue:136620, surge:1.00},
  {zone:"Electronic City",rides:2210,revenue:152490,surge:1.00},
  {zone:"Hebbal",      rides:1670, revenue:115230, surge:1.00},
];

const recentAlerts = [
  {type:"warning", msg:"Whitefield demand spike expected 5–7 PM", time:"2 min ago"},
  {type:"success", msg:"Fleet rebalanced in Koramangala (12 bikes)", time:"18 min ago"},
  {type:"info",    msg:"Monthly report ready for export", time:"1 hr ago"},
  {type:"warning", msg:"Low battery: 6 Ather 450X in Electronic City", time:"2 hr ago"},
];

function KpiCard({ title, value, change, icon: Icon, color, sub }: any) {
  const positive = change >= 0;
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      className="glass rounded-xl p-5 hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{background:`${color}15`, border:`1px solid ${color}25`}}>
          <Icon className="w-5 h-5" style={{color}} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${positive?"text-emerald-400":"text-red-400"}`}>
          {positive ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="text-2xl font-display font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-sm border border-white/5">
      <p className="text-slate-400 mb-1 text-xs">{label}</p>
      {payload.map((p:any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">{typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [liveTime, setLiveTime] = useState("");
  useEffect(() => {
    const update = () => setLiveTime(new Date().toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const kpis = [
    {title:"Total Rides (Month)",  value:"21,090",    change:8.4,  icon:Bike,       color:"#6366f1", sub:"↑ vs last month"},
    {title:"Revenue (Month)",      value:"₹14.5L",    change:12.1, icon:DollarSign, color:"#00f5ff", sub:"Gross revenue"},
    {title:"Active Bikes",         value:"847",       change:3.2,  icon:Activity,   color:"#00ff88", sub:"73% occupancy"},
    {title:"Repeat Customers",     value:"68.4%",     change:2.1,  icon:Users,      color:"#f59e0b", sub:"Retention rate"},
    {title:"Avg Rental Duration",  value:"47 min",    change:-1.3, icon:Clock,      color:"#a78bfa", sub:"Per booking"},
    {title:"Conversion Rate",      value:"34.2%",     change:5.7,  icon:BarChart2,  color:"#fb7185", sub:"Leads → rides"},
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Command Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time fleet & revenue intelligence · Bangalore
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-lg px-4 py-2 font-mono text-sm text-brand-300">
            {liveTime}
          </div>
          <span className="badge-success flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            SARIMA Live
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k,i) => (
          <motion.div key={k.title} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            transition={{delay:i*0.07}} className="glass rounded-xl p-4 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{background:`${k.color}15`, border:`1px solid ${k.color}25`}}>
                <k.icon className="w-4 h-4" style={{color:k.color}} />
              </div>
              <span className={`text-xs font-medium ${k.change>=0?"text-emerald-400":"text-red-400"}`}>
                {k.change>=0?"+":""}{k.change}%
              </span>
            </div>
            <div className="text-xl font-display font-bold text-white leading-tight">{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Revenue + Demand */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Weekly Performance</h3>
              <p className="text-xs text-slate-500">Rides & Revenue this week</p>
            </div>
            <span className="badge-info">7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{fontSize:11}} />
              <YAxis yAxisId="left" tick={{fontSize:11}} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{fontSize:"11px"}} />
              <Bar yAxisId="left"  dataKey="rides"   name="Rides"     fill="#6366f1" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="demand"  name="Demand"    fill="#00f5ff" radius={[4,4,0,0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Performance */}
        <div className="glass rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-display font-semibold text-white">Zone Performance</h3>
            <p className="text-xs text-slate-500">Revenue by area</p>
          </div>
          <div className="space-y-3">
            {zoneData.slice(0,5).map(z => {
              const pct = Math.round((z.revenue / zoneData[0].revenue) * 100);
              return (
                <div key={z.zone}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300">{z.zone}</span>
                    <span className="text-xs font-mono text-white">₹{(z.revenue/1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:0.3,duration:0.8}}
                      className="h-full rounded-full"
                      style={{background:`linear-gradient(90deg, #6366f1, #00f5ff)`}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Trend + Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-white">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Daily revenue this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00f5ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00f5ff" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Alerts */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Live Alerts</h3>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-3">
            {recentAlerts.map((a, i) => (
              <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}
                className="flex gap-3 p-3 glass-light rounded-lg">
                {a.type==="warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {a.type==="success" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {a.type==="info" && <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs text-slate-200">{a.msg}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Table */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Zone Intelligence Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Zone","Rides","Revenue","Surge","Status"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zoneData.map((z, i) => (
                <motion.tr key={z.zone} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.05}}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">{z.zone}</td>
                  <td className="py-3 px-3 text-slate-300">{z.rides.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-300">₹{(z.revenue/1000).toFixed(1)}K</td>
                  <td className="py-3 px-3">
                    <span className={`font-mono text-xs ${z.surge>1.1?"text-red-400":z.surge>1?"text-amber-400":"text-emerald-400"}`}>
                      ×{z.surge.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`${z.surge>1.1?"badge-danger":z.surge>1?"badge-warning":"badge-success"}`}>
                      {z.surge>1.1?"High Demand":z.surge>1?"Moderate":"Normal"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
