"use client";
import { motion } from "framer-motion";
import { LogOut, User, Zap, Bell, Shield, Moon, Monitor, Database } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const handleSignOut = async () => {
    try {
      // If Clerk is available on the window object, use its signOut method
      if (typeof window !== "undefined" && (window as any).Clerk) {
        await (window as any).Clerk.signOut();
      }
    } catch (e) {
      console.warn("Clerk signout bypassed", e);
    }
    // Hard redirect to landing page to completely clear the session/state
    window.location.href = "/";
  };

  const saveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, preferences, and ML engine configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Account & Security */}
        <div className="md:col-span-2 space-y-6">
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-6">
              <User className="w-5 h-5 text-brand-400" />
              Account Profile
            </h2>
            
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <User className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Admin User</h3>
                <p className="text-slate-400 text-sm">admin@bikesense.ai</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Superadmin Privileges</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <p className="text-xs text-slate-500 mt-2">This will end your current session and return you to the landing page.</p>
            </div>
          </motion.section>

          {/* ML Engine Config */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-6">
              <Database className="w-5 h-5 text-brand-400" />
              SARIMA Engine Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <h4 className="text-white font-medium text-sm">Aggressive Surge Pricing</h4>
                  <p className="text-xs text-slate-400 mt-1">Increase the surge multiplier ceiling from 1.25x to 1.5x during peak demand.</p>
                </div>
                <div className="w-11 h-6 bg-brand-500 rounded-full relative cursor-pointer opacity-50">
                  <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <h4 className="text-white font-medium text-sm">Auto-Rebalancing Automation</h4>
                  <p className="text-xs text-slate-400 mt-1">Allow the ML engine to automatically dispatch fleet trucks before low availability occurs.</p>
                </div>
                <div className="w-11 h-6 bg-brand-500 rounded-full relative cursor-pointer opacity-50">
                  <div className="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <h4 className="text-white font-medium text-sm">Model Retraining Interval</h4>
                  <p className="text-xs text-slate-400 mt-1">How often the SARIMA model updates its coefficients.</p>
                </div>
                <select className="bg-dark-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-500">
                  <option>Every 1 Hour</option>
                  <option>Every 6 Hours</option>
                  <option>Daily at Midnight</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={saveSettings} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
                Save ML Settings
              </button>
            </div>
          </motion.section>
        </div>

        {/* Sidebar Preferences */}
        <div className="space-y-6">
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-lg font-display font-semibold text-white mb-6">Preferences</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Theme</label>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-brand-500/20 border border-brand-500/30 text-white text-sm transition-colors text-left">
                    <Moon className="w-4 h-4 text-brand-400" />
                    Dark Mode (Active)
                  </button>
                  <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-white/5 text-slate-400 text-sm transition-colors text-left cursor-not-allowed opacity-50">
                    <Monitor className="w-4 h-4" />
                    System Sync
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Notifications</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-900" />
                    Critical Fleet Alerts
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-900" />
                    Demand Spikes (Surge &gt; 1.0x)
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-dark-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-900" />
                    Daily Revenue Digest
                  </label>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

      </div>
    </div>
  );
}
