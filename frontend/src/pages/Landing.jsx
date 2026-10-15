import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Terminal, Shield, Code2, Users, Trophy, Key, Cpu, Lock, 
  ArrowRight, CheckCircle2, ChevronRight, Activity, Zap, Eye, Database
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-1 flex flex-col bg-forensic-950 font-sans text-slate-100 overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative py-16 sm:py-24 border-b border-forensic-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-forensic-950 to-forensic-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Top Status Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              ENIGMATRIX PLATFORM 2.0 • 80 FORENSIC CRIME CASES
            </span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-sans text-white leading-tight">
              Master Cyber Forensics <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-forensic-cyan via-teal-300 to-cyan-500">
                Through Production Code.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-sans max-w-3xl leading-relaxed">
              Step into the role of a digital forensic investigator. Analyze corrupted memory dumps, decode encrypted malware protocols, rebuild breached servers, and verify your code in isolated sandboxed judge workers.
            </p>
          </div>

          {/* Primary CTA Action Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2 font-mono">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm flex items-center gap-2.5 transition shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <span>Enlist Investigator Clearance</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/archive"
              className="px-6 py-3.5 rounded-xl bg-forensic-900 hover:bg-forensic-850 border border-forensic-750 text-slate-200 font-bold text-sm flex items-center gap-2 transition"
            >
              <span>Explore 80 Case Catalog</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </Link>

            <Link
              to="/login"
              className="px-5 py-3.5 rounded-xl bg-transparent hover:bg-forensic-900 text-slate-400 hover:text-white text-sm transition"
            >
              Sign In Existing Agent →
            </Link>
          </div>

          {/* Live Telemetry / Grid Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-forensic-800/80 font-mono">
            <div className="p-4 rounded-xl bg-forensic-900/60 border border-forensic-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 block">80</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Sealed Crime Dossiers</span>
            </div>
            <div className="p-4 rounded-xl bg-forensic-900/60 border border-forensic-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-white block">3</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Sandboxed Runtimes (Py, C++, C)</span>
            </div>
            <div className="p-4 rounded-xl bg-forensic-900/60 border border-forensic-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 block">&lt; 100ms</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">RLIMIT Isolated Execution</span>
            </div>
            <div className="p-4 rounded-xl bg-forensic-900/60 border border-forensic-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 block">100%</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Anti-Cheat Clipboard Guard</span>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE FORENSIC TERMINAL PREVIEW */}
      <section className="py-16 bg-forensic-900/40 border-b border-forensic-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-forensic-cyan tracking-widest font-bold block mb-1">
                LIVE INVESTIGATION SIMULATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                How Enigmatrix Challenges Work
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md font-sans">
              Each case provides real forensic context. Read the incident report, write analytical code, and pass automated judge vectors.
            </p>
          </div>

          <div className="bg-forensic-950 border border-forensic-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
            {/* Terminal Window Bar */}
            <div className="bg-forensic-900 px-4 py-3 border-b border-forensic-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-slate-400 font-bold ml-2">case-01-the-dead-server.py — Python 3.14</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold">
                VERDICT: ACCEPTED (0.012s)
              </span>
            </div>

            {/* Simulated Code & Execution Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-forensic-800">
              {/* Code Pane */}
              <div className="p-4 sm:p-6 bg-[#161b22] text-slate-300 space-y-2 overflow-x-auto">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Investigator Source Code</span>
                <pre className="text-emerald-300 leading-relaxed">
{`import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    # Parse corrupted forensic log entries
    anomalies = [line for line in lines if "CRITICAL_AUTH_FAIL" in line]
    print(f"ANOMALY_COUNT:{len(anomalies)}")

if __name__ == "__main__":
    solve()`}
                </pre>
              </div>

              {/* Execution Output Pane */}
              <div className="p-4 sm:p-6 bg-forensic-950 space-y-4">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Automated Judge Sandbox Output</span>
                
                <div className="space-y-2 text-[11px]">
                  <div className="p-3 rounded bg-forensic-900 border border-forensic-800 text-slate-300">
                    <span className="text-slate-500 block text-[10px] uppercase">Input Evidence Stream:</span>
                    <code>2026-10-15 03:12:00 [AUTH] CRITICAL_AUTH_FAIL user=admin ip=10.0.4.12</code>
                  </div>

                  <div className="p-3 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-200">
                    <span className="text-cyan-400 block text-[10px] uppercase">Judged Output:</span>
                    <code className="text-cyan-300 font-bold">ANOMALY_COUNT:1</code>
                  </div>

                  <div className="p-3 rounded bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 block text-[10px] uppercase font-bold">Evidence Token Issued</span>
                      <code className="text-emerald-300">TOKEN-EVD-DEAD-SERVER-9821</code>
                    </div>
                    <Key className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="py-16 border-b border-forensic-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase text-forensic-cyan tracking-widest font-bold">
              BUILT FOR CYBER FORENSICS & CONTEST COMPETITION
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Run High-Stakes Programming Events
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-cyan-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">80 Progressive Forensic Cases</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Carefully crafted cyber investigations spanning memory forensics, packet disassembly, cryptographic breaking, and incident response.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-cyan-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Squad Room & Team Challenge</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Commission an operative squad, share unique cryptographic invitation tokens, and solve challenges together with synchronized team progress.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-cyan-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">DMOJ Sandboxed Compiler</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Native POSIX sandboxing with RLIMIT_CPU, RLIMIT_AS, and memory constraints. Automated test verification with sub-100ms response times.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-red-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Anti-Cheat Clipboard Lockdown</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Strict administrative lockdown. Intercepts Ctrl+C, Ctrl+V, Ctrl+Shift+C/V, context menus, and browser extension injection.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-amber-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Live Competitive Leaderboard</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Real-time squad standings and individual operative rankings. Top-3 Gold/Silver/Bronze podiums with automatic 15-second polling.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-forensic-900 border border-forensic-800 hover:border-teal-500/40 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Cryptographic Evidence Vault</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Every solved challenge yields a tamper-proof evidence token stored in your personal vault, chaining up to solve the final Case 80 mystery.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-b from-forensic-950 to-forensic-900 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
            Ready to Investigate?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Begin with Case 01: "The Dead Server" or assemble your squad in the Squad Room. Free and open access for students, researchers, and competitive coders.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-xl shadow-cyan-500/20 transition flex items-center gap-2"
            >
              <span>Enlist Clearance Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-bold text-sm transition"
            >
              Sign In Existing Agent
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-forensic-800 py-8 bg-forensic-950 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-forensic-cyan" />
            <span className="font-bold text-slate-400">ENIGMATRIX FORENSICS</span>
            <span>• 80 Investigational Crime Problems</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/archive" className="hover:text-cyan-400 transition">Cases</Link>
            <Link to="/leaderboard" className="hover:text-cyan-400 transition">Leaderboard</Link>
            <Link to="/login" className="hover:text-cyan-400 transition">Investigator Login</Link>
            <Link to="/register" className="hover:text-cyan-400 transition">Enlist</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
