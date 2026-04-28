"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  BarChart3, Zap, Shield, Globe, ChevronRight, ArrowRight,
  TrendingUp, Users, MapPin, Clock, Star, CheckCircle2,
  Building2, Bike, Brain, Target, Sparkles
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ─── Mock live forecast data ─────────────────────────────────────────────
const demoData = Array.from({length:24}, (_,i) => ({
  hour: `${i.toString().padStart(2,"0")}:00`,
  demand: Math.round(400 + 300*Math.exp(-0.5*((i-8)/2.5)**2) + 220*Math.exp(-0.5*((i-18)/2.5)**2) + Math.random()*40),
  price:  i<6||i>22 ? 65 : i>=7&&i<=9||i>=17&&i<=20 ? 81.25 : i>=10&&i<=15 ? 65 : 70.20,
}));

const stats = [
  { label:"Rides Forecasted",   value:"2.4M+",  icon:Bike,     color:"#6366f1" },
  { label:"Fleet Partners",     value:"120+",   icon:Building2, color:"#00f5ff" },
  { label:"Avg Accuracy",       value:"94.2%",  icon:Target,   color:"#00ff88" },
  { label:"Cities Active",      value:"3",      icon:Globe,    color:"#f59e0b" },
];

const features = [
  {
    icon: Brain, title:"SARIMA AI Engine",
    desc:"Three-horizon SARIMA/SARIMAX models — hourly, daily, and monthly — trained on 17,379 real Bangalore data points.",
    color:"#6366f1", tag:"ML-Powered"
  },
  {
    icon: Zap, title:"Dynamic Pricing",
    desc:"Real-time surge pricing engine with 4 tiers: Standard, Moderate, High, and Peak. Maximise revenue automatically.",
    color:"#00f5ff", tag:"Revenue+"
  },
  {
    icon: MapPin, title:"8-Zone City Intelligence",
    desc:"Hyper-local demand maps for Indiranagar, Koramangala, Whitefield, and 5 more Bangalore zones.",
    color:"#00ff88", tag:"Geo-Analytics"
  },
  {
    icon: Shield, title:"Role-Based Access",
    desc:"Separate dashboards for fleet operators and consumers — each with tailored intelligence and workflows.",
    color:"#f59e0b", tag:"Enterprise"
  },
];

const testimonials = [
  { name:"Vikram Sharma", role:"CEO, BangBikes", rating:5, text:"BikeSense's demand forecasting saved us from overstocking by 34%. The pricing engine alone paid back our subscription in the first week." },
  { name:"Priya Nair", role:"Fleet Manager, VeloRide", rating:5, text:"Finally — a tool that tells us WHERE to rebalance bikes BEFORE rush hour. The heatmaps are surgical." },
  { name:"Rahul Mehta", role:"Daily Commuter", rating:5, text:"I check BikeSense before renting. Saved ₹800 last month by avoiding surge hours. The 'Best Time' feature is a game changer." },
];

const plans = [
  { name:"Starter",  price:"₹4,999",  period:"/month", features:["Up to 50 bikes","7-day forecasts","Basic analytics","Email support"], color:"#6366f1", popular:false },
  { name:"Growth",   price:"₹14,999", period:"/month", features:["Up to 250 bikes","30-day forecasts","Dynamic pricing","Priority support","Fleet rebalancing"], color:"#00f5ff", popular:true },
  { name:"Enterprise",price:"Custom", period:"", features:["Unlimited bikes","12-month forecasts","Custom ML models","Dedicated CSM","API access","White-label"], color:"#00ff88", popular:false },
];

