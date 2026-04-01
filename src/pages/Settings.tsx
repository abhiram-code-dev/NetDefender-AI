import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Globe, 
  Lock,
  Save,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function Settings() {
  const user = auth.currentUser;
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [displayName, setDisplayName] = useState(user?.displayName || "");

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "settings", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDarkMode(data.darkMode ?? true);
          setNotifications(data.notifications ?? true);
          setAutoScan(data.autoScan ?? false);
          setTwoFactor(data.twoFactor ?? true);
          setDisplayName(data.displayName ?? user.displayName ?? "");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", user.uid), {
        darkMode,
        notifications,
        autoScan,
        twoFactor,
        displayName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { name: "Profile", icon: UserIcon },
    { name: "Notifications", icon: Bell },
    { name: "Security", icon: Shield },
    { name: "Appearance", icon: Moon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and security configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {tabs.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === item.name ? "bg-blue-500/10 text-blue-500" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-8">
          {activeTab === "Profile" && (
            <section className="bg-[#111111] border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-500" />
                Account Profile
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <img 
                    src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                    className="w-20 h-20 rounded-full border-2 border-white/10 shadow-xl" 
                    alt="Profile" 
                  />
                  <div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
                      Change Avatar
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold">Max size: 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ""} 
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Notifications" && (
            <section className="bg-[#111111] border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Notification Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Real-time Alerts</p>
                    <p className="text-xs text-gray-500">Get instant notifications for critical threats</p>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      notifications ? "bg-blue-500" : "bg-gray-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      notifications ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Email Reports</p>
                    <p className="text-xs text-gray-500">Weekly summary of security incidents</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-700 relative">
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Appearance" && (
            <section className="bg-[#111111] border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Sun className="w-5 h-5 text-blue-500" />
                Interface Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Dark Mode</p>
                    <p className="text-xs text-gray-500">Use high-contrast dark theme</p>
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      darkMode ? "bg-blue-500" : "bg-gray-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      darkMode ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Security" && (
            <section className="bg-[#111111] border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                Security & Privacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Secure your account with 2FA</p>
                  </div>
                  <button 
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      twoFactor ? "bg-green-500" : "bg-gray-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      twoFactor ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <button 
                  onClick={() => toast.info("API Key management is coming soon in the next update.")}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="text-sm font-bold text-white">Manage API Keys</span>
                  <Globe className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            </section>
          )}

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
