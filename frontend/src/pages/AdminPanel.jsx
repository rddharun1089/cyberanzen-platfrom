import React, { useState, useEffect } from 'react';
import { 
  Shield, GitBranch, RefreshCw, CheckCircle2, AlertTriangle, Eye, Edit3, 
  Plus, Activity, Lock, Unlock, ShieldAlert, Database, Key, Code2, ChevronDown, ChevronUp, 
  Cpu, Sliders, Search, Check, X
} from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('solutions'); // 'solutions' | 'cases' | 'git' | 'health' | 'audit'
  const [cases, setCases] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [gitPreview, setGitPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Batch Operations Scope
  const [batchScope, setBatchScope] = useState('ALL');

  // Filtering for Solutions & Judge Control Tab
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSol, setExpandedSol] = useState({});
  const [expandedTests, setExpandedTests] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [caseList, solList, healthData, logs] = await Promise.all([
        adminService.listCases(),
        adminService.listSolutions().catch(() => []),
        adminService.getHealth().catch(() => null),
        adminService.getAuditLogs().catch(() => [])
      ]);
      setCases(caseList);
      setSolutions(solList);
      setHealth(healthData);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePublish = async (caseId, currentStatus) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await adminService.updateCase(caseId, { publication_status: newStatus });
      setCases(cases.map(c => c.id === caseId ? { ...c, publication_status: newStatus } : c));
      setSolutions(solutions.map(s => s.id === caseId ? { ...s, publication_status: newStatus } : s));
      setStatusMsg(`Updated ${caseId} status to ${newStatus}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Failed to update case: ' + err.message);
    }
  };

  const handleToggleJudge = async (caseId, currentVal) => {
    const nextVal = !currentVal;
    try {
      await adminService.updateCase(caseId, { judge_enabled: nextVal });
      setCases(cases.map(c => c.id === caseId ? { ...c, judge_enabled: nextVal } : c));
      setSolutions(solutions.map(s => s.id === caseId ? { ...s, judge_enabled: nextVal } : s));
      setStatusMsg(`Judge worker ${nextVal ? 'ENABLED' : 'DISABLED'} for ${caseId}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Failed to toggle judge: ' + err.message);
    }
  };

  const handleToggleReveal = async (caseId, currentVal) => {
    const nextVal = !currentVal;
    try {
      await adminService.updateCase(caseId, { reveal_failed_tests: nextVal });
      setCases(cases.map(c => c.id === caseId ? { ...c, reveal_failed_tests: nextVal } : c));
      setSolutions(solutions.map(s => s.id === caseId ? { ...s, reveal_failed_tests: nextVal } : s));
      setStatusMsg(`Practice test feedback ${nextVal ? 'ENABLED (Visible)' : 'DISABLED (Contest Mode)'} for ${caseId}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Failed to toggle feedback mode: ' + err.message);
    }
  };

  const handleToggleClipboard = async (caseId, currentVal) => {
    const nextVal = !currentVal;
    try {
      await adminService.updateCase(caseId, { allow_copy_paste: nextVal });
      setCases(cases.map(c => c.id === caseId ? { ...c, allow_copy_paste: nextVal } : c));
      setSolutions(solutions.map(s => s.id === caseId ? { ...s, allow_copy_paste: nextVal } : s));
      setStatusMsg(`Clipboard access ${nextVal ? 'ALLOWED' : 'LOCKED (Strict Anti-Cheat)'} for ${caseId}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Failed to toggle clipboard restriction: ' + err.message);
    }
  };

  const handleBatchJudge = async (domain, judgeEnabled, revealTests, allowCopyPaste) => {
    const domainText = domain === 'ALL' ? 'all cases' : `domain "${domain}"`;
    if (!window.confirm(`Apply settings to ${domainText}?`)) return;
    try {
      const payload = {
        domain: domain === 'ALL' ? null : domain,
        judge_enabled: judgeEnabled,
        reveal_failed_tests: revealTests,
        allow_copy_paste: allowCopyPaste
      };
      await adminService.batchJudgeToggle(payload);
      setStatusMsg(`Batch settings applied to ${domainText}`);
      setTimeout(() => setStatusMsg(''), 3000);
      loadAll();
    } catch (err) {
      alert('Batch update failed: ' + err.message);
    }
  };

  const handleGitPreview = async () => {
    try {
      const res = await adminService.gitPreview();
      setGitPreview(res);
    } catch (err) {
      alert('Git preview failed: ' + err.message);
    }
  };

  const handleGitSync = async () => {
    if (!window.confirm('Synchronize questions repository into database?')) return;
    try {
      const res = await adminService.gitSync();
      alert(`Synchronized successfully! Synced ${res.synced_cases} cases.`);
      loadAll();
    } catch (err) {
      alert('Git sync failed: ' + err.message);
    }
  };

  const toggleSolutionExpand = (id) => {
    setExpandedSol(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTestsExpand = (id) => {
    setExpandedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Unique domains
  const domains = ['ALL', ...Array.from(new Set((solutions.length ? solutions : cases).map(s => s.domain).filter(Boolean)))];

  const targetScopeCount = batchScope === 'ALL'
    ? (solutions.length || cases.length)
    : (solutions.filter(s => s.domain === batchScope).length || cases.filter(c => c.domain === batchScope).length);

  // Filtered solutions
  const filteredSolutions = solutions.filter(s => {
    const matchesDomain = selectedDomain === 'ALL' || s.domain === selectedDomain;
    const matchesSearch = !searchQuery || 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        INITIALIZING ENIGMATRIX COMMAND CLEARANCE TERMINAL...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-forensic-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-forensic-cyan" />
            ENIGMATRIX ADMINISTRATOR COMMAND TERMINAL
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Master answer keys & solutions vault, granular judge worker configuration, Git sync, and system telemetry.
          </p>
        </div>

        {statusMsg && (
          <div className="px-3.5 py-1.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            {statusMsg}
          </div>
        )}
      </div>

      {/* BATCH DOMAIN & ANTI-CHEAT OPERATIONS HUB (PERMANENTLY VISIBLE) */}
      <div className="bg-forensic-900 border border-forensic-750 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-forensic-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold font-mono text-white tracking-wide">
                BATCH DOMAIN & ANTI-CHEAT OPERATIONS HUB
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-600/60 text-amber-300">
                GLOBAL CONTROLS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              One-click batch operations for strict anti-cheat clipboard lockdown, sandboxed judge execution, and test feedback policies.
            </p>
          </div>

          {/* Scope Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-forensic-950 px-3.5 py-2 rounded-lg border border-forensic-800">
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">Target Scope:</span>
            <select
              value={batchScope}
              onChange={(e) => setBatchScope(e.target.value)}
              className="bg-forensic-900 text-forensic-cyan font-mono text-xs font-bold px-3 py-1.5 rounded border border-forensic-700 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">ALL (All {cases.length} Problems - Platform-wide Exam Lockdown)</option>
              {domains.filter(d => d !== 'ALL').map(d => (
                <option key={d} value={d}>
                  Domain: {d} ({cases.filter(c => c.domain === d).length} problems)
                </option>
              ))}
            </select>
            <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800 whitespace-nowrap">
              Affects: {targetScopeCount} Problems
            </span>
          </div>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
          
          {/* Card 1: Strict Anti-Cheat Clipboard Lockdown */}
          <div className="bg-forensic-950/90 border border-forensic-800 rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-red-900/50 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Lock className="w-3.5 h-3.5" />
                  1. Anti-Cheat: Clipboard Restriction
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-950 text-red-300 border border-red-800">
                  Exam Defense
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Strictly blocks Ctrl+C, Ctrl+V, Ctrl+Shift+C/V, right-click context menu, and browser extensions in Monaco editor.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchJudge(batchScope, null, null, false)}
                  className="px-3 py-2.5 rounded bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50"
                  title={`Lock clipboard for ${batchScope}`}
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Lock Clipboard</span>
                </button>
                <button
                  onClick={() => handleBatchJudge(batchScope, null, null, true)}
                  className="px-3 py-2.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                  title={`Allow clipboard for ${batchScope}`}
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Allow Clipboard</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 text-center font-mono">
                Scope: <span className="text-amber-400 font-bold">{batchScope === 'ALL' ? 'ALL 80 CASES' : batchScope}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Isolated Judge Worker Sandbox */}
          <div className="bg-forensic-950/90 border border-forensic-800 rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-emerald-900/50 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Cpu className="w-3.5 h-3.5" />
                  2. Judge Worker Execution
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Execution
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Toggle automated sandboxed code execution and test verification across selected domain problems.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchJudge(batchScope, true, null, null)}
                  className="px-3 py-2.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
                  title={`Enable judge worker for ${batchScope}`}
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enable Judge</span>
                </button>
                <button
                  onClick={() => handleBatchJudge(batchScope, false, null, null)}
                  className="px-3 py-2.5 rounded bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50"
                  title={`Disable judge worker for ${batchScope}`}
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                  <span>Disable Judge</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 text-center font-mono">
                Scope: <span className="text-amber-400 font-bold">{batchScope === 'ALL' ? 'ALL 80 CASES' : batchScope}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Feedback Mode (Practice vs Contest) */}
          <div className="bg-forensic-950/90 border border-forensic-800 rounded-lg p-4 flex flex-col justify-between space-y-3 hover:border-cyan-900/50 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5" />
                  3. Test Feedback Mode
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Transparency
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Practice Mode reveals failing test inputs/expected outputs; Contest Mode hides hidden tests.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBatchJudge(batchScope, null, true, null)}
                  className="px-3 py-2.5 rounded bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-600 text-cyan-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50"
                  title={`Enable Practice mode for ${batchScope}`}
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Practice Mode</span>
                </button>
                <button
                  onClick={() => handleBatchJudge(batchScope, null, false, null)}
                  className="px-3 py-2.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
                  title={`Enable Contest mode for ${batchScope}`}
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contest Mode</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 text-center font-mono">
                Scope: <span className="text-amber-400 font-bold">{batchScope === 'ALL' ? 'ALL 80 CASES' : batchScope}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-forensic-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('solutions')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'solutions' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Master Solutions & Judge Control ({solutions.length})
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'cases' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Case Catalog ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('git')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'git' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Git Importer
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'health' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Judge Telemetry
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'audit' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Master Solutions & Judge Control */}
      {activeTab === 'solutions' && (
        <div className="space-y-6">
          
          {/* Search, Filter & Stats Toolbar */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Search & Domain Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by ID, title, domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-forensic-950 border border-forensic-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 w-64"
                  />
                </div>

                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="px-3 py-2 bg-forensic-950 border border-forensic-800 rounded-lg text-forensic-cyan focus:outline-none focus:border-cyan-500 font-bold"
                >
                  {domains.map(d => (
                    <option key={d} value={d}>
                      Filter Domain: {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4">
                <span className="text-cyan-400 font-bold">Showing {filteredSolutions.length} of {solutions.length} cases</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Judge Enabled</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Practice Mode</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> Anti-Cheat Locked</span>
              </div>
            </div>
          </div>

          {/* Problem Cards List with Official Answers & Worker Controls */}
          <div className="space-y-4">
            {filteredSolutions.map((c) => (
              <div 
                key={c.id} 
                className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden transition font-mono"
              >
                {/* Case Top Bar */}
                <div className="p-4 bg-forensic-850/60 border-b border-forensic-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold text-xs">
                        {c.id}
                      </span>
                      <h3 className="text-sm font-bold text-white font-sans">{c.title}</h3>
                      <span className="text-[10px] text-slate-500 uppercase">({c.domain})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      <span>Points: <b className="text-amber-400">{c.points}</b></span> • 
                      <span className="ml-2">Difficulty: <b className="text-slate-300">{c.difficulty}</b></span> • 
                      <span className="ml-2">Flag Format: <code className="text-emerald-400">{c.flag_format}</code></span>
                    </div>
                  </div>

                  {/* Worker & Feedback Toggles */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Judge Enabled Toggle */}
                    <button
                      onClick={() => handleToggleJudge(c.id, c.judge_enabled)}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                        c.judge_enabled 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 hover:bg-emerald-900' 
                          : 'bg-red-950 text-red-400 border border-red-600 hover:bg-red-900'
                      }`}
                      title="Click to enable/disable judge execution for this problem"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Judge: {c.judge_enabled ? 'ENABLED' : 'DISABLED'}
                    </button>

                    {/* Reveal Failed Tests Toggle */}
                    <button
                      onClick={() => handleToggleReveal(c.id, c.reveal_failed_tests)}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                        c.reveal_failed_tests 
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 hover:bg-cyan-900' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title="Toggle whether participants see failed test inputs/outputs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {c.reveal_failed_tests ? 'Practice Mode' : 'Contest Mode'}
                    </button>

                    {/* Clipboard Restriction Toggle */}
                    <button
                      onClick={() => handleToggleClipboard(c.id, c.allow_copy_paste)}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                        c.allow_copy_paste 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 hover:bg-emerald-900' 
                          : 'bg-red-950 text-red-300 border border-red-600 hover:bg-red-900'
                      }`}
                      title="Toggle whether participants can copy/paste code (Ctrl+C/V, Ctrl+Shift+C)"
                    >
                      {c.allow_copy_paste ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-red-400" />}
                      Clipboard: {c.allow_copy_paste ? 'ALLOWED' : 'LOCKED'}
                    </button>

                    {/* View Reference Answer Toggle */}
                    <button
                      onClick={() => toggleSolutionExpand(c.id)}
                      className="px-3 py-1.5 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 hover:bg-amber-900 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Code2 className="w-3.5 h-3.5 text-amber-400" />
                      Official Answer
                      {expandedSol[c.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* View All Test Cases Toggle */}
                    <button
                      onClick={() => toggleTestsExpand(c.id)}
                      className="px-3 py-1.5 rounded bg-forensic-800 border border-slate-700 text-slate-300 hover:bg-forensic-750 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      Test Cases ({c.test_cases?.length || 0})
                      {expandedTests[c.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Section 1: Official Reference Solution */}
                {expandedSol[c.id] && (
                  <div className="p-4 bg-forensic-950 border-b border-forensic-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-400" />
                        Official Master Solution & Answer Logic
                      </span>
                      <span className="text-[11px] text-slate-500">Python 3 Reference Implementation</span>
                    </div>

                    <pre className="p-3.5 rounded bg-[#1e1e1e] border border-forensic-800 text-emerald-300 overflow-x-auto whitespace-pre-wrap font-mono">
                      {c.reference_solution || "# No reference solution registered for this case"}
                    </pre>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 pt-2 border-t border-forensic-800">
                      <div>
                        <span className="text-slate-500 uppercase block mb-1">Objective:</span>
                        <p className="text-slate-300">{c.objective}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase block mb-1">Required Result / Expected Verdict:</span>
                        <p className="text-slate-300">{c.required_result}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsible Section 2: All Test Cases (Public + Hidden) */}
                {expandedTests[c.id] && (
                  <div className="p-4 bg-forensic-950 space-y-3 text-xs">
                    <span className="text-forensic-cyan font-bold uppercase block">
                      Evaluation Test Cases Suite (Public Samples + Secret Hidden Tests)
                    </span>

                    <div className="space-y-3">
                      {c.test_cases?.map((tc, idx) => (
                        <div key={tc.id} className="p-3 rounded bg-forensic-900 border border-forensic-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                tc.type === 'public_sample' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-purple-950 text-purple-300 border border-purple-800'
                              }`}>
                                {tc.type === 'public_sample' ? 'PUBLIC SAMPLE' : 'HIDDEN TEST'} #{tc.index}
                              </span>
                              <span className="text-slate-400">Award: {tc.points} pts</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block mb-1">Input (stdin):</span>
                              <pre className="p-2 rounded bg-forensic-950 text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
                                {tc.input || "(empty)"}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block mb-1">Expected Output (stdout):</span>
                              <pre className="p-2 rounded bg-forensic-950 text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono text-[11px]">
                                {tc.output || "(empty)"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 2: Case Catalog */}
      {activeTab === 'cases' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4 w-20">ID</th>
                  <th className="py-3 px-4">Title & Domain</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4 text-center">Difficulty</th>
                  <th className="py-3 px-4 text-center">Judge Status</th>
                  <th className="py-3 px-4 text-center">Feedback Mode</th>
                  <th className="py-3 px-4 text-center">Clipboard</th>
                  <th className="py-3 px-4 text-center">Publication</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forensic-800">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-forensic-850/60 transition">
                    <td className="py-3 px-4 font-bold text-forensic-cyan">{c.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{c.title}</span>
                      <span className="text-[10px] text-slate-500">{c.domain}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-amber-400 font-bold">{c.points}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{c.difficulty}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleJudge(c.id, c.judge_enabled)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.judge_enabled 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                            : 'bg-red-950 text-red-400 border border-red-700/60'
                        }`}
                      >
                        {c.judge_enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleReveal(c.id, c.reveal_failed_tests)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.reveal_failed_tests 
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {c.reveal_failed_tests ? 'PRACTICE' : 'CONTEST'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleClipboard(c.id, c.allow_copy_paste)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.allow_copy_paste 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60' 
                            : 'bg-red-950 text-red-400 border border-red-700/60'
                        }`}
                      >
                        {c.allow_copy_paste ? 'ALLOWED' : 'LOCKED'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(c.id, c.publication_status)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          c.publication_status === 'PUBLISHED'
                            ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-600'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {c.publication_status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/cases/${c.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline mr-3"
                      >
                        Preview
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Git Importer */}
      {activeTab === 'git' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-forensic-cyan" />
                Git Question Importer & Validation Sync
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Reads question definitions from the versioned question repository schema.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleGitPreview}
                className="px-4 py-2 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                Preview & Validate Repo
              </button>
              <button
                onClick={handleGitSync}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Sync to Database
              </button>
            </div>
          </div>

          {gitPreview && (
            <div className="p-4 rounded-lg bg-forensic-950 border border-forensic-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
                <span className="font-bold text-white uppercase">Git Repository Metadata</span>
                <span className="text-forensic-cyan">Branch: {gitPreview.git_info?.branch || 'main'}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-500 block">Total Scanned:</span>
                  <span className="text-white font-bold">{gitPreview.scan_summary?.total_scanned}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Schema Valid:</span>
                  <span className="text-emerald-400 font-bold">{gitPreview.scan_summary?.valid_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Schema Invalid:</span>
                  <span className="text-red-400 font-bold">{gitPreview.scan_summary?.invalid_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Duplicate IDs:</span>
                  <span className="text-amber-400 font-bold">{gitPreview.scan_summary?.duplicate_ids?.length || 0}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Last Git Commit:</span>
                <code className="text-slate-300 bg-forensic-900 px-2 py-1 rounded block truncate">
                  {gitPreview.git_info?.commit_hash} — {gitPreview.git_info?.commit_msg}
                </code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: System Health */}
      {activeTab === 'health' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 space-y-6">
          <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Enigmatrix Platform & Judge Worker Telemetry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded bg-forensic-950 border border-forensic-800 space-y-2">
              <span className="text-slate-500 uppercase block">Execution Boundary</span>
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE (Sandbox Isolation)
              </div>
              <p className="text-[11px] text-slate-400">
                gcc (C11), g++ (C++17), python3 (3.14). Resource limits (RLIMIT_CPU, RLIMIT_AS, RLIMIT_FSIZE) enforced.
              </p>
            </div>

            <div className="p-4 rounded bg-forensic-950 border border-forensic-800 space-y-2">
              <span className="text-slate-500 uppercase block">Persistence Engine</span>
              <div className="text-emerald-400 font-bold">SQLAlchemy ORM (SQLite/PG)</div>
              <p className="text-[11px] text-slate-400">
                80 case dossiers seeded. User scores, tokens, and audit trails persistent.
              </p>
            </div>

            <div className="p-4 rounded bg-forensic-950 border border-forensic-800 space-y-2">
              <span className="text-slate-500 uppercase block">Version Control</span>
              <div className="text-forensic-cyan font-bold">{health?.git?.branch || 'main'}</div>
              <p className="text-[11px] text-slate-400 truncate">
                Hash: {health?.git?.commit_hash?.slice(0, 10)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-forensic-800 bg-forensic-850">
            <span className="text-xs font-mono uppercase text-slate-300 font-bold">Administrative Audit Trail</span>
          </div>

          <div className="divide-y divide-forensic-800 font-mono text-xs">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500">No administrative events logged yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-forensic-cyan uppercase mr-2">{log.action}</span>
                    <span className="text-slate-300">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
