import { useState } from "react";
import { motion } from "motion/react";
import { 
  FileSearch, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Folder,
  File,
  Search,
  Zap,
  Download
} from "lucide-react";
import { cn } from "../lib/utils";
import { analyzeThreat } from "../services/gemini";
import { toast } from "sonner";

import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function FileScan() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const downloadReport = () => {
    if (!aiAnalysis) return;
    const report = `
NETDEFENDER AI - FILE FORENSIC REPORT
=====================================
Timestamp: ${new Date().toLocaleString()}
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
    a.download = `NetDefender_File_Report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully.");
  };

  const startScan = async () => {
    setScanning(true);
    setResults(null);
    setAiAnalysis(null);

    setTimeout(async () => {
      try {
        const response = await fetch("/api/scan/files", { method: "POST" });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText || "Empty response"}`);
        }

        const data = await response.json();
        setResults(data);
        setScanning(false);
        
        setAnalyzing(true);
        const analysis = await analyzeThreat(data);
        setAiAnalysis(analysis);
        setAnalyzing(false);

        // Save to Firestore
        if (auth.currentUser) {
          await addDoc(collection(db, "scans"), {
            userId: auth.currentUser.uid,
            timestamp: new Date().toISOString(),
            type: "file",
            status: data.maliciousCount > 0 ? "malicious" : "clean",
            details: data,
            aiAnalysis: analysis,
            riskScore: analysis.riskScore
          });
        }
      } catch (error) {
        toast.error("File scan failed. Please try again.");
        console.error(error);
        setScanning(false);
        setAnalyzing(false);
      }
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">File System Scanner</h1>
          <p className="text-gray-400">Scan critical system paths and detect malicious executables.</p>
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
          {scanning ? "Scanning Files..." : "Start System Scan"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Card */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 h-fit">
          <h3 className="text-lg font-bold text-white mb-6">Scan Settings</h3>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target Paths</h4>
              {[
                { name: "System32", path: "C:\\Windows\\System32", active: true },
                { name: "Downloads", path: "C:\\Users\\Admin\\Downloads", active: true },
                { name: "Temp", path: "C:\\Windows\\Temp", active: false },
              ].map((path) => (
                <div key={path.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs font-bold text-white">{path.name}</p>
                      <p className="text-[10px] text-gray-500">{path.path}</p>
                    </div>
                  </div>
                  <input type="checkbox" defaultChecked={path.active} className="accent-blue-500" />
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <Zap className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-widest">YARA Engine</p>
              </div>
              <p className="text-[10px] text-gray-400">YARA rules will be applied to all scanned executables for signature-based detection.</p>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-8">
          {scanning ? (
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
                <FileSearch className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Scanning System Files</h3>
              <p className="text-gray-500 max-w-sm">We are hashing and analyzing executable files in the selected paths. This process includes signature matching and behavioral heuristics.</p>
            </div>
          ) : results ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <File className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Scan Results</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scanned</p>
                      <p className="text-lg font-bold text-white">{results.scannedCount}</p>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-right">
                      <p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Malicious</p>
                      <p className="text-lg font-bold text-red-500">{results.maliciousCount}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {results.results.map((file: any, i: number) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg",
                          file.status === "malicious" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                        )}>
                          {file.status === "malicious" ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{file.path}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            <Hash className="w-3 h-3" />
                            <span className="truncate">{file.hash}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          file.status === "malicious" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                        )}>
                          {file.status}
                        </span>
                        {file.status === "malicious" && (
                          <button className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors">
                            Quarantine
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              {aiAnalysis && (
                <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white">AI Threat Intelligence</h3>
                    </div>
                    <button 
                      onClick={downloadReport}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download Report
                    </button>
                  </div>

                  {/* Report Section */}
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl mb-8">
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

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mb-8">
                    <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.explanation}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Risk Indicators</h4>
                      <ul className="space-y-3">
                        <li className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Known malware signature match (YARA)
                        </li>
                        <li className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Suspicious entropy in executable sections
                        </li>
                        <li className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Unsigned binary in System32 directory
                        </li>
                      </ul>
                    </div>
                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">Mitigation Steps</h4>
                      <div className="space-y-2">
                        {aiAnalysis.actions.map((action: string, i: number) => (
                          <div key={i} className="text-xs text-gray-300 flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center opacity-50">
              <div className="p-6 bg-white/5 rounded-full mb-6">
                <Folder className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Scan Data</h3>
              <p className="text-gray-500 max-w-sm">Select target paths and start a system scan to detect malicious files.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
