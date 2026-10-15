import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, Shield, Award, Terminal, CheckCircle2, ArrowRight, 
  Key, Users, Trophy, UserPlus, Lock, AlertTriangle, UserX, 
  Cpu, GitBranch, RefreshCw, Eye, ShieldAlert, Check
} from 'lucide-react';
import { platformService, caseService, evidenceService, submissionService, teamService, adminService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function Dashboard({ user }) {
  const isAdmin = user && user.role === 'admin';
  const [adminViewMode, setAdminViewMode] = useState(isAdmin); // Admin defaults to Command Deck view

  const [stats, setStats] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [recentSubs, setRecentSubs] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [teamRank, setTeamRank] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTeams, setAdminTeams] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const promises = [
          platformService.getStats(),
          evidenceService.getTokens(),
          submissionService.getSubmissions(),
          teamService.getMyTeam(),
          teamService.getTeamLeaderboard()
        ];

        if (isAdmin) {
          promises.push(adminService.listUsers().catch(() => []));
          promises.push(adminService.listTeams().catch(() => []));
          promises.push(adminService.getAuditLogs().catch(() => []));
        }

        const results = await Promise.allSettled(promises);

        if (results[0].status === 'fulfilled') setStats(results[0].value);
        if (results[1].status === 'fulfilled') setTokens(results[1].value);
        if (results[2].status === 'fulfilled') setRecentSubs(results[2].value.slice(0, 6));

        if (results[3].status === 'fulfilled' && results[3].value?.team) {
          const myTeam = results[3].value.team;
          setTeamData(myTeam);

          if (results[4].status === 'fulfilled' && results[4].value?.leaderboard) {
            const found = results[4].value.leaderboard.find(t => t.id === myTeam.id);
            if (found) setTeamRank(found.rank);
          }
        }

        if (isAdmin) {
          if (results[5]?.status === 'fulfilled') setAdminUsers(results[5].value || []);
          if (results[6]?.status === 'fulfilled') setAdminTeams(results[6].value || []);
          if (results[7]?.status === 'fulfilled') setAuditLogs((results[7].value || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <Activity className="w-5 h-5 animate-spin mr-3" />
        INITIALIZING FORENSIC TELEMETRY MATRIX...
      </div>
    );
  }

  const completedCount = tokens.length;
  const totalCount = stats?.total_cases || 80;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // ----------------------------------------------------------------------
  // RENDER 1: ADMINISTRATOR COMMAND DECK
  // ----------------------------------------------------------------------
  if (isAdmin && adminViewMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Admin Command Header Banner */}
        <div className="bg-gradient-to-r from-forensic-900 via-red-950/30 to-forensic-900 border border-red-500/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse"></span>
                <span className="text-xs font-mono uppercase text-red-300 tracking-wider font-bold">
                  CENTRAL ADMINISTRATOR COMMAND & CONTROL
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 border border-red-600 text-red-200">
                  SUPERUSER NODE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-wide">
                Enigmatrix Platform Deck — <span className="text-red-400">{user?.username}</span>
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl font-sans">
                Full supervisory clearance active. Manage registered participants, oversight 25+ squads, toggle judge workers, and execute authorized account deletions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
              <Link
                to="/admin"
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-red-950 transition"
              >
                <Lock className="w-4 h-4" />
                <span>Open Admin Deck</span>
              </Link>

              <button
                onClick={() => setAdminViewMode(false)}
                className="px-4 py-2.5 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-300 flex items-center gap-2 transition"
                title="Preview platform interface as a standard cadet investigator"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Cadet Grid View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Operational KPI Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          
          {/* Card 1: Registered Accounts */}
          <Link
            to="/admin"
            className="bg-forensic-900 border border-forensic-800 hover:border-red-500/60 p-5 rounded-xl transition group block shadow-md"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold group-hover:text-red-400 transition">User Directory</span>
              <UserX className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {adminUsers.length || stats?.total_users || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Inspect accounts & delete users</span>
              <ArrowRight className="w-3 h-3 text-red-400 group-hover:translate-x-1 transition" />
            </p>
          </Link>

          {/* Card 2: Active Competitive Squads */}
          <Link
            to="/admin"
            className="bg-forensic-900 border border-forensic-800 hover:border-cyan-500/60 p-5 rounded-xl transition group block shadow-md"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold group-hover:text-cyan-400 transition">Active Squads</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300">
              {adminTeams.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Rotate codes, scores & rosters</span>
              <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition" />
            </p>
          </Link>

          {/* Card 3: Judge Worker Pipeline */}
          <Link
            to="/admin"
            className="bg-forensic-900 border border-forensic-800 hover:border-emerald-500/60 p-5 rounded-xl transition group block shadow-md"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold group-hover:text-emerald-400 transition">Judge Worker Engine</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span>ONLINE</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">C11, C++17, Python 3 Sandboxes</p>
          </Link>

          {/* Card 4: Total Submissions Judged */}
          <Link
            to="/submissions"
            className="bg-forensic-900 border border-forensic-800 hover:border-amber-500/60 p-5 rounded-xl transition group block shadow-md"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold group-hover:text-amber-400 transition">Submissions Judged</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {stats?.total_submissions || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.total_accepted || 0} Verified Solves
            </p>
          </Link>

        </div>

        {/* Admin Operational Deck Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Direct Administrative Control Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Administrative Command Centers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              
              {/* Action 1: User Management & Deletion */}
              <Link
                to="/admin"
                className="p-5 rounded-xl bg-forensic-900 border border-slate-800 hover:border-red-500/50 hover:bg-forensic-850 transition group space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm group-hover:text-red-400 transition flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400" />
                    User Directory & Deletion
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-slate-400 text-xs">
                  Inspect participant and admin accounts, view squad ties, and permanently delete accounts with strict safety safeguards.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-red-400">
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 font-bold">
                    {adminUsers.length} Users Enlisted
                  </span>
                </div>
              </Link>

              {/* Action 2: Squad Control Deck */}
              <Link
                to="/admin"
                className="p-5 rounded-xl bg-forensic-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-forensic-850 transition group space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Squad Command & Rosters
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-slate-400 text-xs">
                  Oversee all 25+ squads, rotate compromised invitation tokens, adjust scores, remove members, or reassign ownership.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-cyan-400">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80 font-bold">
                    {adminTeams.length} Squads Active
                  </span>
                </div>
              </Link>

              {/* Action 3: Judge Controls & Anti-Cheat */}
              <Link
                to="/admin"
                className="p-5 rounded-xl bg-forensic-900 border border-slate-800 hover:border-amber-500/50 hover:bg-forensic-850 transition group space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm group-hover:text-amber-400 transition flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    Judge & Clipboard Anti-Cheat
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-slate-400 text-xs">
                  Batch toggle judge execution, lock down copy/paste shortcuts across all 80 problems, and inspect reference solutions.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-400">
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 font-bold">
                    80 Forensic Cases
                  </span>
                </div>
              </Link>

              {/* Action 4: Real-time Leaderboard */}
              <Link
                to="/leaderboard"
                className="p-5 rounded-xl bg-forensic-900 border border-slate-800 hover:border-purple-500/50 hover:bg-forensic-850 transition group space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm group-hover:text-purple-400 transition flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    Unified Leaderboard
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-slate-400 text-xs">
                  Inspect live squad and individual rankings, podium placements, clearance scores, and solve timestamps.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] text-purple-400">
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 font-bold">
                    Live Event Telemetry
                  </span>
                </div>
              </Link>

            </div>
          </div>

          {/* Right 1 Col: Recent Audit Stream */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
              <span className="font-bold text-white uppercase flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Recent Audit Trail
              </span>
              <Link to="/admin" className="text-cyan-400 text-[11px] hover:underline">
                View All
              </Link>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No recent administrative actions recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded bg-forensic-950 border border-forensic-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-300 text-[11px] uppercase">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER 2: STANDARD CADET / PARTICIPANT DASHBOARD
  // ----------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Terminal className="w-96 h-96 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">Investigative Node Online</span>
              {isAdmin && (
                <button
                  onClick={() => setAdminViewMode(true)}
                  className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-600 hover:bg-red-900 transition font-bold"
                >
                  Return to Admin Command Deck
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Case Operations Hub — <span className="text-forensic-cyan">{user?.username || 'Investigator'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-sans">
              80 connected cross-domain cases awaiting technical reconstruction. Submit algorithms in C, C++, or Python 3 to unlock forensic evidence tokens.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <Link
              to="/archive"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold tracking-wider flex items-center gap-2 transition shadow-lg shadow-cyan-950/40"
            >
              <span>Continue Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/vault"
              className="px-4 py-2.5 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 flex items-center gap-2 transition"
            >
              <Key className="w-4 h-4 text-forensic-cyan" />
              <span>Evidence Vault ({completedCount}/79)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Squad Status Widget */}
      {teamData ? (
        <div className="bg-forensic-900 border border-cyan-500/40 rounded-xl p-5 shadow-xl relative overflow-hidden font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Active Squad</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                    {teamData.user_role}
                  </span>
                  {teamRank && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                      <Trophy className="w-3 h-3" /> Rank #{teamRank}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">{teamData.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400">Operatives:</span>
                  {teamData.members?.map(m => (
                    <span key={m.user_id} className="text-xs px-2 py-0.5 rounded bg-forensic-850 border border-slate-700 text-slate-300">
                      {m.username} {m.role === 'OWNER' && '★'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 self-end md:self-center">
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Squad Score</div>
                  <div className="text-xl font-bold text-amber-400">{teamData.points} pts</div>
                </div>
                <div className="w-px h-8 bg-forensic-800 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">Solved</div>
                  <div className="text-xl font-bold text-emerald-400">{teamData.solved_count} <span className="text-xs text-slate-500">/ 80</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/team"
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Squad Room</span>
                </Link>
                <Link
                  to="/leaderboard"
                  className="px-4 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 text-slate-300 border border-slate-700 text-xs transition flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Leaderboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-forensic-900 border border-forensic-800 border-dashed rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Squad Status</div>
              <p className="text-sm text-slate-200 font-medium">No tactical squad joined yet</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Form a team with up to 4 operatives to pool clearance scores and conquer Case 80.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/team"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs tracking-wider transition shadow-md shadow-cyan-950/40"
            >
              Commission / Join Squad
            </Link>
            <Link
              to="/leaderboard"
              className="px-3.5 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 text-slate-300 border border-slate-700 text-xs transition"
            >
              Standings
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Total Cases */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase">Total Dossiers</span>
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">80</div>
          <p className="text-[11px] text-slate-500 mt-1">10 technical domains</p>
        </div>

        {/* Completed Cases */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase">Cases Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {completedCount} <span className="text-xs text-slate-500">/ 80</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase">Clearance Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {user?.points || 0} <span className="text-xs text-slate-500">/ {stats?.total_possible_points || 6350}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Scored via verified verdicts</p>
        </div>

        {/* Master Convergence Status */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase">Case 80 Convergence</span>
            <Key className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-400">
            {completedCount >= 79 ? 'READY TO CONVERGE' : `${79 - completedCount} TOKENS LEFT`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Feeds final master SHA-256</p>
        </div>

      </div>

      {/* Main Content Split: Domains & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-mono">
        
        {/* Left 2 Cols: Domain Breakdown */}
        <div className="lg:col-span-2 bg-forensic-900 border border-forensic-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-forensic-cyan" />
            Technical Domain Matrix
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats?.domain_distribution && Object.entries(stats.domain_distribution).map(([domain, count]) => (
              <Link
                key={domain}
                to={`/archive?domain=${encodeURIComponent(domain)}`}
                className="p-3.5 rounded-lg bg-forensic-850 border border-forensic-800 hover:border-cyan-500/40 hover:bg-forensic-800 transition flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs text-slate-300 group-hover:text-forensic-cyan transition font-medium block">
                    {domain}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {count} Case Files
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recent Submissions */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6">
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Telemetry
            </span>
            <Link to="/submissions" className="text-[11px] text-cyan-400 hover:underline">
              View All
            </Link>
          </h2>

          {recentSubs.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No recent submissions recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubs.map((sub) => (
                <div key={sub.id} className="p-3 rounded bg-forensic-850 border border-forensic-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">{sub.case_id}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{sub.language} • {sub.execution_time_ms}ms</span>
                  </div>
                  <VerdictBadge verdict={sub.verdict} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
