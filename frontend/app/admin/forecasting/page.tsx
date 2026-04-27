"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Brain, TrendingUp, Calendar, Clock, Download } from "lucide-react";

// Generate realistic hourly forecast data
const generateHourlyForecast = () => Array.from({length:168}, (_,i) => {
  const day = Math.floor(i/24);
  const hr  = i%24;
  const isWeekend = day>=5;
  const rush = Math.exp(-0.5*((hr-8)/2.5)**2)*0.8 + Math.exp(-0.5*((hr-18)/2.5)**2)*0.6;
  const base = 580 + rush*320 + (isWeekend?60:0) + Math.sin(i*0.3)*25;
  return {
    idx: i,
    label: `D${day+1} ${hr.toString().padStart(2,"0")}:00`,
    demand: Math.round(Math.max(180, base + (Math.random()-0.5)*40)),
    upper:  Math.round(Math.max(200, base*1.15 + 30)),
    lower:  Math.round(Math.max(150, base*0.85 - 20)),
    price:  hr<6||hr>22?65:hr>=7&&hr<=9||hr>=17&&hr<=20?81.25:hr>=10&&hr<=15?65:70.2,
  };
});

const generateDailyForecast = () => {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return Array.from({length:30}, (_,i) => ({
    day: `${days[i%7]} W${Math.floor(i/7)+1}`,
    demand: Math.round(12000 + Math.sin(i*0.9)*2000 + (i%7>=5?2500:0) + (Math.random()-0.5)*800),
    upper:  Math.round(14000 + Math.sin(i*0.9)*2000),
    lower:  Math.round(10000 + Math.sin(i*0.9)*2000),
  }));
};

