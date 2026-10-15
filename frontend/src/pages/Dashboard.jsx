import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Award, Terminal, CheckCircle2, ArrowRight, Key, AlertCircle } from 'lucide-react';
import { platformService, caseService, evidenceService, submissionService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [recentSubs, setRecentSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, tokenData, subData] = await Promise.all([
          platformService.getStats(),
          evidenceService.getTokens(),
          submissionService.getSubmissions()
        ]);
        setStats(statsData);
        setTokens(tokenData);
        setRecentSubs(subData.slice(0, 6));
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
