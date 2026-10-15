import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Medal, Users, FolderGit2, Search, RefreshCw, 
  Shield, Clock, ArrowRight, Zap, Award
} from 'lucide-react';
import { teamService } from '../services/api';

export default function TeamLeaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 15000); // Poll every 15s for live event leaderboard
    return () => clearInterval(interval);
  }, []);

  async function loadLeaderboard() {
    try {
      const data = await teamService.getTeamLeaderboard();
      setTeams(data.leaderboard || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load team leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toString().includes(searchQuery.trim())
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-300/20 border border-slate-300 text-slate-200 font-bold text-xs shadow-md">
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
      
      {/* Header */}
      <div className="border-b border-forensic-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold font-mono text-white tracking-wider">
              ENIGMATRIX SQUAD LEADERBOARD
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Official team rankings derived from verified sandboxed judge evaluations and unique challenge solves.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Live sync: {lastRefreshed.toLocaleTimeString()}
          </span>

          <button
            onClick={loadLeaderboard}
            className="p-2 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-300 transition"
            title="Refresh rankings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/team"
            className="px-3.5 py-2 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/30"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>My Squad Deck</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {teams.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          {/* #2 Silver */}
          <div className="bg-forensic-900/90 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden order-2 md:order-1">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-300" />
                2ND PLACE
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SQUAD #{teams[1].id}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate">{teams[1].name}</h3>
              <p className="text-xs text-slate-400 mt-1">{teams[1].members_count} Operatives • {teams[1].solved_count} Cases Solved</p>
            </div>
            <div className="text-right pt-2 border-t border-forensic-800">
              <span className="text-2xl font-bold text-slate-200">{teams[1].points}</span>
              <span className="text-xs text-slate-400 ml-1">PTS</span>
            </div>
          </div>

          {/* #1 Gold */}
          <div className="bg-gradient-to-b from-amber-950/40 via-forensic-900 to-forensic-900 border border-amber-500/60 rounded-xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden order-1 md:order-2 shadow-xl shadow-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-300 font-bold text-xs flex items-center gap-1 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                #1 CHAMPION
              </span>
              <span className="text-[10px] text-amber-400 font-mono">SQUAD #{teams[0].id}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-300 truncate">{teams[0].name}</h3>
              <p className="text-xs text-slate-300 mt-1">{teams[0].members_count} Operatives • {teams[0].solved_count} Cases Solved</p>
            </div>
            <div className="text-right pt-2 border-t border-amber-900/40">
              <span className="text-3xl font-bold text-amber-400">{teams[0].points}</span>
              <span className="text-xs text-amber-300 ml-1">PTS</span>
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="bg-forensic-900/90 border border-amber-800/40 rounded-xl p-5 flex flex-col justify-between space-y-3 relative overflow-hidden order-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold text-xs flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-amber-600" />
                3RD PLACE
              </span>
              <span className="text-[10px] text-slate-500 font-mono">SQUAD #{teams[2].id}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white truncate">{teams[2].name}</h3>
              <p className="text-xs text-slate-400 mt-1">{teams[2].members_count} Operatives • {teams[2].solved_count} Cases Solved</p>
            </div>
            <div className="text-right pt-2 border-t border-forensic-800">
              <span className="text-2xl font-bold text-amber-200">{teams[2].points}</span>
              <span className="text-xs text-slate-400 ml-1">PTS</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search squad by name or squad ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-forensic-950 border border-forensic-750 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="text-slate-400 text-xs">
          Registered Squads: <b className="text-cyan-400">{teams.length}</b> • Showing: <b className="text-white">{filteredTeams.length}</b>
        </div>
      </div>

      {/* Main Leaderboard Table / Cards */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden font-mono shadow-2xl">
        
        {loading ? (
          <div className="py-16 text-center text-cyan-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            SYNCHRONIZING SQUAD LEADERBOARD MATRIX...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No squads found matching query.</p>
            <p className="text-xs text-slate-600">Be the first to commission a squad and climb the leaderboard!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-28 text-center">Rank</th>
                  <th className="py-3 px-4">Squad Name</th>
                  <th className="py-3 px-4 text-center">Squad ID</th>
                  <th className="py-3 px-4 text-center">Operatives</th>
                  <th className="py-3 px-4 text-center">Solved</th>
                  <th className="py-3 px-4 text-right">Team Points</th>
                  <th className="py-3 px-4 text-right">Last Solve / Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forensic-800">
                {filteredTeams.map((t) => (
                  <tr 
                    key={t.id} 
                    className={`transition hover:bg-forensic-850/60 ${
                      t.rank === 1 ? 'bg-amber-950/15' : t.rank === 2 ? 'bg-slate-800/20' : t.rank === 3 ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {getRankBadge(t.rank)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      <span className="flex items-center gap-2">
                        {t.name}
                        {t.rank <= 3 && (
                          <Zap className={`w-3.5 h-3.5 ${
                            t.rank === 1 ? 'text-amber-400' : t.rank === 2 ? 'text-slate-300' : 'text-amber-600'
                          }`} />
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      #{t.id}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {t.members_count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                        {t.solved_count} / 80
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-base font-bold text-amber-400">
                        {t.points}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">PTS</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {t.last_activity ? new Date(t.last_activity).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

function Crown(props) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.203a4 4 0 0 1-3.86 2.928H8.713a4 4 0 0 1-3.86-2.928L2.018 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
      <path d="M5 21h14"/>
    </svg>
  );
}
