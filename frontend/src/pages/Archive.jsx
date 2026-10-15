import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderGit2, Search, Filter, Shield, Award, CheckCircle2, ChevronRight, Key } from 'lucide-react';
import { caseService, evidenceService } from '../services/api';

export default function Archive() {
  const [cases, setCases] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const domainFilter = searchParams.get('domain') || '';
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCases() {
      try {
        const [caseList, userTokens] = await Promise.all([
          caseService.listCases(),
          evidenceService.getTokens().catch(() => [])
        ]);
        setCases(caseList);
        setTokens(userTokens);
      } catch (err) {
        console.error('Failed to load archive:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  const solvedCaseIds = new Set(tokens.map(t => t.case_id));

  const filteredCases = cases.filter(c => {
    if (domainFilter && c.domain !== domainFilter) return false;
    if (difficultyFilter && c.difficulty !== difficultyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      const matchDomain = c.domain.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDomain) return false;
    }
    return true;
  });

  const uniqueDomains = Array.from(new Set(cases.map(c => c.domain)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forensic-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-forensic-cyan" />
            INVESTIGATION ARCHIVE — 80 DOSSIERS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Access 80 independent crime investigations connected by evidence tokens.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded bg-forensic-850 border border-slate-700 text-slate-300">
            SOLVED: <span className="text-emerald-400 font-bold">{solvedCaseIds.size}</span> / 80
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-lg p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by case title, CASE-XX, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-forensic-950 border border-forensic-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Domain Filter */}
        <div className="w-full md:w-64">
          <select
            value={domainFilter}
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams({ domain: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            className="w-full px-3 py-2 bg-forensic-950 border border-forensic-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Technical Domains ({cases.length})</option>
            {uniqueDomains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="w-full md:w-44">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full px-3 py-2 bg-forensic-950 border border-forensic-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Difficulties</option>
            <option value="Beginner">Beginner (1-20)</option>
            <option value="Intermediate">Intermediate (21-50)</option>
            <option value="Advanced">Advanced (51-79)</option>
            <option value="Expert">Expert (Case 80)</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="text-center py-16 font-mono text-cyan-400 text-xs">
          FETCHING DOSSIERS...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 font-mono text-slate-500 text-xs bg-forensic-900 border border-forensic-800 rounded-lg">
          No matching investigation cases found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map(c => {
            const isSolved = solvedCaseIds.has(c.id);
            return (
              <Link
                key={c.id}
                to={`/cases/${c.id}`}
                className={`p-5 rounded-lg border transition flex flex-col justify-between group relative overflow-hidden ${
                  isSolved
                    ? 'bg-forensic-900/90 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-forensic-900 border-forensic-800 hover:border-cyan-500/50 hover:bg-forensic-850'
                }`}
              >
                <div>
                  {/* Top Bar: Case ID & Points */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-forensic-950 border border-forensic-800 text-forensic-cyan">
                      {c.id}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs text-amber-400 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      {c.points} PTS
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-base text-white group-hover:text-forensic-cyan transition mb-2">
                    {c.title}
                  </h3>

                  {/* Domain & Phase */}
                  <div className="space-y-1 mb-4">
                    <span className="inline-block text-[11px] font-mono text-slate-300 bg-forensic-950/80 px-2 py-0.5 rounded border border-slate-800">
                      {c.domain}
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 truncate">
                      {c.phase}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Languages, Difficulty & Status */}
                <div className="border-t border-forensic-800/80 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="px-1.5 py-0.5 bg-forensic-950 rounded">C/C++/Py3</span>
                    <span>•</span>
                    <span className="text-slate-300">{c.difficulty}</span>
                  </div>

                  {isSolved ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SOLVED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 group-hover:translate-x-1 transition">
                      Investigate <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
