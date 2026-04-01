import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Search, ShieldAlert, MapPin, Server, ShieldCheck, ExternalLink, Info, Loader2, Ban, Plus, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { analyzeThreatIntel } from "../services/gemini";
import { toast } from "sonner";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function ThreatIntel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<any>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qFirewall = query(collection(db, "firewall_rules"), where("userId", "==", auth.currentUser.uid));
    const unsubscribeFirewall = onSnapshot(qFirewall, (snapshot) => {
      setBlockedIps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qWatchlist = query(collection(db, "watchlist"), where("userId", "==", auth.currentUser.uid));
    const unsubscribeWatchlist = onSnapshot(qWatchlist, (snapshot) => {
      setWatchlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeFirewall();
      unsubscribeWatchlist();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    setIntel(null);
    try {
      const result = await analyzeThreatIntel(searchQuery);
      setIntel(result);
    } catch (error) {
      toast.error("Failed to fetch threat intelligence. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!auth.currentUser || !intel) return;
    setPerformingAction(action);
    try {
      const collectionName = action === "Block IP on Firewall" ? "firewall_rules" : "watchlist";
      await addDoc(collection(db, collectionName), {
        userId: auth.currentUser.uid,
        target: searchQuery,
        type: intel.reputation,
        timestamp: new Date().toISOString(),
        action
      });
      toast.success(`${action} initiated successfully.`);
    } catch (error) {
      toast.error("Failed to perform action");
      console.error(error);
    } finally {
      setPerformingAction(null);
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Item removed.");
    } catch (error) {
      toast.error("Failed to remove item.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl mb-2">
          <Globe className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold text-white">Threat Intelligence</h1>
        <p className="text-gray-400 max-w-lg mx-auto">Lookup IP addresses, domains, and file hashes against our global threat intelligence database.</p>
      </div>

      <div className="relative group max-w-4xl mx-auto">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter IP, Domain, or SHA256 Hash..."
          className="w-full bg-[#111111] border border-white/10 rounded-2xl py-6 pl-16 pr-32 text-lg focus:outline-none focus:border-blue-500/50 transition-all shadow-2xl"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery}
          className="absolute right-3 top-3 bottom-3 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : "Lookup"}
        </button>
      </div>

      <AnimatePresence>
        {intel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-2xl">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white truncate max-w-[200px] md:max-w-none">{searchQuery}</h3>
                      <p className="text-sm text-gray-500 font-mono">{intel.org}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Risk Score</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      intel.riskScore > 70 ? "text-red-500" : intel.riskScore > 40 ? "text-yellow-500" : "text-green-500"
                    )}>{intel.riskScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Location</p>
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{intel.location}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reputation</p>
                    <div className={cn(
                      "flex items-center gap-2 font-bold",
                      intel.reputation.toLowerCase() === "malicious" ? "text-red-500" : 
                      intel.reputation.toLowerCase() === "suspicious" ? "text-yellow-500" : "text-green-500"
                    )}>
                      <ShieldAlert className="w-4 h-4" />
                      <span>{intel.reputation}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Last Seen</p>
                    <p className="text-sm text-white font-medium">{intel.lastSeen}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Infrastructure</p>
                    <div className="flex items-center gap-2 text-white">
                      <Server className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Cloud Hosting</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Associated Threats</p>
                  <div className="flex flex-wrap gap-2">
                    {intel.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Quick Actions
                  </h4>
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleAction("Block IP on Firewall")}
                      disabled={performingAction === "Block IP on Firewall"}
                      className="w-full py-3 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {performingAction === "Block IP on Firewall" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Block IP on Firewall
                    </button>
                    <button 
                      onClick={() => handleAction("Add to Watchlist")}
                      disabled={performingAction === "Add to Watchlist"}
                      className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {performingAction === "Add to Watchlist" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add to Watchlist
                    </button>
                    <button 
                      onClick={() => window.open(`https://www.virustotal.com/gui/search/${searchQuery}`, "_blank")}
                      className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      View on VirusTotal
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6">
                  <div className="flex items-center gap-2 text-blue-500 mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">AI Insight</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {intel.aiInsight}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Rules & Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Firewall Blocklist
          </h3>
          <div className="space-y-4">
            {blockedIps.length === 0 ? (
              <p className="text-sm text-gray-500">No active firewall rules.</p>
            ) : (
              blockedIps.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{rule.target}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Blocked on {new Date(rule.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteItem("firewall_rules", rule.id)} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            Threat Watchlist
          </h3>
          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <p className="text-sm text-gray-500">No items in watchlist.</p>
            ) : (
              watchlist.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">{item.target}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Added on {new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteItem("watchlist", item.id)} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

