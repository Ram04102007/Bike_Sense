"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { DollarSign, Zap, TrendingUp, Settings, RefreshCw } from "lucide-react";

const AREAS = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];

const hourlyPricing = Array.from({length:24}, (_,h) => {
  const isRush = (h>=7&&h<=9)||(h>=17&&h<=20);
  const isMid  = h>=10&&h<=15;
  const surge  = isRush ? 1.25 : isMid ? 1.0 : h<6||h>22 ? 1.0 : 1.08;
  return { hour:`${h.toString().padStart(2,"0")}:00`, price: parseFloat((65*surge).toFixed(2)), surge, rides: Math.round((isRush?280:isMid?120:80)+(Math.random()-0.5)*20) };
});

const zonePricing = [
  {zone:"Indiranagar",  surge:1.17, price:76.05, demand:"High",    revenue:235980},
  {zone:"Koramangala",  surge:1.08, price:70.20, demand:"Moderate",revenue:215280},
  {zone:"Whitefield",   surge:1.00, price:65.00, demand:"Normal",  revenue:191790},
  {zone:"Marathahalli", surge:1.00, price:65.00, demand:"Normal",  revenue:161460},
  {zone:"HSR Layout",   surge:1.08, price:70.20, demand:"Moderate",revenue:199410},
  {zone:"Jayanagar",    surge:1.00, price:65.00, demand:"Normal",  revenue:136620},
  {zone:"Electronic City",surge:1.00,price:65.00,demand:"Normal",  revenue:152490},
  {zone:"Hebbal",       surge:1.00, price:65.00, demand:"Normal",  revenue:115230},
];

const festivalPricing = [
  {event:"Diwali (Oct 20–24)",   multiplier:2.30, expected_rides:"4,200/day", impact:"High"},
  {event:"New Year (Dec 31)",    multiplier:1.85, expected_rides:"3,800",     impact:"High"},
  {event:"Bangalore Marathon",   multiplier:1.60, expected_rides:"2,100",     impact:"Moderate"},
  {event:"IPL Match Days",       multiplier:1.45, expected_rides:"1,800",     impact:"Moderate"},
  {event:"Republic Day",         multiplier:1.30, expected_rides:"1,500",     impact:"Low"},
];

