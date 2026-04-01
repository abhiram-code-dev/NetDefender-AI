import { useState } from "react";
import { signInWithGoogle } from "../firebase";
import { Shield, Lock, ArrowRight, Mail, Apple } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Email sign-in is currently disabled for security. Please use Google.");
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-[#111111] border border-white/10 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="p-4 bg-blue-500/10 rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NetDefender AI</h1>
          <p className="text-gray-400 text-sm">Autonomous Cyber Threat Detection & Response</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!showEmailForm ? (
              <motion.div
                key="social-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                      Sign in with Google
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
                >
                  <Mail className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  Sign in with Email
                </button>

                <button
                  onClick={() => setError("Apple sign-in is currently disabled for security. Please use Google.")}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
                >
                  <Apple className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  Sign in with Apple
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="email-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Back to social login
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 py-4">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Secure Access</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted session</span>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">
            By signing in, you agree to our <span className="text-gray-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-gray-400 hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
