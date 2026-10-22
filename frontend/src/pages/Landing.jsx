import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Terminal, Zap, Code2, Cpu, Trophy, 
  ArrowRight, CheckCircle2, Lock, Flame, Laptop, Database
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 border-b border-slate-800/60">
        {/* Ambient Glow & Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 text-xs font-mono font-medium tracking-wide mb-8 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>OPERATIONAL // CYBERANZEN ARENA ONLINE</span>
          </div>

          {/* Slogan */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-mono leading-tight">
            THE ARENA IS OPEN.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              THINK YOU CAN BREAK IT?
            </span><br />
            PROVE IT.
          </h1>

          {/* Supporting Message */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 font-sans font-normal leading-relaxed">
            Investigate the evidence. Solve the challenge. Write the exploit. Master the code. Climb the leaderboard.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-16">
            <Link
              to="/register"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span>Accept the Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/arena"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 transition-all duration-200"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Explore Challenges</span>
            </Link>

            <Link
              to="/events"
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>View Competitions</span>
            </Link>

            <Link
              to="/arena?tab=dsa"
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl font-medium text-slate-300 hover:text-emerald-400 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 transition-colors"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Learn and Practice</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center space-x-1.5 px-4 py-3.5 rounded-xl font-medium text-slate-400 hover:text-cyan-400 transition-colors text-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/60 font-mono text-left">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">EXECUTION ENGINE</span>
              <span className="text-xl font-bold text-white">C11 | C++17 | Py3</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">INTERACTIVE LABS</span>
              <span className="text-xl font-bold text-cyan-400">Docker Isolated</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">COMPETITION MODE</span>
              <span className="text-xl font-bold text-emerald-400">Squad & Solo</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-1">ANTI-CHEAT LOCKDOWN</span>
              <span className="text-xl font-bold text-amber-400">Exam Guard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
            ADVANCED ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
            ENGINEERED FOR MODERN FORENSICS & CODE
          </h2>
          <p className="mt-4 text-slate-400">
            A battle-tested platform blending cybersecurity CTF operations, kernel sandboxing, dynamic testing, and competitive programming.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">Multi-Category CTF Arena</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Explore web exploits, cryptography, digital forensics, reverse engineering, binary exploitation, network analysis, and OSINT challenges.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Static & Dynamic Flag Engines</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Secure Attachment Manager</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">On-Demand Docker Labs</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Spin up dedicated, isolated container environments per cadet or squad with dynamic port allocation, automated timeout reapers, and zero host exposure.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unique ephemeral access ports</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Non-root & capability drops</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">Sandboxed Code Judge</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Execute C, C++, and Python 3 submissions under strict Linux kernel resource limits (`setrlimit`). Evaluates public samples and confidential hidden test suites.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>CPU, memory, & process ceilings</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Dynamic question parameter generator</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>CyberAnzen Arena — Digital Forensics & Competitive Programming</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/arena" className="hover:text-cyan-400 transition-colors">Challenges</Link>
            <Link to="/events" className="hover:text-cyan-400 transition-colors">Competitions</Link>
            <Link to="/leaderboard" className="hover:text-cyan-400 transition-colors">Standings</Link>
            <Link to="/login" className="hover:text-cyan-400 transition-colors">Cadet Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
