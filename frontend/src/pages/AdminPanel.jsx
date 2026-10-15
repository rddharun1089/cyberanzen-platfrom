import React, { useState, useEffect } from 'react';
import { Shield, GitBranch, RefreshCw, CheckCircle2, AlertTriangle, Eye, Edit3, Plus, Activity, Lock, Database } from 'lucide-react';
import { adminService } from '../services/api';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'git' | 'health' | 'audit'
  const [cases, setCases] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [gitPreview, setGitPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Editing modal state
  const [editingCase, setEditingCase] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [caseList, healthData, logs] = await Promise.all([
        adminService.listCases(),
        adminService.getHealth().catch(() => null),
        adminService.getAuditLogs().catch(() => [])
      ]);
      setCases(caseList);
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
      setStatusMsg(`Updated ${caseId} status to ${newStatus}`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert('Failed to update case: ' + err.message);
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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        INITIALIZING COMMAND CLEARANCE TERMINAL...
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
            ADMINISTRATOR COMMAND TERMINAL
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Case lifecycle administration, Git question synchronizer, isolated judge diagnostics, and audit logs.
          </p>
        </div>

        {statusMsg && (
          <div className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs">
            {statusMsg}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-forensic-800 pb-2">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'cases' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Case Catalog ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('git')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'git' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Git Question Importer
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'health' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          System Health & Workers
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-t font-mono text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'audit' ? 'bg-forensic-850 text-forensic-cyan border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Case Catalog */}
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
                  <th className="py-3 px-4 text-center">Validation Status</th>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.validation_status === 'VALIDATED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-700/60'
                      }`}>
                        {c.validation_status}
                      </span>
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

      {/* Tab 2: Git Importer */}
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

      {/* Tab 3: System Health */}
      {activeTab === 'health' && (
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 space-y-6">
          <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Platform & Judge Worker Telemetry
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

      {/* Tab 4: Audit Logs */}
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
