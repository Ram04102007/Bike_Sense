"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Battery, Star, MapPin, Filter, Search, Zap, ChevronRight } from "lucide-react";

const ALL_BIKES = [
  {id:"b1",name:"Ather 450X",type:"EV",area:"Indiranagar",price:81,rating:4.8,available:true,battery:92,range:85,desc:"Premium EV scooter with 85km range. Smart dashboard & regenerative braking.",color:"#6366f1"},
  {id:"b2",name:"Bounce Infinity",type:"EV",area:"Koramangala",price:69,rating:4.5,available:true,battery:76,range:70,desc:"Mid-range EV with swappable battery. Lightweight and easy to manoeuvre.",color:"#00f5ff"},
  {id:"b3",name:"Yulu Move",type:"EV",area:"Whitefield",price:45,rating:4.2,available:true,battery:88,range:40,desc:"Compact city EV. Perfect for short commutes. Lock/unlock via app.",color:"#00ff88"},
  {id:"b4",name:"Honda Activa",type:"Scooter",area:"HSR Layout",price:55,rating:4.6,available:true,battery:null,range:null,desc:"India's most trusted scooter. Reliable, fuel-efficient, comfortable ride.",color:"#f59e0b"},
  {id:"b5",name:"Royal Enfield",type:"Premium",area:"Marathahalli",price:120,rating:4.9,available:false,battery:null,range:null,desc:"Classic 350cc. Weekend warrior. Book in advance — very popular!",color:"#a78bfa"},
  {id:"b6",name:"Rapido Bike",type:"Budget",area:"Jayanagar",price:38,rating:4.1,available:true,battery:null,range:null,desc:"Budget-friendly. Get around without breaking the bank.",color:"#94a3b8"},
  {id:"b7",name:"Ather 450X",type:"EV",area:"Electronic City",price:76,rating:4.7,available:true,battery:65,range:80,desc:"Same great Ather 450X, fresh charge. Available now in E-City.",color:"#6366f1"},
  {id:"b8",name:"Bounce Infinity",type:"EV",area:"Hebbal",price:65,rating:4.4,available:true,battery:81,range:68,desc:"Great value EV. Hebbal station, swap battery when needed.",color:"#00f5ff"},
  {id:"b9",name:"Honda Activa",type:"Scooter",area:"Indiranagar",price:58,rating:4.5,available:true,battery:null,range:null,desc:"Second Activa unit in Indiranagar. Ready to go.",color:"#f59e0b"},
  {id:"b10",name:"Yulu Move",type:"EV",area:"HSR Layout",price:45,rating:4.3,available:true,battery:95,range:40,desc:"Fully charged Yulu in HSR. Cheapest EV option in the zone.",color:"#00ff88"},
];

const TYPES = ["All","EV","Scooter","Premium","Budget"];
const AREAS = ["All","Indiranagar","Koramangala","Whitefield","Marathahalli","HSR Layout","Jayanagar","Electronic City","Hebbal"];

function BikeCard({bike}: {bike: typeof ALL_BIKES[0]}) {
  const [booked, setBooked] = useState(false);
  return (
    <motion.div layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
      className={`glass rounded-2xl overflow-hidden hover-lift transition-all ${!bike.available?"opacity-60":""}`}>
      {/* Colour strip */}
      <div className="h-1.5" style={{background:`linear-gradient(90deg, ${bike.color}, transparent)`}} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{background:`${bike.color}15`, border:`1px solid ${bike.color}25`}}>
              {bike.type==="EV"?"⚡":bike.type==="Premium"?"👑":bike.type==="Budget"?"💰":"🏍️"}
            </div>
            <div>
              <div className="font-display font-semibold text-white">{bike.name}</div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />{bike.area}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-xl text-white">₹{bike.price}<span className="text-xs text-slate-500 font-normal">/hr</span></div>
            <div className="flex items-center gap-1 text-xs text-amber-400 justify-end">
              <Star className="w-3 h-3 fill-amber-400" />{bike.rating}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full border"
            style={{color:bike.color, borderColor:`${bike.color}30`, background:`${bike.color}10`}}>
            {bike.type}
          </span>
          {bike.battery && (
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${bike.battery>70?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
              <Battery className="w-3 h-3" />{bike.battery}%
            </span>
          )}
          {bike.range && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30">
              {bike.range}km range
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${bike.available?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20":"bg-red-500/10 text-red-400 border border-red-500/20"}`}>
            {bike.available?"Available":"Unavailable"}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">{bike.desc}</p>

        <button
          disabled={!bike.available}
          onClick={() => setBooked(true)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            booked ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
            : bike.available ? "btn-primary" : "bg-slate-700/30 text-slate-600 cursor-not-allowed"
          }`}>
          {booked ? <><Zap className="w-4 h-4" />Booking Confirmed!</> :
           bike.available ? <>Book Now <ChevronRight className="w-4 h-4" /></> : "Not Available"}
        </button>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price"|"rating">("price");
  const [availOnly, setAvailOnly] = useState(false);

  const filtered = ALL_BIKES
    .filter(b => typeFilter==="All" || b.type===typeFilter)
    .filter(b => areaFilter==="All" || b.area===areaFilter)
    .filter(b => !availOnly || b.available)
    .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.area.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortBy==="price" ? a.price-b.price : b.rating-a.rating);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Bike className="w-6 h-6 text-brand-400" /> Bike Marketplace
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">{filtered.length} bikes found across Bangalore</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search bikes or areas..."
              className="input-dark w-full pl-9 py-1.5 text-sm" />
          </div>
          <button onClick={()=>setAvailOnly(!availOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${availOnly?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"glass text-slate-400 hover:text-white"}`}>
            ✓ Available Only
          </button>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="input-dark text-sm py-1.5 shrink-0">
            <option value="price">Sort: Price</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>

        {/* Type pills */}
        <div className="flex gap-2 flex-wrap">
          {TYPES.map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${typeFilter===t?"bg-brand-500 text-white":"glass-light text-slate-400 hover:text-white"}`}>
              {t==="EV"?"⚡ EV":t==="Premium"?"👑 Premium":t==="Budget"?"💰 Budget":t==="Scooter"?"🛵 Scooter":"All"}
            </button>
          ))}
        </div>

        {/* Area pills */}
        <div className="flex gap-2 flex-wrap">
          {AREAS.map(a=>(
            <button key={a} onClick={()=>setAreaFilter(a)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${areaFilter===a?"bg-brand-500 text-white":"glass-light text-slate-400 hover:text-white"}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(bike => <BikeCard key={bike.id} bike={bike} />)}
          </motion.div>
        ) : (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass rounded-2xl p-16 text-center">
            <Bike className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 font-medium">No bikes found</div>
            <div className="text-slate-600 text-sm mt-1">Try adjusting your filters</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
