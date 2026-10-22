import React, { useState, useEffect } from 'react';
import { 
  Upload, GitBranch, FileText, CheckCircle2, AlertTriangle, 
  Play, RefreshCw, Layers, Edit3, Trash2, Check, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { importService } from '../../services/api';

export default function QuestionImportTab({ onQuestionsPublished }) {
  const [sourceMode, setSourceMode] = useState('file'); // 'file' | 'git'
  const [file, setFile] = useState(null);
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [validatingIdx, setValidatingIdx] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await importService.listJobs();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        loadJobDetail(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load import jobs:', err);
    }
  };

  const loadJobDetail = async (jobId) => {
    try {
      const detail = await importService.getJob(jobId);
      setSelectedJob(detail);
      setSelectedIndices([]);
    } catch (err) {
      console.error('Failed to load job detail:', err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file (PDF, DOCX, Markdown, JSON, CSV, or ZIP).');
      return;
    }
    setUploading(true);
    try {
      const res = await importService.uploadFile(file);
      alert(`Extracted ${res.total_detected} questions successfully!`);
      setFile(null);
      await loadJobs();
      await loadJobDetail(res.job_id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Extraction failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleGitImport = async (e) => {
    e.preventDefault();
    if (!gitUrl.trim()) {
      alert('Please specify a repository URL.');
      return;
    }
    setUploading(true);
    try {
      const res = await importService.importGit(gitUrl, gitBranch);
      alert(`Cloned & extracted ${res.total_detected} questions from Git repository!`);
      setGitUrl('');
      await loadJobs();
      await loadJobDetail(res.job_id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Git extraction failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleValidateSandbox = async (idx) => {
    if (!selectedJob) return;
    setValidatingIdx(idx);
    try {
      const res = await importService.validateQuestion(selectedJob.id, idx);
      if (res.is_valid) {
        alert(`Validation SUCCESS! Verdict: ${res.verdict} (${res.passed_count}/${res.total_tests} tests passed)`);
      } else {
        alert(`Validation FAILED: Verdict: ${res.verdict} (${res.passed_count}/${res.total_tests} tests passed). Review reference solution or testcases.`);
      }
      await loadJobDetail(selectedJob.id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Pre-flight validation failed.');
    } finally {
      setValidatingIdx(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedJob || editingIdx === null || !editingQuestion) return;
    try {
      await importService.updateQuestion(selectedJob.id, editingIdx, editingQuestion);
      alert('Extracted question updated successfully.');
      setEditingQuestion(null);
      setEditingIdx(null);
      await loadJobDetail(selectedJob.id);
    } catch (err) {
      alert('Failed to update extracted question.');
    }
  };

  const handlePublish = async (status = 'published') => {
    if (!selectedJob || selectedIndices.length === 0) {
      alert('Please select at least one question to publish.');
      return;
    }
    try {
      const res = await importService.publishQuestions(selectedJob.id, selectedIndices, status);
      alert(res.message);
      if (onQuestionsPublished) onQuestionsPublished();
      await loadJobDetail(selectedJob.id);
      await loadJobs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Publication failed.');
    }
  };

  const toggleSelectAll = () => {
    if (!selectedJob || !selectedJob.questions) return;
    if (selectedIndices.length === selectedJob.questions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(selectedJob.questions.map((_, i) => i));
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Upload Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>DSA QUESTION IMPORT ENGINE</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Extract and normalize questions from PDF, DOCX, Markdown, JSON, CSV, ZIP bundles, or Git repositories.
            </p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSourceMode('file')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${sourceMode === 'file' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document / Archive</span>
            </button>
            <button
              onClick={() => setSourceMode('git')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${sourceMode === 'git' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Git Repository</span>
            </button>
          </div>
        </div>

        {sourceMode === 'file' ? (
          <form onSubmit={handleFileUpload} className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px]">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.md,.markdown,.json,.csv,.zip"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900 border border-slate-800 rounded-xl bg-slate-950 p-1"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {uploading ? 'Extracting Questions...' : 'Upload & Extract Document'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGitImport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="https://github.com/org/dsa-problems.git"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="main"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2 rounded-xl font-mono text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50"
              >
                {uploading ? 'Cloning...' : 'Sync Git'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Import Jobs & Staged Review Table */}
      {selectedJob && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-semibold">
                  JOB #{selectedJob.id} // {selectedJob.source_type}
                </span>
                <span className="text-xs text-slate-300 font-mono font-bold truncate max-w-sm">
                  {selectedJob.source_name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {selectedJob.total_detected} questions detected • {selectedJob.total_imported} imported into bank
              </p>
            </div>

            {/* Bulk Publish Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePublish('draft')}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Save Selected as Draft
              </button>
              <button
                type="button"
                onClick={() => handlePublish('published')}
                className="px-4 py-1.5 rounded-lg font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Publish Selected ({selectedIndices.length})
              </button>
            </div>
          </div>

          {/* Questions Review Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedJob.questions && selectedIndices.length === selectedJob.questions.length && selectedJob.questions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 text-cyan-500"
                    />
                  </th>
                  <th className="p-3">#</th>
                  <th className="p-3">Title & Overview</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Test Cases</th>
                  <th className="p-3">Reference Solution</th>
                  <th className="p-3">Validation Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedJob.questions && selectedJob.questions.map((q, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedIndices(selectedIndices.filter(i => i !== idx));
                            } else {
                              setSelectedIndices([...selectedIndices, idx]);
                            }
                          }}
                          className="rounded border-slate-700 text-cyan-500"
                        />
                      </td>
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-sans">
                        <div className="font-mono font-bold text-white text-xs">{q.title}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{q.statement}</div>
                        {q.warnings && q.warnings.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {q.warnings.map((w, wIdx) => (
                              <span key={wIdx} className="inline-flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>{w}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        <span>{q.public_test_cases ? q.public_test_cases.length : 0} sample</span>
                        <span className="text-slate-500 mx-1">•</span>
                        <span>{q.hidden_test_cases ? q.hidden_test_cases.length : 0} hidden</span>
                      </td>
                      <td className="p-3">
                        {q.reference_solution ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-bold">
                            <Check className="w-3 h-3" />
                            <span>Available</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400">Missing</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          q.validation_status === 'VALIDATED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          q.validation_status === 'VALIDATION_FAILED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          q.validation_status === 'READY' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {q.validation_status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          disabled={validatingIdx === idx || !q.reference_solution}
                          onClick={() => handleValidateSandbox(idx)}
                          className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800/80 text-[10px] disabled:opacity-40"
                          title="Execute in Judge Sandbox"
                        >
                          <Play className="w-3 h-3 inline mr-1" />
                          <span>{validatingIdx === idx ? 'Judging...' : 'Validate'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion({ ...q });
                            setEditingIdx(idx);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                        >
                          <Edit3 className="w-3 h-3 inline mr-1" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inline Question Editor Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold font-mono text-cyan-400">Edit Extracted Question #{editingIdx + 1}</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Title</label>
                <input
                  type="text"
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-mono mb-1">Problem Statement</label>
                <textarea
                  rows={4}
                  value={editingQuestion.statement}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, statement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Input Format</label>
                  <input
                    type="text"
                    value={editingQuestion.input_spec}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, input_spec: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Output Format</label>
                  <input
                    type="text"
                    value={editingQuestion.output_spec}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, output_spec: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-mono mb-1">Reference Solution (Python 3)</label>
                <textarea
                  rows={4}
                  value={editingQuestion.reference_solution || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, reference_solution: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono"
                  placeholder="def solve(): ..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  setEditingIdx(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
