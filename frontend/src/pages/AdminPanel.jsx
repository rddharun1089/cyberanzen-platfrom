import React, { useState, useEffect } from 'react';
import { 
  Shield, GitBranch, RefreshCw, CheckCircle2, AlertTriangle, Eye, Edit3, 
  Plus, Activity, Lock, Unlock, ShieldAlert, Database, Key, Code2, ChevronDown, ChevronUp, 
  Cpu, Sliders, Search, Check, X, UserX, Users, Trophy, Trash2, Crown, UserMinus
} from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('tab');
    return p || 'users';
  });
  const [cases, setCases] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [adminTeams, setAdminTeams] = useState([]);
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
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [expandedSol, setExpandedSol] = useState({});
  const [expandedTests, setExpandedTests] = useState({});

  // User Deletion Modal State
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [confirmUsernameInput, setConfirmUsernameInput] = useState('');
  const [confirmDeleteCheckbox, setConfirmDeleteCheckbox] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Score Adjustment Modal State
  const [adjustScoreModal, setAdjustScoreModal] = useState(null);
  const [pointsDeltaInput, setPointsDeltaInput] = useState(0);
  const [adjustReasonInput, setAdjustReasonInput] = useState('');
  const [isAdjustingScore, setIsAdjustingScore] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setUsersError('');
    try {
      const [caseList, solList, healthData, logs, userList, teamList] = await Promise.all([
        adminService.listCases(),
        adminService.listSolutions().catch(() => []),
        adminService.getHealth().catch(() => null),
        adminService.getAuditLogs().catch(() => []),
        adminService.listUsers().catch((err) => {
          const detail = err.response?.data?.detail || err.message || 'Authorization failed';
          setUsersError(detail);
          return [];
        }),
        adminService.listTeams().catch(() => [])
      ]);
      setCases(caseList);
      setSolutions(solList);
      setHealth(healthData);
      setAuditLogs(logs);
      setUsers(userList);
      setAdminTeams(teamList);
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

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    if (confirmUsernameInput.trim() !== deleteUserModal.username && !confirmDeleteCheckbox) {
      setDeleteModalError(`Please type "${deleteUserModal.username}" or check the confirmation checkbox.`);
      return;
    }
    setIsDeletingUser(true);
    setDeleteModalError('');
    try {
      const res = await adminService.deleteUser(deleteUserModal.id, deleteUserModal.username);
      setStatusMsg(res.message);
      setDeleteUserModal(null);
      setConfirmUsernameInput('');
      setConfirmDeleteCheckbox(false);
      setTimeout(() => setStatusMsg(''), 5000);
      loadAll();
    } catch (err) {
      setDeleteModalError(err.response?.data?.detail || err.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleAdminRotateInvite = async (teamId) => {
    if (!window.confirm('Rotate invitation code for this squad? Previous tokens will be revoked.')) return;
    try {
      const res = await adminService.adminRotateTeamInvite(teamId);
      setStatusMsg(`Rotated squad #${teamId} invite code: ${res.new_invitation_code}`);
      setTimeout(() => setStatusMsg(''), 4000);
      loadAll();
    } catch (err) {
      alert('Failed to rotate invite: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdminRemoveMember = async (teamId, userId, username) => {
    if (!window.confirm(`Remove member "${username}" from squad #${teamId}?`)) return;
    try {
      const res = await adminService.adminRemoveTeamMember(teamId, userId);
      setStatusMsg(res.message);
      setTimeout(() => setStatusMsg(''), 4000);
      loadAll();
    } catch (err) {
      alert('Failed to remove member: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdminAdjustScore = async () => {
    if (!adjustScoreModal) return;
    setIsAdjustingScore(true);
    try {
      const res = await adminService.adminAdjustTeamScore(
        adjustScoreModal.id,
        parseInt(pointsDeltaInput, 10),
        adjustReasonInput.trim() || 'Administrative manual adjustment'
      );
      setStatusMsg(`Adjusted squad #${adjustScoreModal.id} score to ${res.new_points} PTS`);
      setAdjustScoreModal(null);
      setPointsDeltaInput(0);
      setAdjustReasonInput('');
      setTimeout(() => setStatusMsg(''), 4000);
      loadAll();
    } catch (err) {
      alert('Failed to adjust score: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsAdjustingScore(false);
    }
  };

  const handleAdminDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Permanently disband and delete squad "${teamName}" (ID #${teamId})? All team solved progress will be cleared, though individual submissions will remain.`)) return;
    try {
      const res = await adminService.adminDeleteTeam(teamId);
      setStatusMsg(res.message);
      setTimeout(() => setStatusMsg(''), 4000);
      loadAll();
    } catch (err) {
      alert('Failed to delete squad: ' + (err.response?.data?.detail || err.message));
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

  // Filtered users
  const displayedUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

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
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'users' ? 'bg-red-950/80 text-red-200 border-b-2 border-red-500 shadow-md shadow-red-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserX className="w-4 h-4 text-red-400" />
          <span>User Directory & Deletion ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'teams' ? 'bg-cyan-950/80 text-cyan-200 border-b-2 border-cyan-400 shadow-md shadow-cyan-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Squads & Rosters ({adminTeams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('solutions')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'solutions' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>Judge & Anti-Cheat Controls ({solutions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'cases' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Case Catalog ({cases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'health' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Judge Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'audit' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-purple-400" />
          <span>Audit Log ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('git')}
          className={`px-4 py-2.5 rounded-t font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
            activeTab === 'git' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Git Importer</span>
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

      {/* Tab 6: User Management */}
      {activeTab === 'users' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden font-mono shadow-xl">
          <div className="p-4 border-b border-forensic-800 bg-forensic-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase text-white font-bold flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                Participant & Investigator Directory ({users.length} Registered Accounts)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspect accounts, squad affiliations, and execute authorized permanent account deletions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter by callsign or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-forensic-950 border border-forensic-750 text-slate-200 text-xs focus:outline-none focus:border-red-500 w-48 sm:w-64"
              />
              <button
                onClick={loadAll}
                className="px-3 py-1.5 rounded-lg bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {usersError && (
            <div className="m-4 p-3.5 rounded-lg bg-red-950/90 border border-red-500 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <span className="font-bold uppercase block text-red-300">Administrative Authorization Notice</span>
                  <span className="text-[11px] text-red-200">
                    {usersError} — Please sign in with an administrator account to view the full participant directory.
                  </span>
                </div>
              </div>
              <a
                href="/login"
                className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wide shrink-0 transition"
              >
                Sign In As Admin
              </a>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-forensic-850/80 border-b border-forensic-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4">Callsign & Email</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Squad</th>
                  <th className="py-3 px-4 text-center">Submissions</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forensic-800">
                {displayedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-forensic-850/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-400">#{u.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{u.username}</span>
                        {u.is_current_admin && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                            YOU (ACTIVE ADMIN)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' 
                          ? 'bg-red-950 text-red-300 border border-red-800' 
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.team ? (
                        <span className="px-2 py-0.5 rounded bg-forensic-950 border border-slate-700 text-slate-200 text-[11px] font-semibold">
                          {u.team.team_name} ({u.team.role})
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">No Squad</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">
                      {u.submission_count}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-400 font-bold">
                      {u.points} PTS
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeleteUserModal(u);
                          setConfirmUsernameInput('');
                        }}
                        disabled={u.is_current_admin}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                          u.is_current_admin
                            ? 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                            : 'bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 shadow-md hover:shadow-red-950'
                        }`}
                        title={u.is_current_admin ? "You cannot delete your own active administrator account" : "Permanently delete user"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete User</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {displayedUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-mono text-xs">
                      {usersError ? (
                        <div className="space-y-3 py-4 max-w-md mx-auto">
                          <p className="text-red-400 font-bold flex items-center justify-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Unable to Load User Directory
                          </p>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            {usersError}. You may need to log out and re-authenticate as an administrator.
                          </p>
                          <a
                            href="/login"
                            className="inline-block px-4 py-2 rounded bg-red-950 border border-red-600 text-red-200 hover:bg-red-900 transition font-bold"
                          >
                            Sign In with Administrator Account
                          </a>
                        </div>
                      ) : userSearchQuery ? (
                        <div className="py-6 space-y-2">
                          <p className="text-slate-300 font-bold">No accounts found matching filter: "{userSearchQuery}"</p>
                          <button
                            onClick={() => setUserSearchQuery('')}
                            className="text-cyan-400 hover:underline text-[11px]"
                          >
                            Clear Callsign Filter
                          </button>
                        </div>
                      ) : (
                        <div className="py-8 text-slate-400 space-y-1">
                          <p className="font-bold text-slate-300">No registered accounts found in database.</p>
                          <p className="text-[11px] text-slate-500">New participant registrations will appear here automatically.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Squads & Teams Management */}
      {activeTab === 'teams' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden font-mono shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forensic-800 pb-4">
            <div>
              <span className="text-xs uppercase text-white font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Active Investigation Squads ({adminTeams.length} Registered Units)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Oversee squad rosters, rotate invitation tokens, adjust scores, and manage team lifecycles.
              </p>
            </div>
            <button
              onClick={loadAll}
              className="px-3 py-1.5 rounded bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs flex items-center gap-1.5 transition w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {adminTeams.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs bg-forensic-950/60 rounded-xl border border-forensic-800 p-8 space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">No Active Squads Formed</p>
              <p className="text-slate-500 text-[11px]">
                Participants have not commissioned any investigation units yet. They can form squads in the Squad Room (/team).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
            {adminTeams.map((t) => (
              <div key={t.id} className="bg-forensic-950 border border-forensic-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forensic-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold text-xs">
                      SQUAD #{t.id}
                    </span>
                    <h3 className="text-base font-bold text-white">{t.name}</h3>
                    <span className="text-xs text-amber-400 font-bold">{t.points} PTS</span>
                    <span className="text-xs text-slate-400">({t.solved_count} Solved)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAdminRotateInvite(t.id)}
                      className="px-2.5 py-1 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
                      title="Rotate invitation code"
                    >
                      <RefreshCw className="w-3 h-3 text-cyan-400" />
                      <span>Rotate Code</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdjustScoreModal(t);
                        setPointsDeltaInput(0);
                        setAdjustReasonInput('');
                      }}
                      className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-600 text-amber-200 text-xs font-bold transition flex items-center gap-1"
                      title="Adjust score"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>Adjust Score</span>
                    </button>

                    <button
                      onClick={() => handleAdminDeleteTeam(t.id, t.name)}
                      className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 text-xs font-bold transition flex items-center gap-1"
                      title="Disband squad"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Disband Squad</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    <span>Commander: <b className="text-white">{t.owner?.username}</b></span>
                    <span>• Invite Token: <code className="text-cyan-300 bg-forensic-900 px-2 py-0.5 rounded">{t.invitation_code}</code></span>
                    <span>• Commissioned: {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Operatives Roster */}
                  <div className="bg-forensic-900 p-3 rounded-lg border border-forensic-800 space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Operatives Roster ({t.members?.length} / {t.max_members})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {t.members?.map((m) => (
                        <div key={m.user_id} className="p-2 rounded bg-forensic-950 border border-forensic-800 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-white block">{m.username}</span>
                            <span className="text-[10px] text-slate-400">{m.role} • {m.points} pts</span>
                          </div>
                          {m.role !== 'OWNER' && (
                            <button
                              onClick={() => handleAdminRemoveMember(t.id, m.user_id, m.username)}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950"
                              title="Remove operative"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* MODAL 1: Delete User Confirmation */}
      {deleteUserModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-forensic-900 border border-red-600/80 rounded-xl p-6 max-w-lg w-full space-y-4 font-mono shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 border-b border-forensic-800 pb-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm uppercase">Irreversible Account Deletion</h3>
                <span className="text-[10px] text-red-300">ADMINISTRATIVE ACTION REQUIRED</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-950/60 border border-red-700/60 text-red-200 text-xs leading-relaxed space-y-1">
              <p className="font-bold">⚠️ CRITICAL WARNING:</p>
              <p>This will permanently purge this account, revoke active JWT authentication sessions, and remove credentials.</p>
              <p className="text-[11px] text-red-300">• Shared team solved challenges will be preserved with solver anonymized.</p>
              <p className="text-[11px] text-red-300">• If squad commander, ownership will transfer to the next operative automatically.</p>
            </div>

            {/* User Target Profile Summary */}
            <div className="bg-forensic-950 p-3.5 rounded-lg border border-forensic-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Target User ID:</span>
                <span className="text-white font-bold">#{deleteUserModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Callsign / Username:</span>
                <span className="text-cyan-400 font-bold">{deleteUserModal.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Squad Affiliation:</span>
                <span className="text-slate-200">{deleteUserModal.team ? `${deleteUserModal.team.team_name} (${deleteUserModal.team.role})` : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase">Submissions / Points:</span>
                <span className="text-amber-400 font-bold">{deleteUserModal.submission_count} subs • {deleteUserModal.points} PTS</span>
              </div>
            </div>

            {deleteModalError && (
              <div className="p-3 rounded-lg bg-red-950 border border-red-500 text-red-300 text-xs">
                {deleteModalError}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-300 uppercase">
                  Confirm Target Callsign:
                </label>
                <button
                  type="button"
                  onClick={() => setConfirmUsernameInput(deleteUserModal.username)}
                  className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 text-[10px] font-bold transition flex items-center gap-1"
                >
                  ⚡ Auto-Fill "{deleteUserModal.username}"
                </button>
              </div>
              <input
                type="text"
                placeholder={`Type "${deleteUserModal.username}" to confirm...`}
                value={confirmUsernameInput}
                onChange={(e) => setConfirmUsernameInput(e.target.value)}
                className="w-full px-3 py-2 bg-forensic-950 border border-red-700/80 rounded text-red-200 text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 select-none">
              <input
                type="checkbox"
                checked={confirmDeleteCheckbox}
                onChange={(e) => setConfirmDeleteCheckbox(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5 accent-red-600 cursor-pointer"
              />
              <span>
                <b>Authorized Executive Confirmation:</b> I confirm permanent deletion of account <b>{deleteUserModal.username}</b>. Active tokens will be revoked immediately.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteUserModal(null);
                  setDeleteModalError('');
                  setConfirmUsernameInput('');
                  setConfirmDeleteCheckbox(false);
                }}
                className="px-4 py-2 rounded bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={!(confirmUsernameInput.trim() === deleteUserModal.username || confirmDeleteCheckbox) || isDeletingUser}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950 transition"
              >
                {isDeletingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Permanently Purge User Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Adjust Team Score */}
      {adjustScoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-forensic-900 border border-amber-600/80 rounded-xl p-6 max-w-md w-full space-y-4 font-mono shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 border-b border-forensic-800 pb-3">
              <Plus className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm uppercase">Adjust Squad Score</h3>
            </div>
            
            <p className="text-xs text-slate-300">
              Modifying points for squad: <b className="text-white">{adjustScoreModal.name}</b> (Current: <b className="text-amber-400">{adjustScoreModal.points} PTS</b>).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 uppercase mb-1">Score Delta (+ / - points)</label>
                <input
                  type="number"
                  placeholder="e.g. 50 or -20"
                  value={pointsDeltaInput}
                  onChange={(e) => setPointsDeltaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-forensic-950 border border-forensic-700 rounded text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase mb-1">Administrative Audit Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Bonus forensic finding, Penalty for conduct..."
                  value={adjustReasonInput}
                  onChange={(e) => setAdjustReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-forensic-950 border border-forensic-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setAdjustScoreModal(null)}
                className="px-4 py-2 rounded bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAdjustScore}
                disabled={isAdjustingScore || !pointsDeltaInput}
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs"
              >
                Apply Score Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
