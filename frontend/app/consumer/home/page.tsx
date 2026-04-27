"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  MapPin, Clock, Zap, TrendingUp, Star, Battery, ChevronRight,
  Sparkles, AlertTriangle, CheckCircle
} from "lucide-react";

const AREAS = ["Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];
const MODELS = ["Ather 450X","Bounce Infinity","Yulu Move","Rapido Bike","Royal Enfield","Honda Activa"];

const priceTrend = Array.from({length:24}, (_,h) => ({
  hour: `${h.toString().padStart(2,"0")}:00`,
  price: h<6||h>22 ? 65 : h>=7&&h<=9||h>=17&&h<=20 ? 81.25 : h>=10&&h<=15 ? 65 : 70.2,
  demand: Math.round(200 + Math.exp(-0.5*((h-8)/2.5)**2)*400 + Math.exp(-0.5*((h-18)/2.5)**2)*300),
}));

const nearbyBikes = [
  {name:"Ather 450X",area:"Indiranagar",price:76,rating:4.8,type:"EV",battery:92,dist:"0.3 km"},
  {name:"Honda Activa",area:"Koramangala",price:65,rating:4.6,type:"Scooter",battery:null,dist:"0.7 km"},
  {name:"Yulu Move",area:"HSR Layout",price:45,rating:4.2,type:"EV",battery:88,dist:"1.1 km"},
  {name:"Bounce Infinity",area:"Indiranagar",price:69,rating:4.5,type:"EV",battery:76,dist:"1.4 km"},
];

const quickTips = [
  {icon:"💚",title:"Best time now",desc:"Standard pricing active · ₹65/hr",tag:"Save ₹16/hr"},
  {icon:"📅",title:"Cheapest day",desc:"Wednesday — avg demand lowest",tag:"Book ahead"},
  {icon:"⚡",title:"Avoid 5–8 PM",desc:"Peak surge expected (×1.25)",tag:"Rush hour"},
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
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

function PricePredictor() {
  const [form, setForm] = useState({ area:"Indiranagar", model:"Ather 450X", date:"", time:"09:00" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const hr = parseInt(form.time.split(":")[0]);
    const isRush = (hr>=7&&hr<=9)||(hr>=17&&hr<=20);
    const isMidDay = hr>=10&&hr<=15;
    setResult({
      price: isRush ? 81.25 : isMidDay ? 65 : 70.20,
      surge: isRush ? 1.25 : isMidDay ? 1.0 : 1.08,
      label: isRush ? "Peak Surge" : isMidDay ? "Standard" : "Moderate",
      demand: isRush ? "Very High" : isMidDay ? "Low" : "Moderate",
      saving: isRush ? 0 : 81.25 - (isMidDay?65:70.2),
      altTime: isRush ? "11:00 AM" : null,
      altPrice: isRush ? 65 : null,
    });
    setLoading(false);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-brand-400" />
        <h2 className="font-display font-semibold text-white">Smart Price Predictor</h2>
        <span className="badge-info ml-auto">SARIMA AI</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Pickup Area</label>
          <select value={form.area} onChange={e=>setForm({...form,area:e.target.value})}
            className="input-dark w-full">
            {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Bike Type</label>
          <select value={form.model} onChange={e=>setForm({...form,model:e.target.value})}
            className="input-dark w-full">
            {MODELS.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Date</label>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
            className="input-dark w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">Time</label>
          <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}
            className="input-dark w-full" />
        </div>
      </div>

      <button onClick={predict} disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analysing with SARIMA...
          </>
        ) : (
          <><Sparkles className="w-4 h-4" /> Predict Price & Demand</>
        )}
      </button>

      {result && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <div className={`rounded-xl p-5 ${result.surge>1.1?"card-gradient-orange":result.surge>1?"card-gradient-blue":"card-gradient-green"} border border-white/10`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-3xl font-display font-bold text-white mb-0.5">₹{result.price}/hr</div>
                <div className={`text-sm font-medium ${result.surge>1.1?"text-red-400":result.surge>1?"text-amber-400":"text-emerald-400"}`}>
                  {result.label} · ×{result.surge.toFixed(2)} surge
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Demand</div>
                <div className="font-semibold text-white">{result.demand}</div>
              </div>
            </div>

            {result.saving > 0 && (
              <div className="flex items-center gap-2 p-3 glass-light rounded-lg mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-300">
                  You save <strong>₹{result.saving}/hr</strong> vs peak pricing!
                </span>
              </div>
            )}

            {result.altTime && (
              <div className="flex items-center gap-2 p-3 glass-light rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">
                  Better deal at <strong>{result.altTime}</strong> — just ₹{result.altPrice}/hr!
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ConsumerHome() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Welcome back 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Find the best bike deals in Bangalore today</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Your Points</div>
          <div className="font-display font-bold text-xl text-emerald-400">1,240 pts</div>
        </div>
      </div>

      {/* Quick tips */}
      <div className="grid md:grid-cols-3 gap-3">
        {quickTips.map((t,i) => (
          <motion.div key={t.title} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
            className="glass rounded-xl p-4 flex items-start gap-3 hover-lift">
            <span className="text-2xl">{t.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-white text-sm">{t.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
            </div>
            <span className="badge-success text-xs whitespace-nowrap">{t.tag}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Price Predictor */}
        <div className="lg:col-span-2">
          <PricePredictor />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Today's Price Trend */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-white">Today's Price Trend</h3>
                <p className="text-xs text-slate-500">Hourly pricing across Bangalore</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={priceTrend}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{fontSize:9}} interval={3} />
                <YAxis domain={[60,85]} tick={{fontSize:9}} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="stepAfter" dataKey="price" name="Price" stroke="#10b981" fill="url(#priceGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-red-400 inline-block" /> Peak rush hours (7–9 AM, 5–8 PM)
              <span className="w-3 h-0.5 bg-emerald-400 inline-block ml-2" /> Best time to rent
            </div>
          </div>

          {/* Nearby Bikes */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Nearby Available Bikes</h3>
              <a href="/consumer/marketplace" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-3">
              {nearbyBikes.map((b, i) => (
                <motion.div key={i} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                  className="flex items-center gap-4 p-3 glass-light rounded-xl hover-lift cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg">
                    {b.type==="EV"?"⚡":"🏍️"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-white">{b.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <MapPin className="w-3 h-3" />{b.area} · {b.dist}
                      {b.battery && <><Battery className="w-3 h-3 ml-1 text-emerald-400" />{b.battery}%</>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-white">₹{b.price}<span className="text-xs text-slate-500">/hr</span></div>
                    <div className="flex items-center gap-1 text-xs text-amber-400 justify-end">
                      <Star className="w-3 h-3 fill-amber-400" />{b.rating}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
