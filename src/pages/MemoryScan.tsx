import { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  Cpu, 
  Upload, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Terminal,
  Zap,
  Download
} from "lucide-react";
import { cn } from "../lib/utils";
import { analyzeThreat } from "../services/gemini";
import { toast } from "sonner";

import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function MemoryScan() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadReport = () => {
    if (!aiAnalysis) return;
    const report = `
NETDEFENDER AI - MEMORY FORENSIC REPORT
=======================================
Timestamp: ${new Date().toLocaleString()}
File Name: ${file?.name || "Memory Dump"}
Status: ${results?.status?.toUpperCase() || "UNKNOWN"}
Risk Score: ${aiAnalysis.riskScore}/100
Malware Type: ${aiAnalysis.malwareType}

AI ANALYSIS SUMMARY:
-------------------
${aiAnalysis.explanation}

ROOT CAUSE:
----------
${aiAnalysis.rootCause}

RECOMMENDED ACTIONS:
-------------------
${aiAnalysis.actions.map((a: string) => `- ${a}`).join("\n")}

TECHNICAL DETAILS:
-----------------
${JSON.stringify(results, null, 2)}
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NetDefender_Memory_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startScan = async () => {
    if (!file && !scanning) {
      fileInputRef.current?.click();
      return;
    }
    
    setScanning(true);
    setResults(null);
    setAiAnalysis(null);

    // Simulate scan delay
    setTimeout(async () => {
      try {
        const response = await fetch("/api/scan/memory", { method: "POST" });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText || "Empty response"}`);
        }

        const data = await response.json();
        setResults(data);
        setScanning(false);
        
        // Auto-trigger AI analysis
        setAnalyzing(true);
        const analysis = await analyzeThreat(data);
        setAiAnalysis(analysis);
        setAnalyzing(false);

        // Save to Firestore
        if (auth.currentUser) {
          await addDoc(collection(db, "scans"), {
            userId: auth.currentUser.uid,
            timestamp: new Date().toISOString(),
            type: "memory",
            status: data.threatsFound > 0 ? "malicious" : "clean",
            details: data,
            aiAnalysis: analysis,
            riskScore: analysis.riskScore
          });
        }
      } catch (error) {
        toast.error("Memory scan failed. Please try again.");
        console.error(error);
        setScanning(false);
        setAnalyzing(false);
      }
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Memory Forensics</h1>
          <p className="text-gray-400">Analyze RAM dumps for fileless malware and code injection.</p>
        </div>
        <button
          onClick={startScan}
          disabled={scanning}
          className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all disabled:opacity-50"
        >
          {scanning ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          {scanning ? "Analyzing Memory..." : file ? "Start Memory Scan" : "Upload Memory Dump"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload/Config Card */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">Scan Configuration</h3>
          <div className="space-y-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".raw,.mem,.dmp"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer group",
                file ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 hover:border-blue-500/30"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl mb-4 transition-colors",
                file ? "bg-blue-500/20" : "bg-white/5 group-hover:bg-blue-500/10"
              )}>
                <Upload className={cn("w-8 h-8", file ? "text-blue-500" : "text-gray-500 group-hover:text-blue-500")} />
              </div>
              <p className="text-sm font-medium text-white mb-1">
                {file ? file.name : "Upload RAM Dump"}
              </p>
              <p className="text-xs text-gray-500">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Supports .raw, .mem, .dmp"}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Volatility Plugins</h4>
              {[
                { name: "windows.pslist", desc: "List active processes" },
                { name: "windows.malfind", desc: "Detect code injection" },
                { name: "windows.netscan", desc: "Network connections" },
              ].map((plugin) => (
                <div key={plugin.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{plugin.name}</p>
                    <p className="text-[10px] text-gray-500">{plugin.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-blue-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          {scanning ? (
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                <Cpu className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Forensics Engine Running</h3>
              <p className="text-gray-500 max-w-sm">We are currently parsing the memory dump using Volatility 3. This may take a few moments depending on the image size.</p>
            </div>
          ) : results ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Summary Card */}
              <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Scan Results: {results.plugin}</h3>
                  </div>
                  <div className="px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{results.threatsFound} Threats Found</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        <th className="pb-4 px-4">PID</th>
                        <th className="pb-4 px-4">Process Name</th>
                        <th className="pb-4 px-4">PPID</th>
                        <th className="pb-4 px-4">Threads</th>
                        <th className="pb-4 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {results.results.map((proc: any) => (
                        <tr key={proc.pid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-4 text-gray-400 font-mono">{proc.pid}</td>
                          <td className="py-4 px-4 font-bold text-white">{proc.name}</td>
                          <td className="py-4 px-4 text-gray-400 font-mono">{proc.ppid}</td>
                          <td className="py-4 px-4 text-gray-400">{proc.threads}</td>
                          <td className="py-4 px-4">
                            {proc.name.includes("svch0st") || proc.name.includes("malware") ? (
                              <span className="flex items-center gap-2 text-red-500 font-bold text-xs">
                                <AlertCircle className="w-3 h-3" /> Suspicious
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-green-500 font-bold text-xs">
                                <CheckCircle2 className="w-3 h-3" /> Clean
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Analysis Card */}
              <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                {analyzing && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest">AI Engine Analyzing...</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white">AI Forensic Analysis</h3>
                </div>

                {aiAnalysis && (
                  <div className="space-y-8">
                    <div className="flex justify-end">
                      <button 
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    </div>
                    {/* Report Section */}
                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">Malware Forensic Report</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold">Malware Type:</span>
                          <span className="text-xs font-bold text-white">{aiAnalysis.malwareType}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Root Cause Analysis</p>
                          <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.rootCause}</p>
                        </div>
                        <div className="h-px bg-red-500/10" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Risk Score Assessment</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  aiAnalysis.riskScore > 70 ? "bg-red-500" : aiAnalysis.riskScore > 40 ? "bg-yellow-500" : "bg-green-500"
                                )} 
                                style={{ width: `${aiAnalysis.riskScore}%` }} 
                              />
                            </div>
                            <span className="text-sm font-bold text-white">{aiAnalysis.riskScore}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Threat Assessment</h4>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-white">{aiAnalysis.riskScore}</div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            aiAnalysis.threatLevel === "High" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                          )}>
                            {aiAnalysis.threatLevel} Risk
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{aiAnalysis.explanation}</p>
                      </div>

                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Attack Timeline</h4>
                        <div className="space-y-4">
                          {aiAnalysis.timeline.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-500">
                                {i + 1}
                              </div>
                              <p className="text-xs text-gray-300">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Recommended Response</h4>
                      <div className="flex flex-wrap gap-3">
                        {aiAnalysis.actions.map((action: string, i: number) => (
                          <div key={i} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-medium text-blue-400">
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center opacity-50">
              <div className="p-6 bg-white/5 rounded-full mb-6">
                <Terminal className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Scan Data</h3>
              <p className="text-gray-500 max-w-sm">Upload a memory dump or start a live scan to begin the forensics process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
