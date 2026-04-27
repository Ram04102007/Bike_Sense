"use client";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, TrendingDown, Star, AlertTriangle } from "lucide-react";

const segments = [
  {name:"Daily Commuters",count:4120,pct:32,color:"#6366f1",avg_rides:22,ltv:8400},
  {name:"Weekend Riders", count:3210,pct:25,color:"#00f5ff",avg_rides:8, ltv:3200},
  {name:"Occasional",     count:3870,pct:30,color:"#f59e0b",avg_rides:3, ltv:1200},
  {name:"Power Users",    count:1647,pct:13,color:"#00ff88",avg_rides:31,ltv:12600},
];

const retentionData = [
  {month:"Nov",retained:71,churned:29},{month:"Dec",retained:74,churned:26},
  {month:"Jan",retained:69,churned:31},{month:"Feb",retained:72,churned:28},
  {month:"Mar",retained:75,churned:25},{month:"Apr",retained:68,churned:32},
];

const topUsers = [
  {name:"Priya N.",rides:89,spend:"₹7,230",tier:"Platinum",churn:"Low"},
  {name:"Arjun K.",rides:74,spend:"₹5,990",tier:"Gold",churn:"Low"},
  {name:"Meera I.",rides:67,spend:"₹5,430",tier:"Gold",churn:"Medium"},
  {name:"Ravi S.", rides:58,spend:"₹4,700",tier:"Silver",churn:"Low"},
  {name:"Kiran R.",rides:49,spend:"₹3,970",tier:"Silver",churn:"High"},
];

const churnRisk = [
  {name:"Deepak M.",lastRide:"18 days ago",risk:"High",  rides:3},
  {name:"Anjali P.",lastRide:"12 days ago",risk:"Medium",rides:7},
  {name:"Suresh K.",lastRide:"15 days ago",risk:"High",  rides:2},
  {name:"Lakshmi V.",lastRide:"10 days ago",risk:"Medium",rides:5},
];

function ChartTooltip({active,payload,label}:any){
  if(!active||!payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p:any)=>(<p key={p.name} style={{color:p.color}}>{p.name}: <span className="font-bold text-white">{p.value}{p.name.includes("Pct")?"%":""}</span></p>))}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> Customer Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Behavioural intelligence · Retention · Churn prediction</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Total Customers",  value:"12,847",  sub:"+891 this month", color:"#6366f1"},
          {label:"Retention Rate",   value:"68.4%",   sub:"↑ 2.1% vs last month",color:"#00ff88"},
          {label:"Churn Risk",       value:"673",     sub:"Need re-engagement",   color:"#f59e0b"},
          {label:"Avg LTV",          value:"₹4,820",  sub:"Per customer",         color:"#00f5ff"},
        ].map(k=>(
          <div key={k.label} className="glass rounded-xl p-5">
            <div className="text-2xl font-display font-bold mb-0.5" style={{color:k.color}}>{k.value}</div>
            <div className="text-sm text-white font-medium">{k.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Segments pie */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">Customer Segments</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={segments} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="count" paddingAngle={3}>
                {segments.map((s,i)=><Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v:any,n:any)=>[v.toLocaleString(),n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {segments.map(s=>(
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:s.color}} />
                  <span className="text-slate-300">{s.name}</span>
                </div>
                <span className="font-mono text-xs" style={{color:s.color}}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Segment detail */}
        <div className="lg:col-span-3 glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">Segment Deep-Dive</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={segments} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={110}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="avg_rides" name="Avg Rides" radius={[0,4,4,0]}>
                {segments.map((s,i)=><Cell key={i} fill={s.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retention trend */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">6-Month Retention Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="month" tick={{fontSize:11}}/>
            <YAxis tick={{fontSize:10}}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:"11px"}}/>
            <Bar dataKey="retained" name="Retained %" fill="#00ff88" radius={[4,4,0,0]}/>
            <Bar dataKey="churned"  name="Churned %"  fill="#ef4444" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400"/>
            <h3 className="font-display font-semibold text-white">Top Customers</h3>
          </div>
          <div className="space-y-3">
            {topUsers.map((u,i)=>(
              <motion.div key={u.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                className="flex items-center gap-3 p-3 glass-light rounded-xl">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300">
                  {u.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.rides} rides</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-white">{u.spend}</div>
                  <span className={`text-xs ${u.churn==="Low"?"text-emerald-400":u.churn==="Medium"?"text-amber-400":"text-red-400"}`}>
                    {u.tier} · {u.churn} churn
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Churn risk */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400"/>
            <h3 className="font-display font-semibold text-white">Churn Risk Alerts</h3>
          </div>
          <div className="space-y-3">
            {churnRisk.map((u,i)=>(
              <motion.div key={u.name} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                className={`flex items-center gap-3 p-3 rounded-xl border ${u.risk==="High"?"bg-red-500/5 border-red-500/20":"bg-amber-500/5 border-amber-500/20"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${u.risk==="High"?"bg-red-500/20 text-red-400":"bg-amber-500/20 text-amber-400"}`}>
                  {u.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-slate-500">Last ride: {u.lastRide} · {u.rides} total</div>
                </div>
                <div>
                  <span className={u.risk==="High"?"badge-danger":"badge-warning"}>{u.risk} Risk</span>
                  <button className="block mt-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Send offer →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            💡 Send a 20% discount coupon to re-engage high-risk customers
          </p>
        </div>
      </div>
    </div>
  );
}