const heatmapData = (() => {
  const areas = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Elec. City","Hebbal"];
  const weights = [1.3,1.2,1.1,1.0,1.15,0.9,0.95,0.85];
  return areas.map((area,ai) => ({
    area,
    hours: Array.from({length:24}, (_,hr)=>{
      const rush = Math.exp(-0.5*((hr-8)/2.5)**2)*0.8 + Math.exp(-0.5*((hr-18)/2.5)**2)*0.6;
      return Math.round((100 + rush*100)*weights[ai]);
    })
  }));
})();

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p:any) => (
        <p key={p.dataKey} style={{color:p.color}} className="flex justify-between gap-3">
          <span>{p.name || p.dataKey}</span>
          <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState<"short"|"medium">("short");
  const hourlyData  = generateHourlyForecast();
  const dailyData   = generateDailyForecast();

  const demandColor = (v:number) => {
    if (v > 180) return "bg-red-500";
    if (v > 140) return "bg-orange-400";
    if (v > 100) return "bg-amber-400";
    if (v > 60)  return "bg-emerald-500";
    return "bg-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-400" /> Forecasting Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">SARIMA/SARIMAX demand predictions — short, medium & long term</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export Forecast
        </button>
      </div>

      {/* Model Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {label:"Short-Term",order:"SARIMA(0,1,1)(0,1,1,24)",horizon:"7-day hourly",aic:"14,820",color:"#6366f1"},
          {label:"Medium-Term",order:"SARIMA(1,1,2)(1,1,1,7)",horizon:"30-day daily",aic:"3,421",color:"#00f5ff"},
          {label:"Long-Term",order:"SARIMA(0,1,0)(0,1,1,12)",horizon:"12-month",aic:"842",color:"#00ff88"},
        ].map(m => (
          <div key={m.label} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{m.label}</span>
              <span className="badge-info">Active</span>
            </div>
            <div className="font-mono text-sm font-medium mb-1" style={{color:m.color}}>{m.order}</div>
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Horizon: {m.horizon}</span>
              <span>AIC: {m.aic}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Horizon Selector */}
      <div className="flex gap-3">
        {(["short","medium"] as const).map(h => (
          <button key={h} onClick={()=>setHorizon(h)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${horizon===h?"bg-brand-500 text-white":"glass text-slate-400 hover:text-white"}`}>
            {h==="short"?"📈 7-Day Hourly":"📅 30-Day Daily"}
          </button>
        ))}
      </div>

      {/* Main Forecast Chart */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold text-white">
              {horizon==="short"?"1-Week Hourly Demand Forecast":"1-Month Daily Demand Forecast"}
            </h3>
            <p className="text-xs text-slate-500">
              {horizon==="short"
                ? "SARIMA(0,1,1)(0,1,1,24) · 80% confidence band"
                : "SARIMA(1,1,2)(1,1,1,7) · 80% confidence band"}
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-brand-400 inline-block" /> Forecast</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-500/20 inline-block rounded" /> 80% CI</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={horizon==="short" ? hourlyData.filter((_,i)=>i%2===0) : dailyData}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={horizon==="short"?"label":"day"} tick={{fontSize:9}} interval={horizon==="short"?11:4} />
            <YAxis tick={{fontSize:10}} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="upper" name="Upper CI" stroke="none" fill="url(#ciGrad)" />
            <Area type="monotone" dataKey="lower" name="Lower CI" stroke="none" fill="white" fillOpacity={0} />
            <Area type="monotone" dataKey="demand" name="Demand" stroke="#6366f1" fill="url(#fcGrad)" strokeWidth={2} />
            {horizon==="short" && (
              <ReferenceLine x={hourlyData.filter((_,i)=>i%2===0)[24]?.label} stroke="#475569" strokeDasharray="4 4" label={{value:"Now",fill:"#94a3b8",fontSize:10}} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap + Price Forecast */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="glass rounded-xl p-6 overflow-hidden">
          <h3 className="font-display font-semibold text-white mb-4">Demand Heatmap · Hour × Zone</h3>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Hour labels */}
              <div className="flex items-center ml-24 mb-1 gap-0.5">
                {[0,3,6,9,12,15,18,21].map(h => (
                  <div key={h} className="w-7 text-center text-xs text-slate-600">{h}h</div>
                ))}
              </div>
              {heatmapData.map(row => (
                <div key={row.area} className="flex items-center gap-0.5 mb-0.5">
                  <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{row.area}</span>
                  {row.hours.filter((_,i)=>i%3===0).map((val,i) => (
                    <div key={i} className={`w-7 h-7 rounded-sm ${demandColor(val)} opacity-${Math.min(90,Math.round(val/2))} flex items-center justify-center`}
                      title={`${row.area} @ ${i*3}:00 → ${val} bikes`}>
                      <span className="text-xs text-white/70 hidden">{val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span>Low</span>
              {["bg-slate-600","bg-emerald-500","bg-amber-400","bg-orange-400","bg-red-500"].map((c,i)=>(
                <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
              ))}
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Price forecast */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">7-Day Price Trajectory</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData.filter((_,i)=>i%6===0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{fontSize:9}} interval={3} />
              <YAxis domain={[60,85]} tick={{fontSize:10}} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={65}    stroke="#10b981" strokeDasharray="3 3" label={{value:"₹65",fill:"#10b981",fontSize:9}} />
              <ReferenceLine y={81.25} stroke="#ef4444" strokeDasharray="3 3" label={{value:"₹81.25",fill:"#ef4444",fontSize:9}} />
              <Line type="stepAfter" dataKey="price" name="Price (₹)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-4 gap-2 text-center">
            {[{l:"Standard",v:"₹65",c:"text-emerald-400"},{l:"Moderate",v:"₹70.2",c:"text-amber-400"},{l:"High",v:"₹76",c:"text-orange-400"},{l:"Peak",v:"₹81.25",c:"text-red-400"}].map(t=>(
              <div key={t.l}>
                <div className={`text-sm font-mono font-bold ${t.c}`}>{t.v}</div>
                <div className="text-xs text-slate-600">{t.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seasonal Insights */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Seasonal & Event Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {emoji:"🌧️", title:"Monsoon Impact", desc:"June–September: 30–40% demand drop during heavy rain. Pre-position indoor stations.", tag:"Seasonal"},
            {emoji:"🎉", title:"Diwali Spike",   desc:"Expected 2.3× demand surge Oct 20–24. Activate peak pricing + extra fleet.", tag:"Festival"},
            {emoji:"📈", title:"Weekend Pattern",desc:"Saturday rides are 47% higher than Tuesday. Rebalance by Friday 10 PM.", tag:"Weekly"},
          ].map(i => (
            <div key={i.title} className="glass-light rounded-xl p-4">
              <div className="text-2xl mb-2">{i.emoji}</div>
              <div className="text-sm font-semibold text-white mb-1">{i.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">{i.desc}</p>
              <span className="badge-info">{i.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
