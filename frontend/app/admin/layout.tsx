"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, DollarSign, Bike, Map, Users,
  FileBarChart2, Settings, Menu, X, ChevronRight, Bell, Search,
  Zap, User
} from "lucide-react";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!(CLERK_KEY && CLERK_KEY.startsWith("pk_"));

function SafeUserButton() {
  return (
    <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
      <User className="w-4 h-4 text-brand-400" />
    </div>
  );
}


const navItems = [
  { href:"/admin/dashboard",   label:"Dashboard",      icon:LayoutDashboard },
  { href:"/admin/forecasting", label:"Forecasting",    icon:TrendingUp },
  { href:"/admin/pricing",     label:"Pricing Engine", icon:DollarSign },
  { href:"/admin/fleet",       label:"Fleet",          icon:Bike },
  { href:"/admin/map",         label:"City Map",       icon:Map },
  { href:"/admin/analytics",   label:"Customer Analytics",icon:Users },
  { href:"/admin/reports",     label:"Reports",        icon:FileBarChart2 },
  { href:"/admin/settings",    label:"Settings",       icon:Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const Sidebar = ({ mobile=false }) => (
    <div className={`h-full flex flex-col ${mobile?"":"overflow-hidden"}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed&&!mobile?"justify-center":""}`}>
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <Bike className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <span className="font-display font-bold text-white text-sm">Bike<span className="text-brand-400">Sense</span></span>
            <div className="text-xs text-slate-500">Admin Console</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-item ${active?"active":""} ${collapsed&&!mobile?"justify-center px-2":""}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              {(!collapsed || mobile) && <span>{item.label}</span>}
              {(!collapsed || mobile) && active && <ChevronRight className="w-3 h-3 ml-auto text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      {(!collapsed || mobile) && (
        <div className="p-4 border-t border-white/5">
          <div className="glass-light rounded-xl p-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-brand-400" />
              <span className="text-brand-400 font-medium">SARIMA Models Active</span>
            </div>
            <div>3 models running · Last trained 2h ago</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Desktop Sidebar */}
      <motion.aside animate={{width: collapsed ? 64 : 240}}
        className="hidden lg:flex flex-col glass border-r border-white/5 relative z-10 shrink-0">
        <Sidebar />
        <button onClick={()=>setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 glass rounded-full flex items-center justify-center border border-white/10 hover:border-brand-500/30 transition-colors">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <X className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={()=>setMobileOpen(false)} />
            <motion.aside initial={{x:-280}} animate={{x:0}} exit={{x:-280}} transition={{type:"spring",damping:25}}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 glass z-50">
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass border-b border-white/5 px-6 h-14 flex items-center gap-4 shrink-0">
          <button onClick={()=>setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search zones, bikes, metrics..."
              className="input-dark w-full pl-9 py-1.5 text-sm" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <SafeUserButton />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
