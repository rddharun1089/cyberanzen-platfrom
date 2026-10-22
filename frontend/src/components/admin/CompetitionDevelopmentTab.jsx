import React, { useState, useEffect } from 'react';
import { 
  Cpu, Code2, Flag, HelpCircle, Layers, Sparkles, Plus, 
  CheckCircle2, AlertTriangle, Settings, Eye, Play, Trash2, 
  Edit3, Shield, Info, ArrowRight, ExternalLink, X, Save
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function CompetitionDevelopmentTab({ onCreateEventWithTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Template Creation / Editing
  const [form, setForm] = useState({
    name: '',
    slug: '',
    competition_type: 'dsa',
    description: '',
    icon: 'code',
    workspace_layout: 'split_code',
    supported_question_types: ['dsa'],
    participation_modes: ['individual', 'team'],
    question_navigation_policy: 'free',
    question_order_mode: 'fixed',
    enabled_features: ['code_editor', 'test_cases', 'judge_verdicts', 'leaderboards'],
    default_config: { allowed_languages: ['python3', 'cpp', 'c'], time_limit_ms: 2000 }
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await adminService.listCompetitionTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to load competition templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm({
      name: '',
      slug: '',
      competition_type: 'dsa',
      description: '',
      icon: 'code',
      workspace_layout: 'split_code',
      supported_question_types: ['dsa'],
      participation_modes: ['individual', 'team'],
      question_navigation_policy: 'free',
      question_order_mode: 'fixed',
      enabled_features: ['code_editor', 'test_cases', 'judge_verdicts', 'leaderboards'],
      default_config: { allowed_languages: ['python3', 'cpp', 'c'], time_limit_ms: 2000 }
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setSelectedTemplate(t);
    setForm({
      name: t.name,
      slug: t.slug,
      competition_type: t.competition_type,
      description: t.description,
      icon: t.icon || 'code',
      workspace_layout: t.workspace_layout || 'split_code',
      supported_question_types: t.supported_question_types || ['dsa'],
      participation_modes: t.participation_modes || ['individual', 'team'],
      question_navigation_policy: t.question_navigation_policy || 'free',
      question_order_mode: t.question_order_mode || 'fixed',
      enabled_features: t.enabled_features || [],
      default_config: t.default_config || {}
    });
    setModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedTemplate) {
        await adminService.updateCompetitionTemplate(selectedTemplate.id, form);
        alert('Competition template updated successfully!');
      } else {
        await adminService.createCompetitionTemplate(form);
        alert('New competition template created successfully!');
      }
      setModalOpen(false);
      await loadTemplates();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save competition template.');
    }
  };

  const handleDeleteTemplate = async (t) => {
    if (t.is_builtin) {
      alert('Built-in core competition templates cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete custom competition template "${t.name}"?`)) return;
    try {
      await adminService.deleteCompetitionTemplate(t.id);
      alert('Template deleted successfully.');
      await loadTemplates();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete template.');
    }
  };

  const getIconComponent = (iconName) => {
    switch ((iconName || '').toLowerCase()) {
      case 'flag': return <Flag className="w-5 h-5 text-amber-400" />;
      case 'help-circle': return <HelpCircle className="w-5 h-5 text-emerald-400" />;
      case 'layers': return <Layers className="w-5 h-5 text-purple-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-rose-400" />;
      default: return <Code2 className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleCreateEventClick = (template) => {
    if (onCreateEventWithTemplate) {
      onCreateEventWithTemplate(template);
    } else {
      alert(`Pre-selecting template "${template.name}" for new competition.`);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#F2F7FF]">
      {/* Top Header & Boundary Banner */}
      <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#00CFFF]" />
              <span>COMPETITION DEVELOPMENT STUDIO</span>
            </h2>
            <p className="text-xs text-[#A9BCD6] mt-1 max-w-2xl">
              Configure, version, and extend reusable competition templates for future tournaments.
              Distinguish between creating a live event for participants and architecting a competition engine template.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,207,255,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Security & Extensibility Boundary Alert */}
        <div className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] text-xs font-mono text-[#A9BCD6] flex items-start space-x-3">
          <Info className="w-4 h-4 text-[#00CFFF] shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-bold block mb-0.5">Architecture &amp; Controlled Extensibility Boundary:</span>
            <span>
              Database templates configure supported layouts, question policies, and scoring paradigms. 
              Adding genuinely new kernel engines or untrusted binary runners requires reviewed code deployments in our sandboxed DevSecOps pipeline.
            </span>
          </div>
        </div>
      </div>

      {/* Main Catalog of Competition Types */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#00CFFF] font-bold mb-4 flex items-center space-x-2">
          <Layers className="w-4 h-4" />
          <span>Available Competition Engines &amp; Verified Templates</span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-[#00CFFF] font-mono animate-pulse">
            Loading competition engine catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => {
              const features = t.enabled_features || [];
              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl hover:border-[#087FFF] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                          {getIconComponent(t.icon)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">{t.name}</h4>
                          <span className="text-[10px] font-mono text-[#00CFFF]">
                            Type: {t.competition_type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        t.is_builtin
                          ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
                          : 'bg-purple-950/60 text-purple-400 border-purple-800'
                      }`}>
                        {t.is_builtin ? 'Built-in Core' : 'Custom Template'}
                      </span>
                    </div>

                    <p className="text-xs text-[#A9BCD6] leading-relaxed">
                      {t.description}
                    </p>

                    {/* Features checklist */}
                    <div className="pt-2 border-t border-[#18385E]/60 space-y-1.5 font-mono text-[11px]">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Enabled Capabilities</span>
                      <div className="flex flex-wrap gap-1.5">
                        {features.slice(0, 5).map((f, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-[#061329] border border-[#18385E] text-[#A9BCD6] text-[10px]">
                            ✓ {f.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {features.length > 5 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                            +{features.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-[#18385E] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewTemplate(t)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-[#A9BCD6] hover:text-white bg-[#061329] border border-[#18385E] hover:border-[#087FFF] transition-colors"
                      title="Preview Participant Workspace"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Preview
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102746] transition-colors"
                        title="Edit Configuration"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {!t.is_builtin && (
                        <button
                          onClick={() => handleDeleteTemplate(t)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          title="Delete Custom Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCreateEventClick(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-[#00CFFF] to-[#087FFF] hover:opacity-90 shadow-md transition-all flex items-center space-x-1"
                      >
                        <span>Use</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0B1D38] border border-[#18385E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#18385E] flex items-center justify-between bg-[#061329]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-[#00CFFF]" />
                <h3 className="text-sm font-bold text-white font-mono">
                  {isEditing ? `Edit Template: ${form.name}` : 'Create Reusable Competition Template'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono focus:border-[#00CFFF] focus:outline-none"
                    placeholder="e.g. Algorithmic High-Frequency Battle"
                  />
                </div>
                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono focus:border-[#00CFFF] focus:outline-none"
                    placeholder="auto-generated from name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A9BCD6] font-mono mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono focus:border-[#00CFFF] focus:outline-none"
                  placeholder="Explain the objectives, tournament format, and evaluation mechanisms..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Competition Type</label>
                  <select
                    value={form.competition_type}
                    onChange={(e) => setForm({ ...form, competition_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono"
                  >
                    <option value="dsa">DSA (Coding Judge)</option>
                    <option value="ctf">CTF (Flag Challenges)</option>
                    <option value="mcq">MCQ (Quiz Engine)</option>
                    <option value="combined">Combined Multi-Track</option>
                    <option value="puzzle">Logic Puzzle Quest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Workspace Layout</label>
                  <select
                    value={form.workspace_layout}
                    onChange={(e) => setForm({ ...form, workspace_layout: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono"
                  >
                    <option value="split_code">Split-Screen Code IDE</option>
                    <option value="ctf_grid">CTF Grid &amp; Terminal</option>
                    <option value="mcq_quiz">Sequential Quiz Workspace</option>
                    <option value="combined">Multi-Track Combined Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Question Navigation</label>
                  <select
                    value={form.question_navigation_policy}
                    onChange={(e) => setForm({ ...form, question_navigation_policy: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono"
                  >
                    <option value="free">Free Navigation</option>
                    <option value="sequential">Sequential Progression</option>
                    <option value="unlock">Unlock Rules</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Question Order Mode</label>
                  <select
                    value={form.question_order_mode}
                    onChange={(e) => setForm({ ...form, question_order_mode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono"
                  >
                    <option value="fixed">Fixed Order</option>
                    <option value="random_participant">Random Order Per Participant</option>
                    <option value="random_team">Random Order Per Squad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A9BCD6] font-mono mb-1">Icon Representation</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono"
                  >
                    <option value="code">Code (Code2)</option>
                    <option value="flag">Security Flag (Flag)</option>
                    <option value="help-circle">Knowledge Quiz (HelpCircle)</option>
                    <option value="layers">Combined Multi-Track (Layers)</option>
                    <option value="sparkles">Logic Puzzle (Sparkles)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 border-t border-[#18385E] flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#A9BCD6] hover:text-white bg-[#061329] border border-[#18385E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-lg flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Update Template' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKSPACE PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-[#0B1D38] border border-[#18385E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#18385E] flex items-center justify-between bg-[#061329]">
              <div className="flex items-center space-x-3">
                {getIconComponent(previewTemplate.icon)}
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Participant Workspace Preview: {previewTemplate.name}
                  </h3>
                  <span className="text-[10px] text-[#A9BCD6] font-mono">
                    Layout: {previewTemplate.workspace_layout} • Navigation: {previewTemplate.question_navigation_policy}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-white">Event Simulation: 2026 Winter Sprint</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                    Live Attempt
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Progress Tracker</span>
                  <span className="text-cyan-400 font-bold">Solved 3 / 8 Questions</span>
                </div>
              </div>

              {/* Wireframe Mockup */}
              <div className="border border-[#18385E] rounded-xl overflow-hidden grid grid-cols-12 h-72">
                <div className="col-span-4 bg-[#061329] p-3 border-r border-[#18385E] space-y-2">
                  <span className="text-[10px] text-[#00CFFF] uppercase font-bold block">Assigned Problems</span>
                  <div className="p-2 rounded bg-[#102746] border border-[#00CFFF] text-white font-bold flex justify-between">
                    <span>Q1. Inverted Arrays</span>
                    <span className="text-emerald-400">✓ 100pts</span>
                  </div>
                  <div className="p-2 rounded bg-[#08172B] border border-[#18385E] text-[#A9BCD6] flex justify-between">
                    <span>Q2. Binary Tree DFS</span>
                    <span>150pts</span>
                  </div>
                  <div className="p-2 rounded bg-[#08172B] border border-[#18385E] text-[#A9BCD6] flex justify-between">
                    <span>Q3. Dynamic Knapsack</span>
                    <span className="text-amber-400">🔒 Locked</span>
                  </div>
                </div>

                <div className="col-span-8 bg-[#0B1D38] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-[#18385E]">
                      <span className="font-bold text-white">Problem Statement &amp; Monaco IDE</span>
                      <span className="text-[#00CFFF]">Language: Python 3.14 / C++</span>
                    </div>
                    <p className="text-slate-400 mt-3 text-[11px] leading-relaxed">
                      Given an integer array nums, return the maximum product of any non-empty subarray.
                    </p>
                  </div>
                  <div className="p-3 bg-[#061329] rounded-lg border border-[#18385E] flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Run diagnostics against public test cases</span>
                    <div className="space-x-2">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-[11px]">Run Samples</span>
                      <span className="px-3 py-1 bg-cyan-400 text-slate-950 font-bold rounded text-[11px]">Submit to Judge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#18385E] bg-[#061329] flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-white bg-[#102746] hover:bg-[#18385E]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
