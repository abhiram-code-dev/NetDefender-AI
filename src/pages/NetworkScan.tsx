import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wifi, Search, ShieldAlert, CheckCircle2, Loader2, Zap, Globe, Server, Activity, AlertTriangle } from "lucide-react";
import { analyzeThreat } from "../services/gemini";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";

export default function NetworkScan() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const startScan = async () => {
    setScanning(true);
    setResults(null);
    setAiAnalysis(null);
    
    try {
      const response = await fetch("/api/scan/network", { method: "POST" });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText || "Empty response"}`);
      }

      const data = await response.json();
      setResults(data);
      
      setAnalyzing(true);
      const analysis = await analyzeThreat(data);
      setAiAnalysis(analysis);
      
      // Save to history
      if (auth.currentUser) {
        await addDoc(collection(db, "scans"), {
          userId: auth.currentUser.uid,
          type: "network",
          status: analysis.threatLevel.toLowerCase(),
          riskScore: analysis.riskScore,
          timestamp: new Date().toISOString(),
          details: data,
          aiAnalysis: analysis
        });
      }
      
      toast.success("Network scan and AI analysis complete.");
    } catch (error) {
      toast.error("Network scan failed. Please try again.");
      console.error(error);
    } finally {
      setScanning(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl mb-2">
          <Wifi className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold text-white">Network Vulnerability Scan</h1>
        <p className="text-gray-400 max-w-lg mx-auto">Analyze your local network for open ports, rogue devices, and suspicious traffic patterns.</p>
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={startScan}
          disabled={scanning}
          className={cn(
            "relative group px-12 py-6 bg-blue-500 rounded-3xl font-bold text-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
            scanning && "animate-pulse"
          )}
        >
          <div className="flex items-center gap-3">
            {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
            {scanning ? "Scanning Network..." : "Start Network Scan"}
          </div>
          <div className="absolute inset-0 bg-blue-400 rounded-3xl -z-10 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
        </button>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Scan Results */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Network Discovery Results
                </h3>
                
                <div className="space-y-4">
                  {results.devices.map((device: any, i: number) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Server className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{device.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{device.ip} • {device.mac}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Open Ports</p>
                        <div className="flex gap-1">
                          {device.ports.map((port: number) => (
                            <span key={port} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 font-mono">{port}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-500" />
                  Traffic Analysis
                </h3>
                <div className="space-y-4">
                  {results.traffic.map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          t.severity === "high" ? "bg-red-500" : t.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                        )} />
                        <span className="text-xs text-gray-300">{t.description}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono">{t.protocol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analysis Sidebar */}
            <div className="space-y-6">
              {analyzing ? (
                <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <h4 className="text-white font-bold mb-2">AI is analyzing network patterns...</h4>
                  <p className="text-xs text-gray-500">Correlating traffic with known threat vectors.</p>
                </div>
              ) : aiAnalysis && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className={cn(
                    "p-8 rounded-3xl border shadow-2xl",
                    aiAnalysis.threatLevel === "High" ? "bg-red-500/10 border-red-500/20" : 
                    aiAnalysis.threatLevel === "Medium" ? "bg-yellow-500/10 border-yellow-500/20" : 
                    "bg-green-500/10 border-green-500/20"
                  )}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Zap className={cn(
                          "w-5 h-5",
                          aiAnalysis.threatLevel === "High" ? "text-red-500" : "text-blue-500"
                        )} />
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">AI Forensic Report</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Risk Score</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          aiAnalysis.riskScore > 70 ? "text-red-500" : "text-blue-500"
                        )}>{aiAnalysis.riskScore}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {aiAnalysis.riskScore > 40 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{aiAnalysis.threatLevel} Threat Detected</span>
                      </div>
                      
                      <div className="text-xs text-gray-400 leading-relaxed markdown-body">
                        <ReactMarkdown>{aiAnalysis.explanation}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Recommended Actions</p>
                      <ul className="space-y-3">
                        {aiAnalysis.actions.map((action: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-xs text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Forensic Timeline</h5>
                    <div className="space-y-4">
                      {aiAnalysis.timeline.map((event: string, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-px bg-white/10 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <p className="text-[10px] text-gray-400 pb-4">{event}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