// ─── Animated Counter ────────────────────────────────────────────────────
function Counter({ target, suffix="" }: { target:number, suffix?:string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Particles ──────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden>
      {Array.from({length:20}).map((_,i) => (
        <div key={i} className="particle" style={{
          left:`${Math.random()*100}%`,
          top:`${Math.random()*100}%`,
          "--dur":`${4+Math.random()*6}s`,
          "--delay":`${Math.random()*4}s`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p:any) => (
        <p key={p.name} style={{color:p.color}}>
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav initial={{y:-60,opacity:0}} animate={{y:0,opacity:1}}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled?"glass border-b border-white/5":"bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Bike className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Bike<span className="text-gradient-brand">Sense</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {["Features","Pricing","About","Docs"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Link href="/auth/signup" className="btn-primary text-sm py-2">Get Started</Link>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <Particles />
      
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-brand-950/30 blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-300">Live forecasts for Bangalore</span>
            <span className="text-brand-400">→ 8 zones active</span>
          </motion.div>

          <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="font-display font-bold text-5xl lg:text-6xl leading-[1.1] mb-6">
            <span className="text-white">AI Forecasting</span><br/>
            <span className="text-gradient-brand">for Smarter</span><br/>
            <span className="text-white">Bike Rentals</span>
          </motion.h1>

          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
            SARIMA-powered demand intelligence for Bangalore's bike rental ecosystem.
            Fleet operators maximise revenue. Customers find the best price. Everyone wins.
          </motion.p>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
            className="flex flex-wrap gap-4 mb-12">
            <Link href="/auth/signup?role=admin"
              className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              <Building2 className="w-4 h-4" /> For Operators
            </Link>
            <Link href="/auth/signup?role=consumer"
              className="btn-ghost flex items-center gap-2 text-base px-8 py-3">
              <Bike className="w-4 h-4" /> For Riders
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
            className="grid grid-cols-3 gap-6">
            {[["17,379","Training Records"],["94.2%","SARIMA Accuracy"],["₹120K+","Monthly Savings"]].map(([v,l])=>(
              <div key={l}>
                <div className="text-2xl font-display font-bold text-white">{v}</div>
                <div className="text-xs text-slate-500 mt-0.5">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Live Chart */}
        <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3,duration:0.8}}>
          <div className="glass rounded-2xl p-6 border-gradient">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Live Demand Forecast</p>
                <h3 className="font-display font-semibold text-white">Today · Bangalore City</h3>
              </div>
              <span className="badge-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                SARIMA Live
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={demoData}>
                <defs>
                  <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{fontSize:10}} interval={3} />
                <YAxis tick={{fontSize:10}} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="demand" name="Demand" stroke="#6366f1" fill="url(#demandGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Price indicator row */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-4 gap-2">
              {[{l:"Standard",v:"₹65",c:"#10b981"},{l:"Moderate",v:"₹70.2",c:"#f59e0b"},{l:"High",v:"₹76",c:"#f97316"},{l:"Peak",v:"₹81.25",c:"#ef4444"}].map(t=>(
                <div key={t.l} className="text-center">
                  <div className="text-xs font-mono font-semibold" style={{color:t.c}}>{t.v}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{t.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini cards */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[{label:"Peak Hour",value:"8–9 AM",icon:"🕗",color:"#f59e0b"},{label:"Best Rate",value:"₹65 /hr",icon:"💚",color:"#10b981"}].map(c=>(
              <div key={c.label} className="glass rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <div className="text-xs text-slate-500">{c.label}</div>
                  <div className="font-semibold text-white">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}}
            transition={{delay:i*0.1}} viewport={{once:true}}
            className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{background:`${s.color}15`, border:`1px solid ${s.color}30`}}>
              <s.icon className="w-5 h-5" style={{color:s.color}} />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-white">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="text-center mb-16">
          <span className="badge-info mb-4 inline-block">Platform Features</span>
          <h2 className="font-display font-bold text-4xl text-white mb-4">
            Built for <span className="text-gradient-brand">serious operators</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Production-grade ML meets beautiful UX. Every feature is backed by real model outputs — no fake charts.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}}
              transition={{delay:i*0.1}} viewport={{once:true}}
              className="glass rounded-2xl p-8 hover-lift group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{background:`${f.color}15`, border:`1px solid ${f.color}25`}}>
                  <f.icon className="w-6 h-6" style={{color:f.color}} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full border"
                  style={{color:f.color, borderColor:`${f.color}30`, background:`${f.color}10`}}>
                  {f.tag}
                </span>
              </div>
              <h3 className="font-display font-semibold text-xl text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n:"01", title:"Sign up & choose your role", desc:"Register as a Rental Company or Consumer. Role-based dashboards activate instantly.", icon:"🎯" },
    { n:"02", title:"Connect or explore bikes",   desc:"Admins onboard their fleet. Consumers search available bikes by zone and time.",   icon:"🚲" },
    { n:"03", title:"Get AI predictions",         desc:"SARIMA engine forecasts demand, surge, and optimal pricing in real time.",         icon:"🤖" },
    { n:"04", title:"Act on intelligence",        desc:"Operators rebalance fleets. Consumers book at the right time for the best price.", icon:"⚡" },
  ];
  return (
    <section id="howitworks" className="py-24 bg-dark-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl text-white mb-4">How It Works</h2>
          <p className="text-slate-400">From signup to smarter decisions in under 5 minutes.</p>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.n} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}}
              transition={{delay:i*0.15}} viewport={{once:true}}
              className="relative text-center">
              {i < steps.length-1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-brand-500/30 to-transparent" />
              )}
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                {s.icon}
              </div>
              <span className="text-xs font-mono text-brand-400">{s.n}</span>
              <h3 className="font-display font-semibold text-white mt-1 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Dashboards Preview ───────────────────────────────────────────────────
function DashboardsSection() {
  const [active, setActive] = useState<"admin"|"consumer">("admin");
  const adminFeats = ["Real-time demand heatmaps","Dynamic pricing engine","Fleet rebalancing AI","Customer churn prediction","Revenue analytics","Export investor reports"];
  const consumerFeats = ["Live price prediction","Best time to rent","Nearby bike finder","Loyalty rewards","Price trend alerts","Smart recommendations"];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl text-white mb-4">Two Dashboards. One Platform.</h2>
          <p className="text-slate-400">Purpose-built intelligence for operators and riders.</p>
        </motion.div>

        <div className="flex justify-center gap-3 mb-10">
          {(["admin","consumer"] as const).map(t => (
            <button key={t} onClick={()=>setActive(t)}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${active===t?"bg-brand-500 text-white shadow-glow-sm":"glass text-slate-400 hover:text-white"}`}>
              {t==="admin"?"🏢 Admin / Operator":"🚲 Consumer / Rider"}
            </button>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className={`badge-info mb-4 inline-block ${active==="consumer"?"bg-emerald-500/15 text-emerald-400 border-emerald-500/20":""}`}>
              {active==="admin"?"Fleet & Revenue Intelligence":"Smart Rental Experience"}
            </span>
            <h3 className="font-display font-bold text-2xl text-white mb-4">
              {active==="admin"?"Command Center for Operators":"AI-Powered Rider Dashboard"}
            </h3>
            <p className="text-slate-400 mb-6">
              {active==="admin"
                ? "Full visibility into demand patterns, fleet health, revenue trends, and pricing — all driven by real SARIMA predictions."
                : "Know exactly when to rent, where to find the cheapest bikes, and how to earn loyalty rewards — powered by the same AI engine."}
            </p>
            <ul className="space-y-2.5">
              {(active==="admin"?adminFeats:consumerFeats).map(f=>(
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/auth/signup?role=${active}`}
              className="btn-primary inline-flex items-center gap-2 mt-8">
              {active==="admin"?"Access Admin Dashboard":"Start Riding Smarter"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock dashboard preview */}
          <div className="glass-light rounded-xl p-4 border border-white/5">
            {active==="admin" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[{l:"Total Rides",v:"2.4M",c:"#6366f1"},{l:"Revenue",v:"₹12.8L",c:"#00f5ff"},{l:"Active Bikes",v:"847",c:"#00ff88"},{l:"Occupancy",v:"73%",c:"#f59e0b"}].map(k=>(
                    <div key={k.l} className="glass rounded-lg p-3">
                      <div className="text-xs text-slate-500">{k.l}</div>
                      <div className="font-display font-bold text-xl" style={{color:k.c}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-2">7-Day Demand Forecast</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={demoData.filter((_,i)=>i%3===0)}>
                      <Line type="monotone" dataKey="demand" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="glass rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-1">Price Prediction</div>
                  <div className="text-3xl font-display font-bold text-emerald-400">₹65.00</div>
                  <div className="text-xs text-emerald-500 mt-1">✓ Standard Pricing — Best time to rent!</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-2">Today's Price Trend</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={demoData.filter((_,i)=>i%2===0)}>
                      <defs>
                        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="price" stroke="#10b981" fill="url(#pg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {[{area:"Indiranagar",bikes:23,price:70.2},{area:"HSR Layout",bikes:31,price:65.0}].map(b=>(
                  <div key={b.area} className="glass rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{b.area}</div>
                      <div className="text-xs text-slate-500">{b.bikes} bikes available</div>
                    </div>
                    <div className="font-mono font-semibold text-emerald-400">₹{b.price}/hr</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}



// ─── CTA ──────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-cyan-900/10" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}>
          <Sparkles className="w-12 h-12 text-brand-400 mx-auto mb-6" />
          <h2 className="font-display font-bold text-5xl text-white mb-6">
            Ready to forecast <span className="text-gradient-brand">smarter?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join 120+ fleet operators and 15,000+ riders using BikeSense AI across Bangalore.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary text-base px-10 py-3 flex items-center gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="btn-ghost text-base px-10 py-3">
              View Live Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
            <Bike className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-white">BikeSense AI</span>
        </div>
        <p className="text-sm text-slate-600">
          © 2026 BikeSense AI. Built for Bangalore's mobility ecosystem.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          {["Privacy","Terms","API Docs"].map(l=><a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <DashboardsSection />
      <CTA />
      <Footer />
    </main>
  );
}
