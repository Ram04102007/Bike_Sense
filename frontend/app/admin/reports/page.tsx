"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileBarChart2, Download, TrendingUp, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

const monthlyData = [
  {month:"May 24", rides:14200, revenue:9.78,  growth:null},
  {month:"Jun 24", rides:12800, revenue:8.83,  growth:-9.7},
  {month:"Jul 24", rides:11400, revenue:7.86,  growth:-10.9},
  {month:"Aug 24", rides:10900, revenue:7.52,  growth:-4.3},
  {month:"Sep 24", rides:13200, revenue:9.10,  growth:21.0},
  {month:"Oct 24", rides:15600, revenue:10.76, growth:18.2},
  {month:"Nov 24", rides:17100, revenue:11.80, growth:9.6},
  {month:"Dec 24", rides:19400, revenue:13.38, growth:13.5},
  {month:"Jan 25", rides:16800, revenue:11.59, growth:-13.4},
  {month:"Feb 25", rides:17600, revenue:12.14, growth:4.8},
  {month:"Mar 25", rides:20100, revenue:13.87, growth:14.2},
  {month:"Apr 25", rides:21090, revenue:14.55, growth:4.9},
];

function ChartTooltip({active,payload,label}:any){
  if(!active||!payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p:any)=>(
        <p key={p.name} style={{color:p.color}}>
          {p.name}: <span className="font-bold text-white">{p.name==="Revenue (₹L)"?`₹${p.value}L`:p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string|null>(null);

  const handleExport = async (type: string) => {
    setGenerating(type);
    await new Promise(r=>setTimeout(r,1500));
    toast.success(`${type} report exported successfully!`);
    setGenerating(null);
  };

  const total12mRevenue = monthlyData.slice(-12).reduce((a,r)=>a+r.revenue,0).toFixed(1);
  const total12mRides   = monthlyData.slice(-12).reduce((a,r)=>a+r.rides,0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-purple-400" /> Reports & Exports
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Monthly performance · Investor reports · Data exports</p>
        </div>
      </div>

      {/* Summary boxes */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">12-Month Revenue</div>
          <div className="text-3xl font-display font-bold text-white">₹{total12mRevenue}L</div>
          <div className="text-xs text-emerald-400 mt-1">↑ 4.9% vs prior month</div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">12-Month Rides</div>
          <div className="text-3xl font-display font-bold text-white">{total12mRides}</div>
          <div className="text-xs text-slate-500 mt-1">Total trips completed</div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="text-xs text-slate-500 mb-1">Avg Revenue/Ride</div>
          <div className="text-3xl font-display font-bold text-white">₹69.2</div>
          <div className="text-xs text-slate-500 mt-1">Including surge</div>
        </div>
      </div>

      {/* Charts */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">12-Month Performance</h3>
        <div className="grid lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="month" tick={{fontSize:9}} interval={1}/>
              <YAxis tick={{fontSize:9}}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Bar dataKey="rides" name="Rides" fill="#6366f1" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="month" tick={{fontSize:9}} interval={1}/>
              <YAxis tick={{fontSize:9}}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Line type="monotone" dataKey="revenue" name="Revenue (₹L)" stroke="#00f5ff" strokeWidth={2.5} dot={{fill:"#00f5ff",r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly table */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Monthly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Month","Total Rides","Revenue (₹L)","Growth","Avg Price","Status"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthlyData].reverse().map((r,i)=>(
                <motion.tr key={r.month} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">{r.month}</td>
                  <td className="py-3 px-3 text-slate-300">{r.rides.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono text-white">₹{r.revenue}L</td>
                  <td className="py-3 px-3">
                    {r.growth!==null ? (
                      <span className={`font-medium ${r.growth>0?"text-emerald-400":"text-red-400"}`}>
                        {r.growth>0?"+":""}{r.growth}%
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">₹{((r.revenue*100000)/r.rides).toFixed(0)}</td>
                  <td className="py-3 px-3">
                    <span className={r.growth&&r.growth>10?"badge-success":r.growth&&r.growth<0?"badge-danger":"badge-warning"}>
                      {r.growth&&r.growth>10?"Strong":r.growth&&r.growth<0?"Decline":"Steady"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export section */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Export Reports</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {type:"Monthly PDF",desc:"Full monthly analytics report with charts and KPIs",icon:"📊",format:"PDF"},
            {type:"Investor Report",desc:"Executive summary with forecasts and growth metrics",icon:"💼",format:"PDF"},
            {type:"Raw Data CSV",desc:"Complete dataset export for custom analysis",icon:"📋",format:"CSV"},
          ].map(r=>(
            <div key={r.type} className="glass-light rounded-xl p-4">
              <div className="text-2xl mb-2">{r.icon}</div>
              <div className="font-semibold text-white mb-1">{r.type}</div>
              <p className="text-xs text-slate-500 mb-3">{r.desc}</p>
              <button onClick={()=>handleExport(r.type)} disabled={generating===r.type}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm py-2">
                {generating===r.type ? (
                  <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Generating...</>
                ) : (
                  <><Download className="w-3.5 h-3.5"/>Export {r.format}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
