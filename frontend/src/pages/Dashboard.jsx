import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Terminal, Trophy, Users, Award, 
  ArrowRight, Code2, Cpu, CheckCircle2, AlertOctagon 
} from 'lucide-react';
import { authService, teamService, leaderboardService } from '../services/api';

export default function Dashboard({ user }) {
  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamData, statsData] = await Promise.all([
        teamService.getMyTeam().catch(() => ({ has_team: false })),
        leaderboardService.getStats().catch(() => null)
      ]);
      if (teamData.has_team) {
        setTeam(teamData.team);
      }
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_right,_rgba(6,182,212,0.15),_transparent_70%)] pointer-events-none" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 text-xs font-mono font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>CLEARANCE: {user?.role?.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">
            GREETINGS, CADET {user?.username?.toUpperCase()}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            The CyberAnzen Arena is live. Advance your score, exploit target environments, and lead your squad to the top of the leaderboard.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/arena"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Enter Arena</span>
            </Link>
            <Link
              to="/team"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Squad Operations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">SCORE ACCUMULATED</span>
          <span className="text-2xl font-bold text-cyan-400">{user?.points || 0} PTS</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">ENLISTED SQUAD</span>
          <span className="text-2xl font-bold text-white truncate block">
            {team ? team.name : 'SOLO OPERATIVE'}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">ARENA TARGETS</span>
          <span className="text-2xl font-bold text-emerald-400">
            {stats ? stats.total_challenges : 0} AVAILABLE
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">GLOBAL SOLVES</span>
          <span className="text-2xl font-bold text-purple-400">
            {stats ? stats.total_solves : 0} CAPTURED
          </span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/arena?tab=ctf"
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono mb-2">CTF Challenges</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Exploit vulnerabilities, decode encrypted communications, and capture cryptographic flags.
          </p>
        </Link>

        <Link
          to="/arena?tab=dsa"
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono mb-2">DSA Judge</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Write high-performance algorithms in C, C++, or Python 3 against strict kernel sandboxes.
          </p>
        </Link>

        <Link
          to="/arena?tab=mcq"
          className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono mb-2">Knowledge Quizzes</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Test knowledge in network analysis, operating systems, Linux internals, and web defense.
          </p>
        </Link>
      </div>
    </div>
  );
}
