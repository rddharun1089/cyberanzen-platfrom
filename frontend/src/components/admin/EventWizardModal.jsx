import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, Calendar, Trophy, Users, Shield, 
  HelpCircle, Code2, AlertTriangle, Eye, Layers, Settings, FileText, CheckCircle2,
  Upload, Image as ImageIcon, Trash2, Smartphone, Monitor, Sparkles
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function EventWizardModal({ isOpen, onClose, onEventCreated }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [domainFilter, setDomainFilter] = useState('all');
  const fileInputRef = useRef(null);

  // Wizard Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    event_type: 'ctf', // 'ctf' | 'dsa' | 'mcq' | 'ctf_dsa' | 'dsa_mcq' | 'ctf_mcq' | 'combined'
    short_description: '',
    description: '',
    banner_url: '',
    rules: '',
    organizer: 'CyberAnzen Arena',
    category: 'Cybersecurity & Programming',
    difficulty: 'Intermediate',
    timezone: 'UTC',
    eligibility: 'Open to all authenticated operatives',
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
      <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F2F7FF]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#18385E] flex items-center justify-between bg-[#08172B]">
          <div>
            <span className="text-xs font-mono text-[#00CFFF] uppercase tracking-widest">WIZARD // STEP {step} OF 7</span>
            <h2 className="text-xl font-bold font-mono text-white">Create New Competition Event</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#A9BCD6] hover:text-white hover:bg-[#102746]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-7 h-1 bg-[#08172B]">
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <div 
              key={s} 
              className={`h-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-[#087FFF] to-[#00CFFF]' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        {/* Body content per step */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* STEP 1: Basic Info & Banner */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>STEP 1: BASIC EVENT INFORMATION & BRANDING</span>
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
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Unique Slug (Auto-generated if empty)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono text-xs focus:border-[#00CFFF]"
                    placeholder="winter-invitational-2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Organizer</label>
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
                    placeholder="Brief 1-line teaser for tournament listings..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Full Description & Mission Brief (Markdown) *</label>
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
                      <span>EVENT BANNER IMAGE (DRAG & DROP / UPLOAD)</span>
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
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-[#00CFFF]">
                        Live Preview ({previewMode})
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files?.[0]) handleBannerSelect(e.dataTransfer.files[0]);
                      }}
                      className="border-2 border-dashed border-[#18385E] hover:border-[#00CFFF] rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#061329]/60 hover:bg-[#061329]"
                    >
                      <Upload className="w-8 h-8 text-[#00CFFF] mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-mono text-[#F2F7FF] font-semibold">
                        Drag & drop event banner or <span className="text-[#00CFFF] underline">browse file</span>
                      </p>
                      <p className="text-[10px] text-[#A9BCD6] mt-1 font-mono">
                        PNG, JPG, or WebP up to 10MB. Will fallback gracefully to CyberAnzen arena theme if omitted.
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
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Start Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">End Date & Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
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
                    <option value="public">Public (Listed on event dashboard)</option>
                    <option value="unlisted">Unlisted (Accessible via direct link)</option>
                    <option value="restricted">Restricted (Invitation only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Participant Capacity (Optional)</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs"
                    placeholder="e.g. 200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Event Type / Combined Paradigms */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>STEP 2: SELECT EVENT DOMAIN & COMBINED MODES</span>
              </h3>
              <p className="text-xs text-[#A9BCD6]">
                Choose the competition paradigm. Supports standalone tournaments as well as combined multi-domain events (CTF+DSA, DSA+MCQ, etc.).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {/* DSA Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'dsa' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'dsa' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <Code2 className="w-6 h-6 text-[#00CFFF] mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">DSA / Competitive</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Algorithmic problems evaluated inside safe Linux sandboxes for Python 3, C, and C++.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] font-mono">Sandbox Judge</span>
                  </div>
                </div>

                {/* CTF Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'ctf' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'ctf' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">Cybersecurity CTF</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Capture The Flag across Web, Forensics, Reverse, Crypto, Puzzles, and Docker labs.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Docker Labs</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">Puzzles</span>
                  </div>
                </div>

                {/* MCQ Option */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'mcq' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'mcq' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <HelpCircle className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="font-mono font-bold text-white text-sm">MCQ / Quiz Assessment</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Multiple-choice assessments with question timers, negative marks, and explanations.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono">Timed Quizzes</span>
                  </div>
                </div>

                {/* CTF + DSA Combined */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'ctf_dsa' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'ctf_dsa' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-mono text-[#A9BCD6]">+</span>
                    <Code2 className="w-5 h-5 text-[#00CFFF]" />
                  </div>
                  <h4 className="font-mono font-bold text-white text-sm">CTF + DSA Hybrid</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Combined hacking exploits and algorithmic challenges in a unified workspace.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-mono">Combined Hybrid</span>
                  </div>
                </div>

                {/* DSA + MCQ Combined */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'dsa_mcq' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'dsa_mcq' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Code2 className="w-5 h-5 text-[#00CFFF]" />
                    <span className="text-xs font-mono text-[#A9BCD6]">+</span>
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h4 className="font-mono font-bold text-white text-sm">DSA + MCQ Assessment</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Evaluates both foundational computer science theory and practical code implementation.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-mono">Theory & Code</span>
                  </div>
                </div>

                {/* CTF + MCQ Combined */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'ctf_mcq' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.event_type === 'ctf_mcq' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-mono text-[#A9BCD6]">+</span>
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h4 className="font-mono font-bold text-white text-sm">CTF + MCQ Knowledge</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1 leading-relaxed">
                    Combines cybersecurity quiz assessments with hands-on CTF flag challenges.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-400 font-mono">Security Focus</span>
                  </div>
                </div>

                {/* All-in-One Triathlon */}
                <div
                  onClick={() => setForm({ ...form, event_type: 'combined' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all md:col-span-3 ${form.event_type === 'combined' ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.2)]' : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#00CFFF]" />
                    <h4 className="font-mono font-bold text-white text-sm">All-in-One Arena (CTF + DSA + MCQ)</h4>
                  </div>
                  <p className="text-xs text-[#A9BCD6] leading-relaxed">
                    The ultimate CyberAnzen multi-discipline tournament. Unlocks CTF Challenges, Docker Labs, DSA Judge, and MCQ Quizzes simultaneously in one participant workspace.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#087FFF]/20 text-[#00CFFF] font-mono border border-[#087FFF]/40">Full Suite Arena</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Participation Mode */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>STEP 3: PARTICIPATION MODE</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setForm({ ...form, participation_mode: 'individual' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${form.participation_mode === 'individual' ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                >
                  <h4 className="font-bold text-white text-sm">Solo Mode</h4>
                  <p className="text-xs text-[#A9BCD6] mt-1">Each operative competes and ranks independently. Squad creation disabled.</p>
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
                  <p className="text-xs text-[#A9BCD6] mt-1">Participants choose Solo or Squad during enrollment. Separate leaderboards.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Team Configuration */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>STEP 4: TEAM & SQUAD POLICY CONTROLS</span>
              </h3>
              {form.participation_mode === 'individual' ? (
                <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] text-[#A9BCD6] text-xs">
                  Event is configured as Solo Mode. Squad policy configuration is disabled for this tournament.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Maximum Team Size (Backend Enforced)</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={form.team_size_max}
                      onChange={(e) => setForm({ ...form, team_size_max: parseInt(e.target.value) || 4 })}
                      className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Fifth member strictly blocked by backend if set to 4.</span>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A9BCD6] mb-1">Minimum Team Size</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={form.team_size_min}
                      onChange={(e) => setForm({ ...form, team_size_min: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-2 space-y-2 pt-2">
                    <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                      <input
                        type="checkbox"
                        checked={form.team_allow_create}
                        onChange={(e) => setForm({ ...form, team_allow_create: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Allow participants to create custom squads</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                      <input
                        type="checkbox"
                        checked={form.team_allow_join_code}
                        onChange={(e) => setForm({ ...form, team_allow_join_code: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Allow squad recruitment via invitation tokens</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
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

          {/* STEP 5: Content & Questions Assignment */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>STEP 5: ASSIGN CHALLENGES ({form.event_type.toUpperCase()})</span>
                </h3>

                {/* Filter buttons if multiple domains exist */}
                <div className="flex items-center space-x-1">
                  {['all', 'dsa', 'ctf', 'mcq'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDomainFilter(f)}
                      className={`px-2 py-1 rounded text-[10px] font-mono uppercase transition-colors ${domainFilter === f ? 'bg-[#00CFFF] text-slate-950 font-bold' : 'bg-[#08172B] text-[#A9BCD6] hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#A9BCD6]">
                Selected challenges will be explicitly linked to this event. Challenges remain locked until event start time.
              </p>

              {loadingQuestions ? (
                <div className="py-8 text-center text-xs font-mono text-[#00CFFF] animate-pulse">Loading Question Banks...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#061329] border border-[#18385E] text-center text-xs text-[#A9BCD6]">
                  No matching challenges found in question bank. You can create or import them in the Admin Studio.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
                            <span className="text-[10px] text-[#A9BCD6] ml-2 font-mono">[{q.difficulty || q.category || 'Normal'}]</span>
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

          {/* STEP 6: Leaderboard Settings */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>STEP 6: LEADERBOARD & VISIBILITY SETTINGS</span>
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_visible}
                    onChange={(e) => setForm({ ...form, leaderboard_visible: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Enable live tournament leaderboard for participants</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.leaderboard_frozen}
                    onChange={(e) => setForm({ ...form, leaderboard_frozen: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Freeze leaderboard rankings during final countdown</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.show_solve_times}
                    onChange={(e) => setForm({ ...form, show_solve_times: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Display exact solve timestamps on scoreboard</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-[#F2F7FF]">
                  <input
                    type="checkbox"
                    checked={form.anonymize_participants}
                    onChange={(e) => setForm({ ...form, anonymize_participants: e.target.checked })}
                    className="rounded border-[#18385E] text-[#00CFFF]"
                  />
                  <span>Anonymize cadet usernames on public leaderboards</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: Review & Publish */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono text-[#00CFFF] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>STEP 7: FINAL REVIEW & LIFECYCLE PUBLISHING</span>
              </h3>
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Title:</span>
                  <span className="text-white font-bold">{form.title}</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Event Paradigm:</span>
                  <span className="text-[#00CFFF] font-bold uppercase">{form.event_type}</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Participation Mode:</span>
                  <span className="text-white capitalize">{form.participation_mode} (Max squad: {form.team_size_max})</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Assigned Challenges:</span>
                  <span className="text-white font-bold">{form.question_ids.length} selected</span>
                </div>
                <div className="flex justify-between border-b border-[#18385E] pb-2">
                  <span className="text-[#A9BCD6]">Custom Banner:</span>
                  <span className={bannerFile ? "text-emerald-400 font-bold" : "text-slate-400"}>
                    {bannerFile ? bannerFile.name : 'Default Theme Banner'}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#A9BCD6]">Visibility & Access:</span>
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
        <div className="px-6 py-4 border-t border-[#18385E] bg-[#08172B] flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-mono text-[#A9BCD6] hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          {step < 7 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,207,255,0.3)]"
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
