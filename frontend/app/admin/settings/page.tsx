"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, User, Database, Moon, Monitor, Shield, UploadCloud, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [peakSurge, setPeakSurge] = useState(1.25);
  const [eventMultiplier, setEventMultiplier] = useState(1.50);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/ml/admin/ml-config");
        const json = await res.json();
        if (json.success && json.config) {
          setPeakSurge(json.config.peak_surge);
          setEventMultiplier(json.config.event_multiplier);
        }
      } catch (err) {
        console.error("Failed to load ML config", err);
      }
    };
    loadConfig();
  }, []);
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

  const saveSettings = async () => {
    try {
      const res = await fetch("/api/ml/admin/ml-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peak_surge: Number(peakSurge),
          event_multiplier: Number(eventMultiplier)
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ML Engine updated dynamically!");
      } else {
        toast.error("Failed to update ML settings.");
      }
    } catch (err) {
      toast.error("API error while saving settings.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const mlBase = process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:8000";
      const res = await fetch(`${mlBase}/api/v1/admin/upload-dataset`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Dataset uploaded! SARIMA models retrained.");
        setFile(null);
        // Reset file input value
        const fileInput = document.getElementById("dataset-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Error communicating with server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, preferences, and ML engine configurations.</p>
      </div>

      <div className="max-w-2xl space-y-8">
        
        {/* Account & Security */}
        <div className="space-y-6">
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
              <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Peak Demand Surge Ceiling</h4>
                    <p className="text-xs text-slate-400 mt-1">Maximum surge multiplier allowed during rush hours.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="0.05" min="1.0" max="3.0"
                      value={peakSurge}
                      onChange={e => setPeakSurge(Number(e.target.value))}
                      className="w-20 bg-dark-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-500 text-right"
                    />
                    <span className="text-slate-400 text-sm font-medium">x</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium text-sm">Event / Festival Multiplier</h4>
                    <p className="text-xs text-slate-400 mt-1">Global multiplier applied to base surge during known events (e.g. Diwali).</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" step="0.05" min="1.0" max="5.0"
                      value={eventMultiplier}
                      onChange={e => setEventMultiplier(Number(e.target.value))}
                      className="w-20 bg-dark-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand-500 text-right"
                    />
                    <span className="text-slate-400 text-sm font-medium">x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={saveSettings} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
                Save ML Settings
              </button>
            </div>
          </motion.section>

          {/* Custom Dataset Upload */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="flex items-center gap-2 text-lg font-display font-semibold text-white mb-6">
              <UploadCloud className="w-5 h-5 text-brand-400" />
              Custom Dataset Upload
            </h2>
            
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <p className="text-sm text-slate-400 mb-4">
                Upload your own <span className="text-white font-medium">bike_data.csv</span> to dynamically retrain the SARIMA machine learning models. 
                The entire dashboard (Pricing, Fleet, Analytics) will instantly update to reflect your custom data!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <input 
                    id="dataset-upload"
                    type="file" 
                    accept=".csv"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed transition-colors ${
                    file ? "border-brand-500 bg-brand-500/10" : "border-white/20 bg-dark-800 hover:border-brand-500/50"
                  }`}>
                    <FileText className={`w-5 h-5 ${file ? "text-brand-400" : "text-slate-500"}`} />
                    <span className={`text-sm font-medium truncate ${file ? "text-brand-300" : "text-slate-400"}`}>
                      {file ? file.name : "Select CSV Dataset..."}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`px-5 py-3 rounded-lg font-medium text-sm flex items-center justify-center min-w-[140px] transition-all ${
                    !file || uploading ? "bg-white/5 text-slate-500 cursor-not-allowed" : "btn-primary"
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Retraining ML...
                    </span>
                  ) : "Upload & Train"}
                </button>
              </div>
            </div>
          </motion.section>
        </div>



      </div>
    </div>
  );
}
