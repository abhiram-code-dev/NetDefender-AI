import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  History, 
  Search, 
  Cpu, 
  FileSearch, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  ChevronDown,
  Zap,
  Trash2,
  Download
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function ScanHistory() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "scans"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scanData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setScans(scanData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, "scans", deletingId));
      toast.success("Scan result deleted.");
    } catch (error) {
      toast.error("Failed to delete scan result.");
    } finally {
      setDeletingId(null);
    }
  };

  const downloadReport = (scan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const report = `
NETDEFENDER AI - FORENSIC REPORT
================================
Scan ID: ${scan.id}
Timestamp: ${new Date(scan.timestamp).toLocaleString()}
Scan Type: ${scan.type.toUpperCase()}
Status: ${scan.status.toUpperCase()}
Risk Score: ${scan.riskScore}/100
Malware Type: ${scan.aiAnalysis?.malwareType || "N/A"}

AI ANALYSIS SUMMARY:
-------------------
${scan.aiAnalysis?.explanation || "No AI analysis available."}

ROOT CAUSE:
----------
${scan.aiAnalysis?.rootCause || "N/A"}

RECOMMENDED ACTIONS:
-------------------
${scan.aiAnalysis?.actions?.map((a: string) => `- ${a}`).join("\n") || "N/A"}

TECHNICAL DETAILS:
-----------------
${JSON.stringify(scan.details, null, 2)}
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NetDefender_Report_${scan.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully.");
  };

  const filteredScans = scans.filter(scan => 
    scan.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (scan.aiAnalysis && scan.aiAnalysis.explanation?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Scan History</h1>
          <p className="text-gray-400">Review past forensics and file analysis results.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-xl py-3 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Scan?</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading history...</p>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-20 text-center">
          <div className="inline-flex p-6 bg-white/5 rounded-full mb-6">
            <History className="w-12 h-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Scans Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">You haven't performed any scans yet or no results match your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">
            <div className="col-span-4">Scan Details</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Malware Type</div>
            <div className="col-span-2">Risk Score</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredScans.map((scan) => (
            <div 
              key={scan.id}
              className={cn(
                "bg-[#111111] border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10",
                expandedId === scan.id && "border-blue-500/30 ring-1 ring-blue-500/20"
              )}
            >
              <div 
                onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                className="p-6 flex flex-col md:grid md:grid-cols-12 gap-4 items-center cursor-pointer group"
              >
                {/* Scan Details */}
                <div className="col-span-4 flex items-center gap-4 w-full">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0",
                    scan.type === "memory" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {scan.type === "memory" ? <Cpu className="w-5 h-5" /> : <FileSearch className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white capitalize truncate">{scan.type} Scan</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      <Calendar className="w-3 h-3" />
                      {new Date(scan.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 w-full md:w-auto">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block",
                    scan.status === "malicious" ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                    scan.status === "suspicious" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : 
                    "bg-green-500/10 text-green-500 border border-green-500/20"
                  )}>
                    {scan.status}
                  </span>
                </div>

                {/* Malware Type */}
                <div className="col-span-2 w-full md:w-auto">
                  {scan.aiAnalysis?.malwareType ? (
                    <span className="text-xs font-medium text-blue-400">
                      {scan.aiAnalysis.malwareType}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600 italic">N/A</span>
                  )}
                </div>

                {/* Risk Score */}
                <div className="col-span-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          (scan.riskScore || scan.aiAnalysis?.riskScore || 0) > 70 ? "bg-red-500" : 
                          (scan.riskScore || scan.aiAnalysis?.riskScore || 0) > 30 ? "bg-yellow-500" : 
                          "bg-green-500"
                        )}
                        style={{ width: `${scan.riskScore || scan.aiAnalysis?.riskScore || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white/50">{scan.riskScore || scan.aiAnalysis?.riskScore || 0}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2 w-full md:w-auto">
                  <button 
                    onClick={(e) => downloadReport(scan, e)}
                    className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(scan.id, e)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                    title="Delete Result"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-gray-500 group-hover:text-white transition-colors">
                    {expandedId === scan.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === scan.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-white/[0.02]"
                  >
                    <div className="p-8 space-y-8">
                      {/* AI Analysis Section */}
                      {scan.aiAnalysis && (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Zap className="w-4 h-4 text-blue-500" />
                            </div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">AI Forensic Summary</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Explanation</h5>
                              <div className="text-sm text-gray-300 leading-relaxed markdown-body">
                                <ReactMarkdown>{scan.aiAnalysis.explanation}</ReactMarkdown>
                              </div>
                            </div>
                            <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                              <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Recommended Actions</h5>
                              <ul className="space-y-2">
                                {scan.aiAnalysis.actions?.map((action: string, i: number) => (
                                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Raw Data / Details Section */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Technical Details</h4>
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 overflow-x-auto">
                          <pre className="text-xs text-blue-400 font-mono">
                            {JSON.stringify(scan.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
