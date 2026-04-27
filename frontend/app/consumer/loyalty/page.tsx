"use client";
import { motion } from "framer-motion";
import { Gift, Star, Trophy, Zap, ChevronRight } from "lucide-react";

const TIERS = [
  {tier:"Bronze",  pts:"0–499",    color:"#cd7f32", perks:["5% discount on bookings","Priority booking"],  icon:"🥉"},
  {tier:"Silver",  pts:"500–1999", color:"#a8a9ad", perks:["10% discount","Free 1hr/month","SMS alerts"],  icon:"🥈"},
  {tier:"Gold",    pts:"2000–4999",color:"#ffd700", perks:["15% discount","2 free hrs/month","Peak access"],icon:"🥇"},
  {tier:"Platinum",pts:"5000+",    color:"#a78bfa", perks:["20% discount","Unlimited hrs/month","Priority support","Event access"],icon:"💎"},
];

const history = [
  {desc:"Booked Ather 450X · Indiranagar",    pts:"+25",date:"Today",type:"earn"},
  {desc:"Referral bonus — Priya joined",       pts:"+100",date:"Yesterday",type:"earn"},
  {desc:"Redeemed: 1 Free Hour Coupon",        pts:"-200",date:"3 days ago",type:"redeem"},
  {desc:"Booked Honda Activa · HSR Layout",    pts:"+18",date:"5 days ago",type:"earn"},
  {desc:"Weekend bonus (3 rides in a week)",   pts:"+50",date:"Last week",type:"earn"},
];

const rewards = [
  {name:"Free 1-Hour Ride",cost:200, icon:"🎟️",available:true},
  {name:"20% Off Next Ride",cost:150, icon:"🏷️",available:true},
  {name:"Airport Pickup",   cost:500, icon:"✈️",available:false},
  {name:"Premium Bike Upgrade",cost:300,icon:"👑",available:true},
  {name:"Free Monthly Pass",cost:1500,icon:"🚀",available:true},
  {name:"BikeSense Merch",  cost:800, icon:"🎁",available:true},
];

export default function LoyaltyPage() {
  const points = 1240;
  const currentTier = "Gold";
  const nextTier = "Platinum";
  const ptsToNext = 5000 - points;
  const progress = Math.round((points/5000)*100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-emerald-400" /> Loyalty Rewards
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Earn points every ride · Redeem for free bikes & discounts</p>
      </div>

      {/* Points card */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
        className="glass rounded-2xl p-8 border-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="text-sm text-slate-400 mb-1">Your Balance</div>
            <div className="text-6xl font-display font-bold text-white">{points.toLocaleString()}</div>
            <div className="text-slate-400 mt-1">points</div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1">🥇</div>
            <div className="text-sm font-bold text-amber-400">{currentTier}</div>
            <div className="text-xs text-slate-500">Member</div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-500">{currentTier}</span>
            <span className="text-slate-500">{nextTier} ({ptsToNext.toLocaleString()} pts away)</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${progress}%`}} transition={{delay:0.3,duration:1}}
              className="h-full rounded-full"
              style={{background:"linear-gradient(90deg,#fbbf24,#f59e0b)"}} />
          </div>
        </div>
      </motion.div>

      {/* Tiers */}
      <div className="grid md:grid-cols-4 gap-4">
        {TIERS.map((t,i)=>(
          <motion.div key={t.tier} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
            className={`glass rounded-xl p-4 ${t.tier===currentTier?"border border-amber-500/30":""}`}>
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="font-display font-bold text-white mb-0.5">{t.tier}</div>
            <div className="text-xs font-mono mb-3" style={{color:t.color}}>{t.pts} pts</div>
            <ul className="space-y-1">
              {t.perks.map(p=>(
                <li key={p} className="text-xs text-slate-400 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>{p}
                </li>
              ))}
            </ul>
            {t.tier===currentTier && (
              <div className="mt-3 badge-warning text-center">Current Tier</div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Redeem rewards */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400"/> Redeem Rewards
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((r,i)=>(
              <motion.div key={r.name} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.07}}
                className={`glass-light rounded-xl p-3 ${!r.available?"opacity-50":""}`}>
                <div className="text-xl mb-2">{r.icon}</div>
                <div className="text-xs font-medium text-white mb-0.5">{r.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-xs text-amber-400">{r.cost} pts</span>
                  <button disabled={!r.available||points<r.cost}
                    className={`text-xs px-2 py-0.5 rounded-lg transition-all ${r.available&&points>=r.cost?"bg-brand-500 text-white hover:bg-brand-600":"bg-slate-700/50 text-slate-600 cursor-not-allowed"}`}>
                    {points<r.cost?"Need more":"Redeem"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Points history */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400"/> Points History
          </h3>
          <div className="space-y-3">
            {history.map((h,i)=>(
              <motion.div key={i} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                className="flex items-center justify-between p-3 glass-light rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{h.type==="earn"?"⬆️":"⬇️"}</span>
                  <div>
                    <div className="text-xs font-medium text-white">{h.desc}</div>
                    <div className="text-xs text-slate-600">{h.date}</div>
                  </div>
                </div>
                <span className={`font-mono text-sm font-bold ${h.type==="earn"?"text-emerald-400":"text-red-400"}`}>
                  {h.pts}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral */}
      <div className="glass rounded-2xl p-6 bg-gradient-to-br from-brand-900/20 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-white mb-1">Refer a Friend</h3>
            <p className="text-slate-400 text-sm">Earn 100 points for every friend who joins and rides!</p>
            <div className="flex items-center gap-2 mt-3">
              <code className="glass-light rounded-lg px-3 py-1.5 text-sm font-mono text-brand-300">
                SRIRAM-BIKES
              </code>
              <button className="btn-ghost text-xs py-1.5 px-3">Copy</button>
            </div>
          </div>
          <div className="text-6xl">🎁</div>
        </div>
      </div>
    </div>
  );
}
