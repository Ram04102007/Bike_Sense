"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bike, Battery, AlertTriangle, CheckCircle, Wrench, RefreshCw, MapPin } from "lucide-react";

const fleetData = [
  {area:"Indiranagar",   total:140, available:89, in_use:42, maintenance:9,  low_battery:4,  demand:1.30, rebalance:"Send 8 bikes"},
  {area:"Koramangala",   total:128, available:72, in_use:48, maintenance:8,  low_battery:6,  demand:1.20, rebalance:"Send 5 bikes"},
  {area:"Whitefield",    total:115, available:83, in_use:28, maintenance:4,  low_battery:3,  demand:1.10, rebalance:"Receive 4 bikes"},
  {area:"Marathahalli",  total:100, available:71, in_use:24, maintenance:5,  low_battery:2,  demand:1.00, rebalance:"Balanced"},
  {area:"HSR Layout",    total:120, available:78, in_use:36, maintenance:6,  low_battery:5,  demand:1.15, rebalance:"Send 6 bikes"},
  {area:"Jayanagar",     total: 90, available:62, in_use:22, maintenance:6,  low_battery:3,  demand:0.90, rebalance:"Receive 10 bikes"},
  {area:"Electronic City",total:95, available:68, in_use:22, maintenance:5,  low_battery:2,  demand:0.95, rebalance:"Receive 6 bikes"},
  {area:"Hebbal",        total: 85, available:58, in_use:21, maintenance:6,  low_battery:2,  demand:0.85, rebalance:"Receive 8 bikes"},
];

const bikeModels = [
  {model:"Ather 450X",    count:247, available:162, type:"EV",     avg_battery:78, issues:8,  revenue:"₹4.2L"},
  {model:"Bounce Infinity",count:198,available:121, type:"EV",     avg_battery:71, issues:12, revenue:"₹3.1L"},
  {model:"Yulu Move",     count:156, available:112, type:"EV",     avg_battery:84, issues:4,  revenue:"₹1.8L"},
  {model:"Honda Activa",  count:183, available:124, type:"Scooter",avg_battery:null,issues:9, revenue:"₹2.9L"},
  {model:"Royal Enfield", count: 87, available:52,  type:"Premium",avg_battery:null,issues:6, revenue:"₹3.5L"},
  {model:"Rapido Bike",   count:132, available:92,  type:"Budget", avg_battery:null,issues:7, revenue:"₹1.2L"},
];

export default function FleetPage() {
  const [view, setView] = useState<"zones"|"models">("zones");

  const totals = fleetData.reduce((a,z)=>({
    total:a.total+z.total, available:a.available+z.available,
    in_use:a.in_use+z.in_use, maintenance:a.maintenance+z.maintenance, low_battery:a.low_battery+z.low_battery,
  }), {total:0,available:0,in_use:0,maintenance:0,low_battery:0});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-emerald-400" /> Fleet Management
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time bike availability, health & rebalancing intelligence</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Sync Fleet
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {label:"Total Fleet",   value:totals.total,       icon:Bike,         color:"#6366f1"},
          {label:"Available",     value:totals.available,   icon:CheckCircle,  color:"#10b981"},
          {label:"In Use",        value:totals.in_use,      icon:MapPin,       color:"#00f5ff"},
          {label:"Maintenance",   value:totals.maintenance, icon:Wrench,       color:"#f59e0b"},
          {label:"Low Battery",   value:totals.low_battery, icon:Battery,      color:"#ef4444"},
        ].map(k=>(
          <div key={k.label} className="glass rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{background:`${k.color}15`, border:`1px solid ${k.color}25`}}>
              <k.icon className="w-4 h-4" style={{color:k.color}} />
            </div>
            <div className="text-2xl font-display font-bold text-white">{k.value}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-3">
        {(["zones","models"] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${view===v?"bg-brand-500 text-white":"glass text-slate-400 hover:text-white"}`}>
            {v==="zones"?"🗺️ By Zone":"🏍️ By Model"}
          </button>
        ))}
      </div>

      {view==="zones" && (
        <div className="space-y-4">
          {fleetData.map((z,i)=>{
            const utilPct = Math.round((z.in_use/z.total)*100);
            const availPct = Math.round((z.available/z.total)*100);
            const needsRebalance = z.rebalance!=="Balanced";
            return (
              <motion.div key={z.area} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass-light flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{z.area}</div>
                      <div className="text-xs text-slate-500">
                        Demand index: <span className={`font-semibold ${z.demand>1.1?"text-red-400":z.demand>1?"text-amber-400":"text-emerald-400"}`}>{z.demand.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {needsRebalance && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    <span className={`text-xs px-2 py-1 rounded-full ${needsRebalance?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                      {z.rebalance}
                    </span>
                  </div>
                </div>
                {/* Bars */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    {label:"Available",val:z.available,pct:availPct,color:"#10b981"},
                    {label:"In Use",val:z.in_use,pct:utilPct,color:"#6366f1"},
                    {label:"Maintenance",val:z.maintenance,pct:Math.round(z.maintenance/z.total*100),color:"#f59e0b"},
                    {label:"Low Battery",val:z.low_battery,pct:Math.round(z.low_battery/z.total*100),color:"#ef4444"},
                  ].map(m=>(
                    <div key={m.label}>
                      <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                      <div className="text-lg font-display font-bold" style={{color:m.color}}>{m.val}</div>
                      <div className="h-1 bg-white/5 rounded-full mt-1">
                        <motion.div initial={{width:0}} animate={{width:`${m.pct}%`}} transition={{delay:0.3+i*0.05}}
                          className="h-full rounded-full" style={{background:m.color}} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {view==="models" && (
        <div className="glass rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Model","Type","Total","Available","Issues","Avg Battery","Revenue","Status"].map(h=>(
                    <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bikeModels.map((b,i)=>(
                  <motion.tr key={b.model} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.07}}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{b.model}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${b.type==="EV"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":b.type==="Premium"?"bg-purple-500/10 text-purple-400 border-purple-500/20":"bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{b.count}</td>
                    <td className="py-3 px-3 text-emerald-400 font-medium">{b.available}</td>
                    <td className="py-3 px-3">
                      <span className={b.issues>10?"text-red-400":b.issues>6?"text-amber-400":"text-slate-300"}>
                        {b.issues}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {b.avg_battery ? (
                        <div className="flex items-center gap-1.5">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span className={`font-mono text-xs ${b.avg_battery>70?"text-emerald-400":b.avg_battery>50?"text-amber-400":"text-red-400"}`}>
                            {b.avg_battery}%
                          </span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">N/A</span>}
                    </td>
                    <td className="py-3 px-3 font-medium text-white">{b.revenue}</td>
                    <td className="py-3 px-3">
                      <span className={b.issues>10?"badge-danger":b.issues>6?"badge-warning":"badge-success"}>
                        {b.issues>10?"Needs Attention":b.issues>6?"Monitor":"Healthy"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
