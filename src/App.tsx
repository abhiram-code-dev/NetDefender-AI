import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MemoryScan from "./pages/MemoryScan";
import FileScan from "./pages/FileScan";
import ScanHistory from "./pages/ScanHistory";
import ThreatIntel from "./pages/ThreatIntel";
import NetworkScan from "./pages/NetworkScan";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Chatbot from "./components/Chatbot";
import { Toaster } from "sonner";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      document.documentElement.classList.add("dark");
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "settings", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const isDark = data.darkMode ?? true;
        if (isDark) {
          document.documentElement.classList.add("dark");
          setTheme("dark");
        } else {
          document.documentElement.classList.remove("dark");
          setTheme("light");
        }
      } else {
        document.documentElement.classList.add("dark");
        setTheme("dark");
      }
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              user ? (
                <Layout user={user}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/memory" element={<MemoryScan />} />
                    <Route path="/files" element={<FileScan />} />
                    <Route path="/history" element={<ScanHistory />} />
                    <Route path="/intel" element={<ThreatIntel />} />
                    <Route path="/network" element={<NetworkScan />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                  <Chatbot />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </div>
    </Router>
  );
}
