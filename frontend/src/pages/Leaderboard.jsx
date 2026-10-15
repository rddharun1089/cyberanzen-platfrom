import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Medal, Users, User, Search, RefreshCw, 
  Clock, Crown, Shield, ArrowRight, CheckCircle2, Award
} from 'lucide-react';
import { teamService, platformService } from '../services/api';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('squads'); // 'squads' | 'individuals'
  const [squads, setSquads] = useState([]);
  const [individuals, setIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    loadAllBoards();
    const interval = setInterval(loadAllBoards, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  async function loadAllBoards() {
    try {
      const [teamRes, indRes] = await Promise.allSettled([
        teamService.getTeamLeaderboard(),
        platformService.getLeaderboard()
      ]);
      if (teamRes.status === 'fulfilled') {
        setSquads(teamRes.value?.leaderboard || []);
      }
      if (indRes.status === 'fulfilled') {
        setIndividuals(indRes.value || []);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredSquads = squads.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toString().includes(searchQuery.trim())
  );

  const filteredIndividuals = individuals.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500 text-amber-300 font-bold text-xs shadow-md shadow-amber-950/40">
          <Medal className="w-3.5 h-3.5 text-amber-400" />
          #1 GOLD
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-400/20 border border-slate-300 text-slate-200 font-bold text-xs shadow-md">
          <Medal className="w-3.5 h-3.5 text-slate-300" />
          #2 SILVER
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-800/30 border border-amber-700 text-amber-200 font-bold text-xs shadow-md">
          <Medal className="w-3.5 h-3.5 text-amber-600" />
          #3 BRONZE
        </span>
      );
    }
    return (
      <span className="font-mono text-slate-400 text-xs font-semibold px-2">
        #{rank}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-semibold">Live Event Standings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wider flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              COMPETITIVE LEADERBOARD
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Authoritative ranking derived from verified sandboxed judge evaluations and unique forensic dossier solves.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 bg-forensic-950 px-3 py-1.5 rounded-lg border border-forensic-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Synced: {lastRefreshed.toLocaleTimeString()}
            </span>

            <button
              onClick={loadAllBoards}
              className="p-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-300 transition"
              title="Refresh standings now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <Link
              to="/team"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/40"
            >
              <Users className="w-4 h-4" />
              <span>Squad Deck</span>
            </Link>
          </div>
        </div>

        {/* Tab Switcher: Squads vs Individuals */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-forensic-800/80">
          <button
            onClick={() => { setActiveTab('squads'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'squads'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950'
                : 'bg-forensic-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Squad Standings ({squads.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('individuals'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'individuals'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-950'
                : 'bg-forensic-850 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Individual Operatives ({individuals.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'squads' ? "Filter squads by name or squad ID..." : "Filter operatives by callsign..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-forensic-900 border border-forensic-800 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="text-slate-500 text-xs font-mono">
          Showing {activeTab === 'squads' ? filteredSquads.length : filteredIndividuals.length} ranked contenders
        </div>
      </div>

      {/* TAB 1: SQUAD RANKINGS */}
      {activeTab === 'squads' && (
        <div className="space-y-6">
          
          {/* Top 3 Podium for Squads */}
          {squads.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {/* #2 Silver */}
              <div className="bg-forensic-900 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between space-y-3 order-2 md:order-1 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-300" />
                    2ND PLACE
                  </span>
                  <span className="text-[10px] text-slate-500">SQUAD #{squads[1].id}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{squads[1].name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{squads[1].members_count} Operatives • {squads[1].solved_count} Cases Solved</p>
                </div>
                <div className="text-right pt-2 border-t border-forensic-800">
                  <span className="text-2xl font-bold text-slate-200">{squads[1].points}</span>
                  <span className="text-xs text-slate-400 ml-1">PTS</span>
                </div>
              </div>

              {/* #1 Gold */}
              <div className="bg-gradient-to-b from-amber-950/40 via-forensic-900 to-forensic-900 border border-amber-500/60 rounded-xl p-5 flex flex-col justify-between space-y-3 order-1 md:order-2 relative overflow-hidden shadow-xl shadow-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-300 font-bold text-xs flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    #1 CHAMPION
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">SQUAD #{squads[0].id}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-300 truncate">{squads[0].name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{squads[0].members_count} Operatives • {squads[0].solved_count} Cases Solved</p>
                </div>
                <div className="text-right pt-2 border-t border-amber-900/40">
                  <span className="text-3xl font-bold text-amber-400">{squads[0].points}</span>
                  <span className="text-xs text-amber-300 ml-1">PTS</span>
                </div>
              </div>

              {/* #3 Bronze */}
              <div className="bg-forensic-900 border border-amber-900/40 rounded-xl p-5 flex flex-col justify-between space-y-3 order-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 font-bold text-xs flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-600" />
                    3RD PLACE
                  </span>
                  <span className="text-[10px] text-slate-500">SQUAD #{squads[2].id}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate">{squads[2].name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{squads[2].members_count} Operatives • {squads[2].solved_count} Cases Solved</p>
                </div>
                <div className="text-right pt-2 border-t border-forensic-800">
                  <span className="text-2xl font-bold text-amber-500">{squads[2].points}</span>
                  <span className="text-xs text-slate-400 ml-1">PTS</span>
                </div>
              </div>
            </div>
          )}

          {/* Squad Table */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden shadow-xl font-mono text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-24 text-center">Rank</th>
                    <th className="py-3 px-4">Squad Name & ID</th>
                    <th className="py-3 px-4 text-center">Roster Size</th>
                    <th className="py-3 px-4 text-center">Cases Solved</th>
                    <th className="py-3 px-4 text-right">Total Clearance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forensic-800">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-cyan-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        SYNCHRONIZING SQUAD STANDINGS...
                      </td>
                    </tr>
                  ) : filteredSquads.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500">
                        No squads found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSquads.map((team) => (
                      <tr 
                        key={team.id} 
                        className={`hover:bg-forensic-850/60 transition ${
                          team.rank <= 3 ? 'bg-forensic-850/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {getRankBadge(team.rank)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{team.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-forensic-950 border border-slate-700 text-slate-400">
                              #{team.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            {team.members_count} / 4
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-emerald-400 font-bold">{team.solved_count}</span>
                          <span className="text-slate-500 text-[11px]"> / 80</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-400 text-sm">
                          {team.points} <span className="text-xs text-slate-500 font-normal">PTS</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL OPERATIVES RANKINGS */}
      {activeTab === 'individuals' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden shadow-xl font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-24 text-center">Rank</th>
                  <th className="py-3 px-4">Operative Callsign</th>
                  <th className="py-3 px-4 text-center">Clearance Role</th>
                  <th className="py-3 px-4 text-center">Cases Solved</th>
                  <th className="py-3 px-4 text-right">Individual Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forensic-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-cyan-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      SYNCHRONIZING OPERATIVE STANDINGS...
                    </td>
                  </tr>
                ) : filteredIndividuals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No operatives found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredIndividuals.map((u) => (
                    <tr key={u.username} className="hover:bg-forensic-850/60 transition">
                      <td className="py-3.5 px-4 text-center">
                        {getRankBadge(u.rank)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-forensic-950 border border-slate-700 flex items-center justify-center text-forensic-cyan">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm">{u.username}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-400 font-bold">{u.cases_solved}</span>
                        <span className="text-slate-500 text-[11px]"> / 80</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400 text-sm">
                        {u.points} <span className="text-xs text-slate-500 font-normal">PTS</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