function ChartTooltip({active,payload,label}:any) {
  if (!active||!payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-white/5">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p:any)=>(
        <p key={p.name} style={{color:p.color}}>
          {p.name}: <span className="font-semibold text-white">
            {p.name==="Price"?`₹${p.value}`:p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const [basePrice, setBasePrice] = useState(65);
  const [selectedArea, setSelectedArea] = useState("Indiranagar");
  const [selectedHour, setSelectedHour] = useState(8);
  const [isWeekend, setIsWeekend] = useState(false);

  const computedSurge = selectedHour>=7&&selectedHour<=9||selectedHour>=17&&selectedHour<=20 ? 1.25
    : selectedHour>=10&&selectedHour<=15 ? 1.0 : 1.08;
  const weekendBoost = isWeekend ? 1.1 : 1.0;
  const areaBoost = {Indiranagar:1.15,Koramangala:1.10,Whitefield:1.05,Marathahalli:1.0,
    "HSR Layout":1.08,Jayanagar:0.95,"Electronic City":1.0,Hebbal:0.90}[selectedArea] || 1.0;
  const finalPrice = parseFloat((basePrice * computedSurge * weekendBoost * areaBoost).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" /> Dynamic Pricing Engine
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-driven surge pricing · 4-tier model · SARIMA-calibrated</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Recalibrate
        </button>
      </div>

      {/* Surge tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Standard",mult:"×1.00",price:"₹65.00",color:"#10b981",desc:"Low demand · Off-peak hours"},
          {label:"Moderate",mult:"×1.08",price:"₹70.20",color:"#f59e0b",desc:"Moderate demand · Evenings"},
          {label:"High",    mult:"×1.17",price:"₹76.05",color:"#f97316",desc:"High demand · Near rush"},
          {label:"Peak",    mult:"×1.25",price:"₹81.25",color:"#ef4444",desc:"Rush hours · Festivals"},
        ].map(t=>(
          <div key={t.label} className="glass rounded-xl p-4 border border-white/5">
            <div className="text-xs text-slate-500 mb-2">{t.label}</div>
            <div className="font-display font-bold text-2xl mb-0.5" style={{color:t.color}}>{t.price}</div>
            <div className="font-mono text-sm text-slate-400 mb-2">{t.mult} surge</div>
            <div className="text-xs text-slate-600">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Price Calculator + Hourly Chart */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Calculator */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-brand-400" />
            <h3 className="font-display font-semibold text-white">Price Calculator</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Zone</label>
              <select value={selectedArea} onChange={e=>setSelectedArea(e.target.value)} className="input-dark w-full">
                {AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500">Hour of Day</label>
                <span className="text-xs font-mono text-brand-300">{selectedHour.toString().padStart(2,"0")}:00</span>
              </div>
              <input type="range" min={0} max={23} value={selectedHour}
                onChange={e=>setSelectedHour(parseInt(e.target.value))}
                className="w-full accent-brand-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500">Base Price (₹)</label>
                <span className="text-xs font-mono text-brand-300">₹{basePrice}</span>
              </div>
              <input type="range" min={50} max={100} value={basePrice}
                onChange={e=>setBasePrice(parseInt(e.target.value))}
                className="w-full accent-brand-500" />
            </div>
            <div className="flex items-center justify-between p-3 glass-light rounded-lg">
              <span className="text-sm text-slate-300">Weekend pricing</span>
              <button onClick={()=>setIsWeekend(!isWeekend)}
                className={`w-10 h-5 rounded-full transition-all ${isWeekend?"bg-brand-500":"bg-slate-700"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isWeekend?"left-5":"left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="mt-5 p-5 rounded-xl" style={{background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(0,245,255,0.05))"}}>
            <div className="text-xs text-slate-500 mb-1">Recommended Price</div>
            <div className="text-4xl font-display font-bold text-white mb-1">₹{finalPrice}</div>
            <div className="text-xs text-slate-400">
              ×{computedSurge} surge · {isWeekend?"×1.1 weekend":"standard"} · {selectedArea}
            </div>
            <div className="mt-3 text-xs">
              <span className={`${computedSurge>=1.25?"badge-danger":computedSurge>=1.08?"badge-warning":"badge-success"}`}>
                {computedSurge>=1.25?"Peak Surge":computedSurge>=1.08?"Moderate":"Standard"}
              </span>
            </div>
          </div>
        </div>

        {/* Hourly price chart */}
        <div className="lg:col-span-3 glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4">24-Hour Price Schedule</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyPricing}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{fontSize:9}} interval={2} />
              <YAxis domain={[60,85]} tick={{fontSize:10}} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={65} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={81.25} stroke="#ef4444" strokeDasharray="3 3" />
              <Bar dataKey="price" name="Price" fill="#6366f1" radius={[3,3,0,0]}
                label={{position:"top",formatter:(v:number)=>`₹${v}`,fontSize:7,fill:"#94a3b8"}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Pricing Matrix */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-display font-semibold text-white mb-4">Live Zone Pricing Matrix</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {zonePricing.map(z=>(
            <div key={z.zone} className="glass-light rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{z.zone}</span>
                <span className={`font-mono text-xs ${z.surge>1.1?"text-red-400":z.surge>1?"text-amber-400":"text-emerald-400"}`}>
                  ×{z.surge.toFixed(2)}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-white mb-1">₹{z.price}</div>
              <div className="flex items-center justify-between">
                <span className={`${z.demand==="High"?"badge-danger":z.demand==="Moderate"?"badge-warning":"badge-success"}`}>
                  {z.demand}
                </span>
                <span className="text-xs text-slate-600">₹{(z.revenue/1000).toFixed(0)}K rev</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Festival / Event Pricing */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-semibold text-white">Festival & Event Pricing Calendar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Event","Surge Multiplier","Expected Rides","Impact","Action"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {festivalPricing.map((f,i)=>(
                <motion.tr key={f.event} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.07}}
                  className="border-b border-white/3 hover:bg-white/2">
                  <td className="py-3 px-3 font-medium text-white">{f.event}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-amber-400">×{f.multiplier.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{f.expected_rides}</td>
                  <td className="py-3 px-3">
                    <span className={`${f.impact==="High"?"badge-danger":f.impact==="Moderate"?"badge-warning":"badge-success"}`}>
                      {f.impact}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Configure →
                    </button>
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
