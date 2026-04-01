import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import { logOut, db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, limit, setDoc, doc } from "firebase/firestore";
import { 
  Shield, 
  LayoutDashboard, 
  Cpu, 
  FileSearch, 
  Activity, 
  Globe, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Clock,
  Loader2,
  Wifi,
  Sun,
  Moon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  useEffect(() => {
    if (!user) return;

    // Listen for recent security events (simulated as notifications)
    const q = query(
      collection(db, "scans"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        title: `${doc.data().type === 'memory' ? 'Memory' : 'File'} Scan Complete`,
        message: `Status: ${doc.data().status}. Risk Score: ${doc.data().aiAnalysis?.riskScore || 0}%`,
        time: new Date(doc.data().timestamp).toLocaleTimeString(),
        unread: true
      }));
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [user]);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Memory Scan", path: "/memory", icon: Cpu },
    { name: "File Scan", path: "/files", icon: FileSearch },
    { name: "Network Scan", path: "/network", icon: Wifi },
    { name: "Scan History", path: "/history", icon: Clock },
    { name: "Threat Intel", path: "/intel", icon: Globe },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logOut();
    navigate("/login");
  };

  const toggleTheme = async () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    
    // Save to Firestore
    if (user) {
      try {
        await setDoc(doc(db, "settings", user.uid), { darkMode: !isDark }, { merge: true });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:relative w-72 h-full bg-[#111111] border-r border-white/5 flex flex-col z-50"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">NetDefender <span className="text-blue-500">AI</span></h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-blue-500/10 text-blue-500" 
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-blue-500" : "text-gray-400 group-hover:text-white")} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-10 h-10 rounded-full border border-white/10" alt="User" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-500 uppercase tracking-wider">System Secure</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Notifications</h4>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-blue-500 hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                            <p className="text-xs font-bold text-white mb-1">{n.title}</p>
                            <p className="text-[10px] text-gray-400 mb-2">{n.message}</p>
                            <p className="text-[8px] text-gray-600 uppercase font-bold">{n.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
