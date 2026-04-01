import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simulated Forensics API
  app.post("/api/scan/memory", (req, res) => {
    // Randomize threats for variety
    const threats = [
      { pid: 3456, name: "malware_payload.exe", ppid: 1204, threads: 2, handles: 15, session: 1, wow64: true, createTime: new Date().toISOString(), exitTime: "" },
      { pid: 5678, name: "miner.exe", ppid: 432, threads: 8, handles: 45, session: 0, wow64: false, createTime: new Date().toISOString(), exitTime: "" },
      { pid: 9012, name: "keylogger.exe", ppid: 120, threads: 1, handles: 10, session: 0, wow64: false, createTime: new Date().toISOString(), exitTime: "" }
    ];
    const selectedThreat = threats[Math.floor(Math.random() * threats.length)];

    const mockResults = [
      { pid: 432, name: "svch0st.exe", ppid: 120, threads: 12, handles: 450, session: 0, wow64: false, createTime: "2026-04-01 08:00:00", exitTime: "" },
      { pid: 1204, name: "explorer.exe", ppid: 432, threads: 24, handles: 1200, session: 1, wow64: false, createTime: "2026-04-01 08:05:00", exitTime: "" },
      selectedThreat
    ];
    res.json({
      plugin: "windows.pslist",
      results: mockResults,
      threatsFound: 1,
      summary: `Suspicious process '${selectedThreat.name}' detected in memory forensics.`
    });
  });

  app.post("/api/scan/files", (req, res) => {
    const maliciousFiles = [
      { path: "C:\\Users\\Admin\\Downloads\\invoice.exe", hash: "f295262728303030303030303030303030303030303030303030303030303030", status: "malicious" },
      { path: "C:\\Windows\\Temp\\update.vbs", hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2", status: "malicious" },
      { path: "C:\\Users\\Admin\\AppData\\Local\\Temp\\chrome_patch.exe", hash: "9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p3q2r1s0t9u8v7w6x5y4z3a2b1c0d9e8", status: "malicious" }
    ];
    const selectedMalicious = maliciousFiles[Math.floor(Math.random() * maliciousFiles.length)];

    const mockFiles = [
      { path: "C:\\Windows\\System32\\drivers\\etc\\hosts", hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", status: "clean" },
      selectedMalicious
    ];
    res.json({
      scannedCount: Math.floor(Math.random() * 200) + 100,
      maliciousCount: 1,
      results: mockFiles
    });
  });

  app.post("/api/scan/network", (req, res) => {
    const devices = [
      { name: "Main Gateway", ip: "192.168.1.1", mac: "00:1A:2B:3C:4D:5E", ports: [80, 443] },
      { name: "User Workstation", ip: "192.168.1.15", mac: "A1:B2:C3:D4:E5:F6", ports: [22, 3389] },
      { name: "IoT Smart Bulb", ip: "192.168.1.42", mac: "FF:EE:DD:CC:BB:AA", ports: [554, 8080] },
      { name: "Unknown Device", ip: "192.168.1.101", mac: "DE:AD:BE:EF:CA:FE", ports: [4444, 1337] }
    ];

    const traffic = [
      { protocol: "TCP", description: "Standard HTTPS traffic to known CDN", severity: "low" },
      { protocol: "UDP", description: "High-frequency DNS queries to unusual TLD", severity: "medium" },
      { protocol: "ICMP", description: "Network ping sweep detected from 192.168.1.101", severity: "high" },
      { protocol: "SSH", description: "Brute-force attempt on workstation (Port 22)", severity: "high" }
    ];

    res.json({ devices, traffic, timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
