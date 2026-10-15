import React, { useState, useEffect } from 'react';
import { Award, Trophy, Shield, CheckCircle2, User } from 'lucide-react';
import { platformService } from '../services/api';

export default function Leaderboard() {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBoard() {
      try {
        const data = await platformService.getLeaderboard();
        setRanks(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-forensic-800 pb-5">
        <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          INVESTIGATIVE LEADERBOARD & STANDINGS
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Ranked by total verified clearance points and solved case dossiers.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase">
            <tr>
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Investigator Callsign</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-center">Cases Solved</th>
              <th className="py-3 px-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forensic-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-cyan-400">
                  COMPUTING STANDINGS...
                </td>
              </tr>
            ) : ranks.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  No active investigators registered.
                </td>
              </tr>
            ) : (
              ranks.map((r) => {
                let rankBadge = `#${r.rank}`;
                if (r.rank === 1) rankBadge = '🥇 #1';
                else if (r.rank === 2) rankBadge = '🥈 #2';
                else if (r.rank === 3) rankBadge = '🥉 #3';

                return (
                  <tr key={r.username} className="hover:bg-forensic-850/60 transition">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      {rankBadge}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-forensic-950 border border-slate-700 flex items-center justify-center text-forensic-cyan">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>{r.username}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 capitalize">
                      {r.role}
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">
                      {r.cases_solved} / 80
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400 text-sm">
                      {r.points} PTS
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
