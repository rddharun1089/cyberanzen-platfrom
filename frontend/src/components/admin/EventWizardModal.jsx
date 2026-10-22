import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, Calendar, Trophy, Users, Shield, 
  HelpCircle, Code2, AlertTriangle, Eye, Layers, Settings, FileText, CheckCircle2 
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function EventWizardModal({ isOpen, onClose, onEventCreated }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Wizard Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    event_type: 'dsa', // 'dsa' | 'ctf' | 'mcq'
    short_description: '',
    description: '',
    banner_url: '',
    rules: '',
    organizer: 'CyberAnzen Arena',
    category: 'Competitive Programming',
    difficulty: 'Intermediate',
    timezone: 'UTC',
    eligibility: 'Open to all authenticated cadets',
    visibility: 'public', // 'public' | 'unlisted' | 'restricted'
    capacity: 100,
    contact_info: 'director@cyberanzen.io',
    participation_mode: 'team', // 'individual' | 'team' | 'mixed'
    team_size_min: 1,
    team_size_max: 4,
    team_allow_create: true,
    team_allow_join_code: true,
    team_require_approval: false,
    team_allow_member_changes: true,
    team_lock_on_start: true,
    team_allow_ownership_transfer: true,
    team_allow_delete_empty: true,
    team_show_members_leaderboard: true,
    leaderboard_type: 'individual',
    leaderboard_visible: true,
    leaderboard_frozen: false,
    scores_visible_during_event: true,
    auto_publish_results: true,
    show_solve_times: true,
    show_solve_counts: true,
    anonymize_participants: false,
    start_time: '',
    end_time: '',
    registration_open: true,
    registration_close: '',
    clipboard_policy: 'restricted',
    scoring_policy: 'standard',
    question_ids: [],
    status: 'draft'
  });

  useEffect(() => {
    if (isOpen) {
      loadBankQuestions(form.event_type);
    }
  }, [isOpen, form.event_type]);

  const loadBankQuestions = async (type) => {
    setLoadingQuestions(true);
    try {
      if (type === 'dsa') {
        const data = await adminService.listDSA();
        setAvailableQuestions(data);
      } else if (type === 'ctf') {
        const data = await adminService.listCTF();
        setAvailableQuestions(data);
      } else if (type === 'mcq') {
        const data = await adminService.listMCQs();
        setAvailableQuestions(data);
      }
    } catch (err) {
      console.error('Failed to load bank questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!form.title.trim() || !form.description.trim()) {
        alert('Event Title and Full Description are mandatory.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 7));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleQuestionToggle = (qid) => {
    const current = [...form.question_ids];
    if (current.includes(qid)) {
      setForm({ ...form, question_ids: current.filter(id => id !== qid) });
    } else {
      setForm({ ...form, question_ids: [...current, qid] });
    }
  };

  const handleSubmit = async (publishStatus) => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        status: publishStatus,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        registration_close: form.registration_close ? new Date(form.registration_close).toISOString() : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        team_size_min: parseInt(form.team_size_min),
        team_size_max: parseInt(form.team_size_max)
      };
      await adminService.createEvent(payload);
      alert(`Event '${form.title}' created successfully with status '${publishStatus}'!`);
      onEventCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">WIZARD // STEP {step} OF 7</span>
            <h2 className="text-xl font-bold font-mono text-white">Create New Competition Event</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-7 h-1 bg-slate-800">
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <div 
              key={s} 
              className={`h-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-cyan-500 to-teal-400' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        {/* Body content per step */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>STEP 1: BASIC EVENT INFORMATION</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:border-cyan-500"
                    placeholder="e.g. Winter Cyber Security Invitational 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Unique Slug (Auto-generated if empty)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-cyan-500"
                    placeholder="winter-invitational-2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Organizer</label>
                  <input
                    type="text"
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Short Description (for event cards)</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                    placeholder="Brief 1-line teaser for tournament listings..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">Full Description & Overview (Markdown) *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    placeholder="Describe event background, mission storyline, technical focus..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Start Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">End Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                  >
                    <option value="public">Public (Listed on event dashboard)</option>
                    <option value="unlisted">Unlisted (Accessible via direct link)</option>
                    <option value="restricted">Restricted (Invitation only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Participant Capacity (Optional)</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                    placeholder="e.g. 200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Event Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>STEP 2: SELECT EVENT DOMAIN & TYPE</span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose the primary challenge paradigm. This configures the participant workspace modules and judging subsystem.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* DSA Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'dsa' })}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${form.event_type === 'dsa' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <Code2 className="w-8 h-8 text-cyan-400 mb-3" />
                  <h4 className="font-mono font-bold text-white text-sm">DSA / Competitive</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Algorithmic problems evaluated inside safe Linux RLIMIT sandboxes for Python 3, C, and C++.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">Judge Sandbox</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono">Hidden Tests</span>
                  </div>
                </div>

                {/* CTF Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'ctf' })}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${form.event_type === 'ctf' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <Shield className="w-8 h-8 text-teal-400 mb-3" />
                  <h4 className="font-mono font-bold text-white text-sm">Cybersecurity CTF</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Capture The Flag challenges across Web, Forensics, Reverse, Crypto, and isolated Docker container labs.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-400 font-mono">Docker Labs</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-400 font-mono">Dynamic Flags</span>
                  </div>
                </div>

                {/* MCQ Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'mcq' })}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${form.event_type === 'mcq' ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                >
                  <HelpCircle className="w-8 h-8 text-emerald-400 mb-3" />
                  <h4 className="font-mono font-bold text-white text-sm">MCQ / Quiz Assessment</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Multiple-choice assessments with question timers, negative marks, and post-submission review explanations.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Timers</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Negative Marks</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Participation Mode */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>STEP 3: PARTICIPATION MODE</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'individual' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'individual' ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-950 border-slate-800'}`}
                >
                  <h4 className="font-bold text-white text-sm">Solo Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">Each operative competes and ranks independently. Squad creation disabled.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'team' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'team' ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-950 border-slate-800'}`}
                >
                  <h4 className="font-bold text-white text-sm">Team Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">Operatives collaborate in squads. Squad scores deduplicated atomically.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'mixed' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'mixed' ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-950 border-slate-800'}`}
                >
                  <h4 className="font-bold text-white text-sm">Mixed Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">Participants choose Solo or Squad during enrollment. Separate leaderboards.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Team Configuration */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>STEP 4: TEAM & SQUAD POLICY CONTROLS</span>
              </h3>
              {form.participation_mode === 'individual' ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  Event is configured as Solo Mode. Squad policy configuration is disabled for this tournament.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Maximum Team Size (Backend Enforced)</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={form.team_size_max}
                      onChange={(e) => setForm({ ...form, team_size_max: parseInt(e.target.value) || 4 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Fifth member strictly blocked by backend if set to 4.</span>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Minimum Team Size</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={form.team_size_min}
                      onChange={(e) => setForm({ ...form, team_size_min: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-2 space-y-2 pt-2">
                    <label className="flex items-center space-x-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.team_allow_create}
                        onChange={(e) => setForm({ ...form, team_allow_create: e.target.checked })}
                        className="rounded border-slate-700 text-cyan-500"
                      />
                      <span>Allow participants to create custom squads</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.team_allow_join_code}
                        onChange={(e) => setForm({ ...form, team_allow_join_code: e.target.checked })}
                        className="rounded border-slate-700 text-cyan-500"
                      />
                      <span>Allow squad recruitment via invitation tokens</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.team_lock_on_start}
                        onChange={(e) => setForm({ ...form, team_lock_on_start: e.target.checked })}
                        className="rounded border-slate-700 text-cyan-500"
                      />
                      <span>Lock squad rosters automatically once tournament starts</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Content & Questions Assignment */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>STEP 5: ASSIGN CHALLENGES FROM {form.event_type.toUpperCase()} BANK</span>
              </h3>
              <p className="text-xs text-slate-400">
                Selected challenges will be explicitly linked to this event. Challenges remain locked until event start time.
              </p>
              {loadingQuestions ? (
                <div className="py-8 text-center text-xs font-mono text-cyan-400 animate-pulse">Loading Question Bank...</div>
              ) : availableQuestions.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  No {form.event_type.toUpperCase()} questions found in Question Bank. You can create or import them in the Admin Studio.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableQuestions.map(q => {
                    const isSelected = form.question_ids.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleQuestionToggle(q.id)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-700 text-cyan-500"
                          />
                          <div>
                            <span className="text-xs font-mono text-white font-bold">{q.title}</span>
                            <span className="text-[10px] text-slate-400 ml-2 font-mono">[{q.difficulty || 'Normal'}]</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">{q.points || q.points_positive || 100} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Leaderboard Settings */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>STEP 6: LEADERBOARD & VISIBILITY SETTINGS</span>
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_visible}
                    onChange={(e) => setForm({ ...form, leaderboard_visible: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500"
                  />
                  <span>Enable live tournament leaderboard for participants</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_frozen}
                    onChange={(e) => setForm({ ...form, leaderboard_frozen: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500"
                  />
                  <span>Freeze leaderboard rankings during final countdown</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.show_solve_times}
                    onChange={(e) => setForm({ ...form, show_solve_times: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500"
                  />
                  <span>Display exact solve timestamps on scoreboard</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.anonymize_participants}
                    onChange={(e) => setForm({ ...form, anonymize_participants: e.target.checked })}
                    className="rounded border-slate-700 text-cyan-500"
                  />
                  <span>Anonymize cadet usernames on public leaderboards</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Publish */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-cyan-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>STEP 7: FINAL REVIEW & LIFECYCLE PUBLISHING</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Title:</span>
                  <span className="text-white font-bold">{form.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Event Paradigm:</span>
                  <span className="text-cyan-400 font-bold uppercase">{form.event_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Participation Mode:</span>
                  <span className="text-white capitalize">{form.participation_mode} (Max squad: {form.team_size_max})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Assigned Challenges:</span>
                  <span className="text-white font-bold">{form.question_ids.length} selected</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400">Visibility & Access:</span>
                  <span className="text-emerald-400 uppercase">{form.visibility}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('draft')}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('registration_open')}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Open Registration Now
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('live')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-mono text-xs font-bold"
                >
                  Launch Live Immediately
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          {step < 7 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
