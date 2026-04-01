import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Zap,
  TrendingUp,
  ShieldAlert,
  Monitor,
  Cpu as CpuIcon,
  HardDrive,
  Network
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "../lib/utils";

const data = [
  { name: "00:00", threats: 12, traffic: 45 },
  { name: "04:00", threats: 8, traffic: 32 },
  { name: "08:00", threats: 15, traffic: 88 },
  { name: "12:00", threats: 22, traffic: 120 },
  { name: "16:00", threats: 18, traffic: 95 },
  { name: "20:00", threats: 25, traffic: 110 },
  { name: "23:59", threats: 14, traffic: 65 },
];

const alerts = [
  { id: 1, type: "high", message: "Suspicious memory injection detected in svchost.exe", time: "2 mins ago", source: "Memory Forensics" },
  { id: 2, type: "medium", message: "Unauthorized file modification in /etc/hosts", time: "15 mins ago", source: "File Integrity" },
  { id: 3, type: "low", message: "New outbound connection to unknown IP: 185.23.44.12", time: "1 hour ago", source: "Network Monitor" },
];

const timeline = [
  { step: "Initial Access", desc: "Phishing email with malicious attachment", status: "completed" },
  { step: "Execution", desc: "User opened attachment, payload executed", status: "completed" },
  { step: "Persistence", desc: "Registry key modified for auto-start", status: "completed" },
  { step: "C2 Communication", desc: "Attempted connection to command server", status: "blocked" },
];

export default function Dashboard() {
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setRiskScore(24), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Risk Score" 
          value={riskScore} 
          suffix="/100"
          icon={ShieldAlert}
          color="text-yellow-500"
          bg="bg-yellow-500/10"
          trend="+4% from yesterday"
          trendUp={true}
        />
        <MetricCard 
          title="Active Threats" 
          value={3} 
          icon={AlertTriangle}
          color="text-red-500"
          bg="bg-red-500/10"
          trend="-2 from last hour"
          trendUp={false}
        />
        <MetricCard 
          title="System Health" 
          value={98} 
          suffix="%"
          icon={ShieldCheck}
          color="text-green-500"
          bg="bg-green-500/10"
          trend="Stable"
        />
        <MetricCard 
          title="Traffic Monitored" 
          value="1.2" 
          suffix="GB"
          icon={Activity}
          color="text-blue-500"
          bg="bg-blue-500/10"
          trend="+12% increase"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Device Information */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white">Device Information</h3>
          </div>
          <div className="space-y-6">
            <InfoItem icon={CpuIcon} label="Processor" value="Intel Core i9-13900K" />
            <InfoItem icon={Activity} label="Memory" value="64GB DDR5 6000MHz" />
            <InfoItem icon={HardDrive} label="Storage" value="2TB NVMe SSD (Gen4)" />
            <InfoItem icon={Network} label="Network" value="10GbE Ethernet / Wi-Fi 6E" />
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">
                <span>OS Version</span>
                <span className="text-blue-500">v24.04 LTS</span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-gray-500">
                <span>Kernel</span>
                <span className="text-blue-500">6.5.0-27-generic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Threat Activity</h3>
              <p className="text-sm text-gray-500">Real-time detection frequency over 24h</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-400">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-400">Threats</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff10", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="traffic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Alerts</h3>
            <button className="text-xs text-blue-500 hover:underline">View All</button>
          </div>
          <div className="space-y-4 flex-1">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    alert.type === "high" ? "bg-red-500/10 text-red-500" : 
                    alert.type === "medium" ? "bg-yellow-500/10 text-yellow-500" : 
                    "bg-blue-500/10 text-blue-500"
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-tight mb-1">{alert.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      <span>{alert.time}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700" />
                      <span>{alert.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attack Timeline */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-8">Attack Timeline</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/5" />
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-6 relative">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                  item.status === "completed" ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                )}>
                  {item.status === "completed" ? <ShieldCheck className="w-4 h-4" /> : <XAxis className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.step}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Explanation */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="w-32 h-32 text-blue-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Threat Analysis</h3>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <p className="text-gray-300 leading-relaxed">
                Our analysis indicates a <span className="text-yellow-500 font-bold">Medium-High</span> risk level. The detected activity follows a classic "Living off the Land" pattern, where legitimate system processes like <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-400">svchost.exe</code> are hijacked for malicious execution. This bypasses traditional signature-based detection.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Recommended Actions</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Isolate infected host
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Terminate suspicious PID 432
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Reset Admin credentials
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Detection Engine</h4>
                <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg mb-2">
                  <span className="text-xs text-green-500">YARA Rules</span>
                  <span className="text-[10px] font-bold text-green-500 uppercase">Passed</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
                  <span className="text-xs text-red-500">Behavioral AI</span>
                  <span className="text-[10px] font-bold text-red-500 uppercase">Alert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, suffix, icon: Icon, color, bg, trend, trendUp }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#111111] border border-white/5 rounded-3xl p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            trendUp === true ? "text-red-500" : trendUp === false ? "text-green-500" : "text-gray-500"
          )}>
            {trendUp === true ? <ArrowUpRight className="w-3 h-3" /> : trendUp === false ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-white/5 rounded-xl">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}
