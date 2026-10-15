import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Award, Terminal, CheckCircle2, ArrowRight, Key, Users, Trophy, UserPlus } from 'lucide-react';
import { platformService, caseService, evidenceService, submissionService, teamService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [recentSubs, setRecentSubs] = useState([]);
  const [teamData, setTeamData] = useState(null);
  const [teamRank, setTeamRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, tokenData, subData, myTeamRes, leaderboardRes] = await Promise.allSettled([
          platformService.getStats(),
          evidenceService.getTokens(),
          submissionService.getSubmissions(),
          teamService.getMyTeam(),
          teamService.getTeamLeaderboard()
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (tokenData.status === 'fulfilled') setTokens(tokenData.value);
        if (subData.status === 'fulfilled') setRecentSubs(subData.value.slice(0, 6));

        if (myTeamRes.status === 'fulfilled' && myTeamRes.value?.team) {
          const myTeam = myTeamRes.value.team;
          setTeamData(myTeam);

          if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value?.leaderboard) {
            const found = leaderboardRes.value.leaderboard.find(t => t.id === myTeam.id);
            if (found) setTeamRank(found.rank);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-cyan-400">
        <Activity className="w-6 h-6 animate-spin mr-3" />
        INITIALIZING FORENSIC TELEMETRY...
      </div>
    );
  }

  const completedCount = tokens.length;
  const totalCount = stats?.total_cases || 80;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Terminal className="w-96 h-96 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">Investigative Node Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Case Operations Hub — <span className="text-forensic-cyan">{user?.username || 'Investigator'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-sans">
              80 connected cross-domain cases awaiting technical reconstruction. Submit algorithms in C, C++, or Python 3 to unlock forensic evidence tokens.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/archive"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-mono text-xs tracking-wider flex items-center gap-2 transition"
            >
              <span>Continue Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/vault"
              className="px-4 py-2.5 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition"
            >
              <Key className="w-4 h-4 text-forensic-cyan" />
              <span>Evidence Vault ({completedCount}/79)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Squad Status Widget */}
      {teamData ? (
        <div className="bg-forensic-900 border border-cyan-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Active Squad</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {teamData.user_role}
                  </span>
                  {teamRank && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                      <Trophy className="w-3 h-3" /> Rank #{teamRank}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white font-mono mt-0.5">{teamData.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400 font-mono">Operatives:</span>
                  {teamData.members?.map(m => (
                    <span key={m.user_id} className="text-xs font-mono px-2 py-0.5 rounded bg-forensic-850 border border-slate-700 text-slate-300">
                      {m.username} {m.role === 'OWNER' && '★'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 self-end md:self-center">
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Squad Score</div>
                  <div className="text-xl font-bold font-mono text-amber-400">{teamData.points} pts</div>
                </div>
                <div className="w-px h-8 bg-forensic-800 hidden sm:block"></div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Solved</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">{teamData.solved_count} <span className="text-xs text-slate-500">/ 80</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/team"
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Squad Room</span>
                </Link>
                <Link
                  to="/team-leaderboard"
                  className="px-4 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 text-slate-300 border border-slate-700 font-mono text-xs transition flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Leaderboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-forensic-900 border border-forensic-800 border-dashed rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Squad Status</div>
              <p className="text-sm text-slate-200 font-mono font-medium">No tactical squad joined yet</p>
              <p className="text-xs text-slate-500">Form a team with up to 4 operatives to pool clearance scores and conquer Case 80.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/team"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-mono text-xs tracking-wider transition"
            >
              Commission / Join Squad
            </Link>
            <Link
              to="/team-leaderboard"
              className="px-3 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 text-slate-300 border border-slate-700 font-mono text-xs transition"
            >
              Standings
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cases */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Total Dossiers</span>
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">80</div>
          <p className="text-[11px] text-slate-500 mt-1">10 technical domains</p>
        </div>

        {/* Completed Cases */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Cases Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {completedCount} <span className="text-xs text-slate-500">/ 80</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Clearance Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {user?.points || 0} <span className="text-xs text-slate-500">/ {stats?.total_possible_points || 6350}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Scored via verified verdicts</p>
        </div>

        {/* Master Convergence Status */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Case 80 Convergence</span>
            <Key className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-400">
            {completedCount >= 79 ? 'READY TO CONVERGE' : `${79 - completedCount} TOKENS LEFT`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Feeds final master SHA-256</p>
        </div>

      </div>

      {/* Main Content Split: Domains & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Domain Breakdown */}
        <div className="lg:col-span-2 bg-forensic-900 border border-forensic-800 rounded-xl p-6">
          <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider mb-4 flex items-center gap-2">
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
                  <span className="text-xs font-mono text-slate-300 group-hover:text-forensic-cyan transition font-medium block">
                    {domain}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
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
          <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Telemetry
            </span>
            <Link to="/submissions" className="text-[11px] text-cyan-400 hover:underline">
              View All
            </Link>
          </h2>

          {recentSubs.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 py-8 text-center">
              No recent submissions recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubs.map((sub) => (
                <div key={sub.id} className="p-3 rounded bg-forensic-850 border border-forensic-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-semibold text-white block">{sub.case_id}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{sub.language} • {sub.execution_time_ms}ms</span>
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
