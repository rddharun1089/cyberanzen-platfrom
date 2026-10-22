import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, Calendar, Trophy, Users, Shield, 
  HelpCircle, Code2, AlertTriangle, Eye, Layers, Settings, FileText, CheckCircle2,
  Upload, Image as ImageIcon, Trash2, Smartphone, Monitor, Sparkles, Plus,
  Copy, Shuffle, Lock, Unlock, ArrowDown, ArrowUp, Send
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function EventWizardModal({ isOpen, onClose, onEventCreated, initialTemplate = null }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [domainFilter, setDomainFilter] = useState('all');
  const [copySourceEventId, setCopySourceEventId] = useState('');
  const fileInputRef = useRef(null);

  // Wizard Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    event_type: 'dsa', // 'dsa' | 'ctf' | 'mcq' | 'combined' | 'puzzle'
    short_description: '',
    description: '',
    banner_url: '',
    rules: '1. All flag submissions are rate-limited to prevent brute-forcing.\n2. Do not attack event infrastructure.\n3. Solutions must be your team\'s original work.',
    organizer: 'CyberAnzen Arena',
    category: 'Cybersecurity & Competitive Programming',
    difficulty: 'Intermediate',
    timezone: 'UTC',
    eligibility: 'Open to all authenticated operatives',
    visibility: 'public', // 'public' | 'unlisted' | 'restricted'
    capacity: 200,
    contact_info: 'director@cyberanzen.io',
    // Participation
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
    // Schedule
    start_time: '',
    end_time: '',
    registration_open: true,
    registration_close: '',
    result_publication_time: '',
    // Question & Experience Settings
    question_navigation_policy: 'free', // 'free' | 'sequential' | 'unlock'
    question_order_mode: 'fixed', // 'fixed' | 'random_participant' | 'random_team'
    show_progress: true,
    mark_solved_immediately: true,
    revisit_solved_questions: true,
    clipboard_policy: 'restricted',
    scoring_policy: 'standard',
    // Scoring & Leaderboard
    leaderboard_type: 'individual',
    leaderboard_visible: true,
    leaderboard_frozen: false,
    scores_visible_during_event: true,
    auto_publish_results: true,
    show_solve_times: true,
    show_solve_counts: true,
    anonymize_participants: false,
    // Content
    question_ids: [],
    competition_template_id: null,
    status: 'draft'
  });

  useEffect(() => {
    if (isOpen) {
      if (initialTemplate) {
        setForm(prev => ({
          ...prev,
          event_type: initialTemplate.competition_type || prev.event_type,
          question_navigation_policy: initialTemplate.question_navigation_policy || prev.question_navigation_policy,
          question_order_mode: initialTemplate.question_order_mode || prev.question_order_mode,
          competition_template_id: initialTemplate.id
        }));
      }
      loadBankQuestions(form.event_type);
      loadEventsForCopy();
    }
  }, [isOpen, form.event_type, initialTemplate]);

  const loadEventsForCopy = async () => {
    try {
      const data = await adminService.listEvents();
      setAllEvents(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBankQuestions = async (type) => {
    setLoadingQuestions(true);
    try {
      const evType = (type || '').toLowerCase();
      const hasDsa = evType.includes('dsa') || ['combined', 'all'].includes(evType);
      const hasCtf = evType.includes('ctf') || ['combined', 'all'].includes(evType);
      const hasMcq = evType.includes('mcq') || ['combined', 'all'].includes(evType);

      let all = [];
      if (hasDsa) {
        const dsa = await adminService.listDSA();
        all = all.concat(dsa.map(q => ({ ...q, domain: 'DSA' })));
      }
      if (hasCtf) {
        const ctf = await adminService.listCTF();
        all = all.concat(ctf.map(q => ({ ...q, domain: 'CTF' })));
      }
      if (hasMcq) {
        const mcq = await adminService.listMCQs();
        all = all.concat(mcq.map(q => ({ ...q, domain: 'MCQ' })));
      }
      setAvailableQuestions(all);
    } catch (err) {
      console.error('Failed to load bank questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleBannerSelect = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only PNG, JPG, and WebP images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Banner image must be under 10MB.');
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!form.title.trim() || !form.description.trim()) {
        alert('Event Title and Full Description are mandatory.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 8));
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

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredQuestions.map(q => q.id);
    const combined = Array.from(new Set([...form.question_ids, ...idsToAdd]));
    setForm({ ...form, question_ids: combined });
  };

  const handleDeselectAllFiltered = () => {
    const idsToRemove = new Set(filteredQuestions.map(q => q.id));
    setForm({ ...form, question_ids: form.question_ids.filter(id => !idsToRemove.has(id)) });
  };

  const handleCopyFromOtherEvent = async () => {
    if (!copySourceEventId) return;
    try {
      const source = await adminService.getEvent(copySourceEventId);
      if (source && source.assigned_questions && source.assigned_questions.length > 0) {
        const sourceIds = source.assigned_questions.map(q => q.id);
        const combined = Array.from(new Set([...form.question_ids, ...sourceIds]));
        setForm({ ...form, question_ids: combined });
        alert(`Copied ${sourceIds.length} question associations from '${source.title}'.`);
      } else {
        alert('Source event has no assigned questions.');
      }
    } catch (err) {
      alert('Failed to copy questions from selected event.');
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
        result_publication_time: form.result_publication_time ? new Date(form.result_publication_time).toISOString() : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        team_size_min: parseInt(form.team_size_min),
        team_size_max: parseInt(form.team_size_max)
      };
      const created = await adminService.createEvent(payload);
      const eventId = created?.id || created?.event_id;

      if (bannerFile && eventId) {
        try {
          await adminService.uploadEventBanner(eventId, bannerFile);
        } catch (bErr) {
          console.error('Banner upload error:', bErr);
        }
      }

      if (form.question_ids && form.question_ids.length > 0 && eventId) {
        try {
          await adminService.assignEventQuestions(eventId, form.question_ids);
        } catch (qErr) {
          console.error('Question assignment error:', qErr);
        }
      }

      alert(`Event '${form.title}' created successfully with status '${publishStatus}'!`);
      onEventCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = availableQuestions.filter(q => {
    if (domainFilter === 'all') return true;
    return (q.domain || '').toLowerCase() === domainFilter.toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-[#F2F7FF]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#18385E] flex items-center justify-between bg-[#08172B]">
          <div>
            <span className="text-xs font-mono text-[#00CFFF] uppercase tracking-widest">WIZARD // STEP {step} OF 8</span>
            <h2 className="text-xl font-bold font-mono text-white">Create New Competition Event</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#A9BCD6] hover:text-white hover:bg-[#102746]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8-Step Progress Bar */}
        <div className="grid grid-cols-8 h-1 bg-[#08172B]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <div 
              key={s} 
              className={`h-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-[#087FFF] to-[#00CFFF]' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        {/* Body content per step */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>STEP 1: BASIC INFORMATION &amp; BANNER</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono text-sm focus:border-[#00CFFF]"
                    placeholder="e.g. Winter Cyber Security Invitational 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Unique Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono text-xs focus:border-[#00CFFF]"
                    placeholder="winter-invitational-2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Organizer / Host</label>
                  <input
                    type="text"
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Short Description (for event cards)</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                    placeholder="Brief 1-sentence synopsis for participants browsing events..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Full Description &amp; Mission Brief (Markdown) *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono text-xs focus:border-[#00CFFF]"
                    placeholder="Describe event background, mission storyline, technical focus..."
                  />
                </div>

                {/* Banner Upload Dropzone */}
                <div className="col-span-2 p-4 rounded-xl bg-[#08172B] border border-[#18385E]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-[#00CFFF] flex items-center space-x-1.5 font-bold">
                      <ImageIcon className="w-4 h-4" />
                      <span>EVENT BANNER POSTER</span>
                    </label>
                    {bannerPreview && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#102746] text-[#A9BCD6] hover:text-[#F2F7FF] flex items-center space-x-1 border border-[#18385E]"
                        >
                          {previewMode === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          <span>{previewMode === 'desktop' ? 'Desktop (16:6)' : 'Mobile (16:9)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBannerRemove}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 hover:text-red-300 flex items-center space-x-1 border border-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {bannerPreview ? (
                    <div className={`overflow-hidden rounded-lg border border-[#18385E] relative bg-[#061329] transition-all duration-300 ${previewMode === 'desktop' ? 'h-36 w-full' : 'h-48 max-w-xs mx-auto'}`}>
                      <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#18385E] hover:border-[#00CFFF] rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#061329]/60 hover:bg-[#061329]"
                    >
                      <Upload className="w-8 h-8 text-[#00CFFF] mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-mono text-[#F2F7FF] font-semibold">
                        Drag &amp; drop event banner or <span className="text-[#00CFFF] underline">browse file</span>
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleBannerSelect(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  >
                    <option value="public">Public (Visible to all participants)</option>
                    <option value="unlisted">Unlisted (Direct link only)</option>
                    <option value="restricted">Restricted (Invitation only)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Rules &amp; Code of Conduct</label>
                  <textarea
                    rows={2}
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Select Competition Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>STEP 2: SELECT COMPETITION TEMPLATE &amp; PARADIGM</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* DSA Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'dsa' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'dsa' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <Code2 className="w-6 h-6 text-[#00CFFF] mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">DSA / Competitive Programming</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Uses the existing Monaco code editor &amp; console. Multi-language sandboxed judge verdicts.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] font-mono">Existing Console</span>
                  </div>
                </div>

                {/* CTF Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'ctf' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'ctf' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">Cybersecurity CTF Arena</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Security challenges, dynamic flags, hint progression, and containerized Docker labs.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Docker Labs</span>
                  </div>
                </div>

                {/* MCQ Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'mcq' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'mcq' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <HelpCircle className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">MCQ / Knowledge Quiz</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Multiple-choice questions, timers, negative marking, and attempt policies.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono">Timed Quizzes</span>
                  </div>
                </div>

                {/* Combined Hybrid */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'combined' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all md:col-span-2 ${form.event_type === 'combined' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#00CFFF]" />
                    <h4 className="font-mono font-bold text-white text-sm">Combined Multi-Track Tournament (CTF + DSA + MCQ)</h4>
                  </div>
                  <p className="text-xs text-[#A9BCD6] leading-relaxed">
                    Unlocks all competition tracks simultaneously inside one unified event workspace with joint leaderboard scoring.
                  </p>
                </div>

                {/* Algorithmic Puzzle */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'puzzle' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'puzzle' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">Algorithmic Puzzle Quest</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Logic ciphers, step-by-step mathematical decryptions, and algorithmic puzzles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Participation */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>STEP 3: PARTICIPATION &amp; TEAM SIZE POLICIES</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'individual' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'individual' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                >
                  <h4 className="font-bold text-white text-sm">Solo Mode</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1">Each operative competes independently. Squad creation disabled.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'team' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'team' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                >
                  <h4 className="font-bold text-white text-sm">Team Mode</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1">Operatives collaborate in squads. Squad scores deduplicated atomically.</p>
                </div>
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'mixed' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'mixed' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                >
                  <h4 className="font-bold text-white text-sm">Mixed Mode</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1">Participants choose Solo or Squad during enrollment.</p>
                </div>
              </div>

              {form.participation_mode !== 'individual' && (
                <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Minimum Team Size</label>
                      <input
                        type="number"
                        min={1}
                        max={form.team_size_max}
                        value={form.team_size_min}
                        onChange={(e) => setForm({ ...form, team_size_min: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-[#08172B] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Maximum Team Size (Backend Enforced)</label>
                      <input
                        type="number"
                        min={form.team_size_min}
                        max={10}
                        value={form.team_size_max}
                        onChange={(e) => setForm({ ...form, team_size_max: parseInt(e.target.value) || 4 })}
                        className="w-full px-3 py-2 bg-[#08172B] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <label className="flex items-center space-x-2 text-[#F2F7FF]">
                      <input
                        type="checkbox"
                        checked={form.team_allow_create}
                        onChange={(e) => setForm({ ...form, team_allow_create: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Allow participants to create custom squads</span>
                    </label>
                    <label className="flex items-center space-x-2 text-[#F2F7FF]">
                      <input
                        type="checkbox"
                        checked={form.team_allow_join_code}
                        onChange={(e) => setForm({ ...form, team_allow_join_code: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Allow squad recruitment via invitation tokens</span>
                    </label>
                    <label className="flex items-center space-x-2 text-[#F2F7FF]">
                      <input
                        type="checkbox"
                        checked={form.team_lock_on_start}
                        onChange={(e) => setForm({ ...form, team_lock_on_start: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Lock squad rosters automatically once tournament starts</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Schedule */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>STEP 4: SCHEDULE &amp; PUBLICATION TIMING</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Registration Open Date</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Registration Close Date</label>
                  <input
                    type="datetime-local"
                    value={form.registration_close}
                    onChange={(e) => setForm({ ...form, registration_close: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Event Start Time (UTC) *</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Event End Time (UTC) *</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Timezone</label>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Result Publication Time</label>
                  <input
                    type="datetime-local"
                    value={form.result_publication_time}
                    onChange={(e) => setForm({ ...form, result_publication_time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Question & Challenge Setup */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                    <Trophy className="w-4 h-4" />
                    <span>STEP 5: QUESTION AND CHALLENGE SETUP</span>
                  </h3>
                  <span className="text-xs text-[#A9BCD6]">
                    Assigned Questions: <strong className="text-white font-mono">{form.question_ids.length}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded bg-[#102746] text-[#A9BCD6] hover:text-white text-xs font-mono border border-[#18385E]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="px-2.5 py-1 rounded bg-[#061329] text-[#A9BCD6] hover:text-white text-xs font-mono border border-[#18385E]"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Copy from existing event bar */}
              <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#A9BCD6] flex items-center space-x-1">
                  <Copy className="w-3.5 h-3.5 text-[#00CFFF]" />
                  <span>Copy Questions from Existing Event:</span>
                </span>
                <div className="flex items-center space-x-2">
                  <select
                    value={copySourceEventId}
                    onChange={(e) => setCopySourceEventId(e.target.value)}
                    className="px-2 py-1 bg-[#08172B] border border-[#18385E] rounded text-xs text-white"
                  >
                    <option value="">-- Choose Event --</option>
                    {allEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} ({ev.question_count} qs)</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleCopyFromOtherEvent}
                    disabled={!copySourceEventId}
                    className="px-3 py-1 bg-[#087FFF] hover:bg-[#00CFFF] hover:text-slate-950 text-white font-mono text-xs font-bold rounded transition-colors disabled:opacity-50"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Questions list */}
              {loadingQuestions ? (
                <div className="py-8 text-center text-xs font-mono text-[#00CFFF] animate-pulse">Loading Question Banks...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#061329] border border-[#18385E] text-center text-xs text-[#A9BCD6]">
                  No challenges found in bank. Author or import questions in Admin Studio.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredQuestions.map(q => {
                    const isSelected = form.question_ids.includes(q.id);
                    return (
                      <div
                        key={`${q.domain}-${q.id}`}
                        onClick={() => handleQuestionToggle(q.id)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-[#18385E] text-[#00CFFF]"
                          />
                          <div>
                            <span className="text-xs font-mono text-white font-bold">{q.title}</span>
                            <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded font-mono ${q.domain === 'DSA' ? 'bg-[#087FFF]/20 text-[#00CFFF]' : q.domain === 'CTF' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                              {q.domain}
                            </span>
                            <span className="text-[10px] text-[#A9BCD6] ml-2 font-mono">[{q.difficulty || 'Normal'}]</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#00CFFF]">{q.points || q.points_positive || 100} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Participant Experience Settings */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Shuffle className="w-4 h-4" />
                <span>STEP 6: PARTICIPANT QUESTION EXPERIENCE &amp; NAVIGATION POLICY</span>
              </h3>

              <div className="space-y-4">
                {/* Mode A / B / C */}
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-2 font-bold uppercase">
                    Question Navigation Policy (Backend Enforced)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setForm({ ...form, question_navigation_policy: 'free' })}
                      className={`p-4 rounded-xl border cursor-pointer ${form.question_navigation_policy === 'free' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <Unlock className="w-5 h-5 text-emerald-400 mb-1" />
                      <h4 className="font-bold text-white text-xs">Mode A: Free Navigation</h4>
                      <p className="text-[11px] text-[#A9BCD6] mt-1">Participants can open and solve any assigned question in any order.</p>
                    </div>

                    <div
                      onClick={() => setForm({ ...form, question_navigation_policy: 'sequential' })}
                      className={`p-4 rounded-xl border cursor-pointer ${form.question_navigation_policy === 'sequential' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <Lock className="w-5 h-5 text-amber-400 mb-1" />
                      <h4 className="font-bold text-white text-xs">Mode B: Sequential Navigation</h4>
                      <p className="text-[11px] text-[#A9BCD6] mt-1">Must start with first question; solving Q[n] unlocks Q[n+1].</p>
                    </div>

                    <div
                      onClick={() => setForm({ ...form, question_navigation_policy: 'unlock' })}
                      className={`p-4 rounded-xl border cursor-pointer ${form.question_navigation_policy === 'unlock' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <Trophy className="w-5 h-5 text-purple-400 mb-1" />
                      <h4 className="font-bold text-white text-xs">Mode C: Unlock Rules</h4>
                      <p className="text-[11px] text-[#A9BCD6] mt-1">Later challenges unlock based on point milestones or prereqs.</p>
                    </div>
                  </div>
                </div>

                {/* Randomized Order */}
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-2 font-bold uppercase">
                    Question Ordering
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setForm({ ...form, question_order_mode: 'fixed' })}
                      className={`p-3 rounded-xl border cursor-pointer ${form.question_order_mode === 'fixed' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <span className="font-bold text-xs text-white block">Fixed Order</span>
                      <span className="text-[10px] text-[#A9BCD6]">Same exact question sequence for all participants.</span>
                    </div>

                    <div
                      onClick={() => setForm({ ...form, question_order_mode: 'random_participant' })}
                      className={`p-3 rounded-xl border cursor-pointer ${form.question_order_mode === 'random_participant' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <span className="font-bold text-xs text-white block">Random Order Per Participant</span>
                      <span className="text-[10px] text-[#A9BCD6]">Stable deterministic shuffle per participant session.</span>
                    </div>

                    <div
                      onClick={() => setForm({ ...form, question_order_mode: 'random_team' })}
                      className={`p-3 rounded-xl border cursor-pointer ${form.question_order_mode === 'random_team' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                    >
                      <span className="font-bold text-xs text-white block">Random Order Per Squad</span>
                      <span className="text-[10px] text-[#A9BCD6]">Stable deterministic shuffle per squad.</span>
                    </div>
                  </div>
                </div>

                {/* Progress & Revisit Settings */}
                <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-2 text-xs">
                  <span className="text-xs font-mono text-[#00CFFF] block font-bold mb-1">Experience Settings</span>
                  <label className="flex items-center space-x-2 text-[#F2F7FF]">
                    <input
                      type="checkbox"
                      checked={form.show_progress}
                      onChange={(e) => setForm({ ...form, show_progress: e.target.checked })}
                      className="rounded border-[#18385E] text-[#00CFFF]"
                    />
                    <span>Show live solve progress (e.g. "Solved 8 / 20")</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[#F2F7FF]">
                    <input
                      type="checkbox"
                      checked={form.mark_solved_immediately}
                      onChange={(e) => setForm({ ...form, mark_solved_immediately: e.target.checked })}
                      className="rounded border-[#18385E] text-[#00CFFF]"
                    />
                    <span>Mark challenges as solved immediately upon verdict</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[#F2F7FF]">
                    <input
                      type="checkbox"
                      checked={form.revisit_solved_questions}
                      onChange={(e) => setForm({ ...form, revisit_solved_questions: e.target.checked })}
                      className="rounded border-[#18385E] text-[#00CFFF]"
                    />
                    <span>Allow participants to revisit already-solved questions</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Scoring and Leaderboard */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>STEP 7: SCORING &amp; LEADERBOARD CONTROLS</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Scoring Mode</label>
                  <select
                    value={form.scoring_policy}
                    onChange={(e) => setForm({ ...form, scoring_policy: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                  >
                    <option value="standard">Standard Points (Fixed per problem)</option>
                    <option value="dynamic">Dynamic Decay (Points decrease with more solves)</option>
                    <option value="first_solve_bonus">First Solve Bonus (Extra points for first blood)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Leaderboard Type</label>
                  <select
                    value={form.leaderboard_type}
                    onChange={(e) => setForm({ ...form, leaderboard_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                  >
                    <option value="individual">Individual Leaderboard</option>
                    <option value="team">Team / Squad Leaderboard</option>
                    <option value="both">Both Individual and Squad</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-2 text-xs">
                <label className="flex items-center space-x-2 text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_visible}
                    onChange={(e) => setForm({ ...form, leaderboard_visible: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Display tournament scoreboard to participants</span>
                </label>
                <label className="flex items-center space-x-2 text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_frozen}
                    onChange={(e) => setForm({ ...form, leaderboard_frozen: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Freeze scoreboard during final tournament countdown</span>
                </label>
                <label className="flex items-center space-x-2 text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.anonymize_participants}
                    onChange={(e) => setForm({ ...form, anonymize_participants: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Anonymize participant usernames on public leaderboard</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 8: Review & Publish */}
          {step === 8 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>STEP 8: FINAL CONFIGURATION REVIEW &amp; PUBLISHING</span>
              </h3>

              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Event Title:</span>
                  <span className="text-white font-bold">{form.title}</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Competition Type:</span>
                  <span className="text-[#00CFFF] font-bold uppercase">{form.event_type}</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Participation Mode:</span>
                  <span className="text-white capitalize">{form.participation_mode} (Max Squad: {form.team_size_max})</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Assigned Questions:</span>
                  <span className="text-emerald-400 font-bold">{form.question_ids.length} questions attached</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Navigation Policy:</span>
                  <span className="text-white capitalize">{form.question_navigation_policy} ({form.question_order_mode})</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Scoring &amp; Leaderboard:</span>
                  <span className="text-white capitalize">{form.scoring_policy} scoring ({form.leaderboard_type})</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#A9BCD6]">Visibility:</span>
                  <span className="text-emerald-400 uppercase">{form.visibility}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('draft')}
                  className="px-4 py-2.5 rounded-xl border border-[#18385E] bg-[#08172B] hover:bg-[#102746] text-[#F2F7FF] text-xs font-mono"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('registration_open')}
                  className="px-4 py-2.5 rounded-xl bg-[#087FFF] hover:bg-[#00CFFF] hover:text-slate-950 text-white font-mono text-xs font-semibold shadow-[0_0_15px_rgba(8,127,255,0.4)] transition-all"
                >
                  Open Registration Now
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit('active')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#20C997] hover:opacity-90 text-slate-950 font-mono text-xs font-bold shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch &amp; Publish Immediately</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-[#18385E] flex justify-between items-center bg-[#08172B]">
          <button
            type="button"
            disabled={step === 1}
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono text-[#A9BCD6] hover:text-white border border-[#18385E] disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {step < 8 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-md transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-mono text-[#A9BCD6]">Review configuration before publishing</span>
          )}
        </div>
      </div>
    </div>
  );
}
