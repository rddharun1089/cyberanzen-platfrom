import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Terminal, Code2, HelpCircle, Search, Filter, 
  Cpu, Zap, Trophy, Shield, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { ctfService, dsaService, mcqService } from '../services/api';

export default function ChallengeArena() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'ctf'; // 'ctf' | 'dsa' | 'mcq'
  const [activeTab, setActiveTab] = useState(initialTab);

  const [ctfList, setCtfList] = useState([]);
  const [dsaList, setDsaList] = useState([]);
  const [mcqList, setMcqList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'ctf');
  }, [searchParams]);

  useEffect(() => {
    loadChallenges();
  }, [activeTab]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ctf') {
        const data = await ctfService.listChallenges();
        setCtfList(data);
      } else if (activeTab === 'dsa') {
        const data = await dsaService.listQuestions();
        setDsaList(data);
      } else if (activeTab === 'mcq') {
        const data = await mcqService.listMCQs();
        setMcqList(data);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filter logic
  const filteredCTF = ctfList.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = !difficultyFilter || c.difficulty === difficultyFilter;
    const matchesCat = !categoryFilter || c.category === categoryFilter;
    return matchesSearch && matchesDiff && matchesCat;
  });

  const filteredDSA = dsaList.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = !difficultyFilter || q.difficulty === difficultyFilter;
    const matchesCat = !categoryFilter || q.category === categoryFilter;
    return matchesSearch && matchesDiff && matchesCat;
  });

  const filteredMCQ = mcqList.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = !difficultyFilter || m.difficulty === difficultyFilter;
    const matchesCat = !categoryFilter || m.category === categoryFilter;
    return matchesSearch && matchesDiff && matchesCat;
  });

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      case 'Intermediate':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/80';
      case 'Advanced':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'Expert':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-mono flex items-center space-x-3">
            <Terminal className="w-8 h-8 text-cyan-400" />
            <span>CHALLENGE ARENA</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Solve cybersecurity exploitation targets, digital forensics puzzles, algorithms, and technical assessments.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => handleTabChange('ctf')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ctf'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>CTF Targets</span>
          </button>
          <button
            onClick={() => handleTabChange('dsa')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dsa'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>DSA Problems</span>
          </button>
          <button
            onClick={() => handleTabChange('mcq')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'mcq'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>MCQ Quizzes</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search challenges, keywords, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-sans transition-colors"
          />
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
        >
          <option value="">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      {/* Challenge Cards Grid */}
      {loading ? (
        <div className="py-20 text-center font-mono text-cyan-400 animate-pulse">
          Loading Arena Challenge Data...
        </div>
      ) : activeTab === 'ctf' ? (
        filteredCTF.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 p-8">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-mono text-white">No CTF challenges authored yet.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The challenge bank starts clean. Instructors and administrators can create CTF challenges via the Admin Studio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCTF.map(c => (
              <Link
                key={c.id}
                to={`/ctf/${c.slug || c.id}`}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 font-semibold border border-slate-700">
                      {c.category}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(c.difficulty)}`}>
                      {c.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors font-mono mb-2">
                    {c.title}
                  </h3>
                  {c.has_docker_lab && (
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-[10px] font-mono mb-4">
                      <Cpu className="w-3 h-3" />
                      <span>Interactive Docker Lab</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono mt-4">
                  <span className="text-cyan-400 font-bold">{c.points} PTS</span>
                  <span className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span>Infiltrate</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : activeTab === 'dsa' ? (
        filteredDSA.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 p-8">
            <Code2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-mono text-white">No DSA problems authored yet.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Question bank starts empty. Create DSA questions or generate validated dynamic instances through the Admin Studio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDSA.map(q => (
              <Link
                key={q.id}
                to={`/dsa/${q.slug || q.id}`}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {q.category}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors font-mono mb-2">
                    {q.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mb-4">
                    <span>Limits: {q.time_limit_ms}ms / {q.memory_limit_mb}MB</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono mt-4">
                  <span className="text-cyan-400 font-bold">{q.points} PTS</span>
                  <span className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span>Solve Code</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        filteredMCQ.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 p-8">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-mono text-white">No MCQ quizzes authored yet.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create multi-choice or single-choice technical questions via the Admin Studio.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMCQ.map(m => (
              <Link
                key={m.id}
                to={`/mcq/${m.id}`}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-slate-800 text-purple-400 font-semibold border border-slate-700">
                      {m.category}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(m.difficulty)}`}>
                      {m.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors font-mono mb-2 line-clamp-2">
                    {m.title}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono block mb-4">
                    {m.options?.length || 0} Options • {m.time_limit_sec}s Timer
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono mt-4">
                  <span className="text-emerald-400 font-bold">+{m.points_positive} PTS</span>
                  <span className="flex items-center space-x-1 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span>Take Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
