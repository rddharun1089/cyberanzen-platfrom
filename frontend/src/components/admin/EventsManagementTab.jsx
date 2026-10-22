import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Trophy, Plus, Users, Shield, Clock, 
  Trash2, CheckCircle2, AlertOctagon, Settings, Layers, Play,
  Image as ImageIcon, Upload, X, Smartphone, Monitor, ArrowUp, ArrowDown,
  ArrowRight, ExternalLink, Copy, Shuffle, Lock, Unlock, HelpCircle, Code2, Flag
} from 'lucide-react';
import { adminService } from '../../services/api';
import EventWizardModal from './EventWizardModal';

export default function EventsManagementTab({ onOpenWizard, preselectedTemplate = null }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [questionBreakdown, setQuestionBreakdown] = useState(null);
  const [questionModalTab, setQuestionModalTab] = useState('list'); // 'list' | 'add_bank' | 'copy_event' | 'experience'
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [pointsOverrides, setPointsOverrides] = useState({});
  const [copySourceId, setCopySourceId] = useState('');
  const [savingReorder, setSavingReorder] = useState(false);

  // Question Experience State
  const [expForm, setExpForm] = useState({
    question_navigation_policy: 'free',
    question_order_mode: 'fixed',
    show_progress: true,
    mark_solved_immediately: true,
    revisit_solved_questions: true
  });

  // Banner modal state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await adminService.listEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await adminService.updateEventStatus(eventId, newStatus);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update event status.');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to permanently delete this competition event?')) return;
    try {
      await adminService.deleteEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert('Failed to delete event.');
    }
  };

  // Open Event-Specific Question Management Modal
  const openQuestionModal = async (ev) => {
    setTargetEvent(ev);
    setQuestionModalTab('list');
    setSelectedBankIds([]);
    setPointsOverrides({});
    setCopySourceId('');
    setExpForm({
      question_navigation_policy: ev.question_navigation_policy || 'free',
      question_order_mode: ev.question_order_mode || 'fixed',
      show_progress: ev.show_progress !== false,
      mark_solved_immediately: ev.mark_solved_immediately !== false,
      revisit_solved_questions: ev.revisit_solved_questions !== false
    });

    try {
      const breakdown = await adminService.getEventQuestionBreakdown(ev.id);
      setQuestionBreakdown(breakdown);

      // Load bank questions for adding
      const evType = (ev.event_type || '').toLowerCase();
      const hasDsa = evType.includes('dsa') || ['combined', 'all'].includes(evType);
      const hasCtf = evType.includes('ctf') || ['combined', 'all'].includes(evType);
      const hasMcq = evType.includes('mcq') || ['combined', 'all'].includes(evType);

      let bank = [];
      if (hasDsa) {
        const dsa = await adminService.listDSA();
        bank = bank.concat(dsa.map(q => ({ ...q, domain: 'dsa' })));
      }
      if (hasCtf) {
        const ctf = await adminService.listCTF();
        bank = bank.concat(ctf.map(q => ({ ...q, domain: 'ctf' })));
      }
      if (hasMcq) {
        const mcq = await adminService.listMCQs();
        bank = bank.concat(mcq.map(q => ({ ...q, domain: 'mcq' })));
      }
      setBankQuestions(bank);
      setQuestionModalOpen(true);
    } catch (err) {
      alert('Failed to load event question breakdown.');
    }
  };

  // Move Question Up / Down
  const handleMoveQuestion = async (index, direction) => {
    if (!questionBreakdown || !questionBreakdown.questions) return;
    const items = [...questionBreakdown.questions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap order
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    // Update order_index
    const reorderPayload = items.map((item, idx) => ({
      domain: item.domain,
      question_id: item.question_id,
      order_index: idx
    }));

    setSavingReorder(true);
    try {
      await adminService.reorderEventQuestions(targetEvent.id, reorderPayload);
      const updated = await adminService.getEventQuestionBreakdown(targetEvent.id);
      setQuestionBreakdown(updated);
      await loadEvents();
    } catch (err) {
      alert('Failed to reorder questions.');
    } finally {
      setSavingReorder(false);
    }
  };

  // Remove question from event (detaches without deleting template)
  const handleRemoveQuestionFromEvent = async (item) => {
    if (!window.confirm(`Detach question "${item.title}" from '${targetEvent.title}'? The question will remain intact in the shared Question Bank.`)) return;
    try {
      await adminService.removeQuestionFromEvent(targetEvent.id, item.domain, item.question_id);
      const updated = await adminService.getEventQuestionBreakdown(targetEvent.id);
      setQuestionBreakdown(updated);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove question.');
    }
  };

  // Save additional questions from Question Bank
  const handleAttachFromBank = async () => {
    if (!selectedBankIds.length) return;
    try {
      for (const qid of selectedBankIds) {
        const q = bankQuestions.find(item => item.id === qid);
        if (q) {
          await adminService.copyQuestionsToEvent(targetEvent.id, {
            questionIds: [qid],
            domain: q.domain || 'dsa',
            pointsOverride: pointsOverrides[qid] || null
          });
        }
      }
      alert('Questions attached successfully!');
      setSelectedBankIds([]);
      setPointsOverrides({});
      const updated = await adminService.getEventQuestionBreakdown(targetEvent.id);
      setQuestionBreakdown(updated);
      setQuestionModalTab('list');
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to attach questions.');
    }
  };

  // Copy questions from another event
  const handleCopyFromAnotherEvent = async () => {
    if (!copySourceId) return;
    try {
      const source = await adminService.getEvent(copySourceId);
      if (source && source.assigned_questions && source.assigned_questions.length > 0) {
        for (const q of source.assigned_questions) {
          await adminService.copyQuestionsToEvent(targetEvent.id, {
            questionIds: [q.id],
            domain: (q.domain || 'dsa').toLowerCase(),
            pointsOverride: q.points || null
          });
        }
        alert(`Copied ${source.assigned_questions.length} questions from '${source.title}' to '${targetEvent.title}'.`);
        const updated = await adminService.getEventQuestionBreakdown(targetEvent.id);
        setQuestionBreakdown(updated);
        setQuestionModalTab('list');
        await loadEvents();
      } else {
        alert('Source event has no assigned questions.');
      }
    } catch (err) {
      alert('Failed to copy questions from event.');
    }
  };

  // Save Question Experience Settings
  const handleSaveExperience = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateEventQuestionExperience(targetEvent.id, expForm);
      alert('Participant question experience policies updated successfully!');
      await loadEvents();
    } catch (err) {
      alert('Failed to save experience policies.');
    }
  };

  // Banner Handlers
  const openBannerModal = (ev) => {
    setTargetEvent(ev);
    setBannerFile(null);
    setBannerPreview(ev.banner_url || null);
    setBannerModalOpen(true);
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

  const handleSaveBanner = async () => {
    if (!targetEvent || !bannerFile) return;
    setBannerUploading(true);
    try {
      await adminService.uploadEventBanner(targetEvent.id, bannerFile);
      alert('Event banner updated successfully!');
      setBannerModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload event banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!targetEvent) return;
    if (!window.confirm('Remove custom banner for this event? It will fallback to the official CyberAnzen banner.')) return;
    setBannerUploading(true);
    try {
      await adminService.removeEventBanner(targetEvent.id);
      setBannerPreview(null);
      setBannerFile(null);
      alert('Event banner removed.');
      setBannerModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert('Failed to remove banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#F2F7FF]">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#00CFFF]" />
            <span>EVENT BUILDER &amp; TOURNAMENT ORCHESTRATION</span>
          </h3>
          <p className="text-xs text-[#A9BCD6] mt-1">
            Configure algorithmic coding battles, cybersecurity CTFs, and MCQ assessments with custom banners and team policies.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-[#087FFF] to-[#00CFFF] hover:opacity-95 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE EVENT WIZARD</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#00CFFF] animate-pulse">
            Querying Tournament Registry...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-[#A9BCD6] text-xs font-mono">
            No events scheduled. Click "Create Event Wizard" above to schedule a competition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#08172B] text-[#A9BCD6] font-mono uppercase text-[10px] tracking-wider border-b border-[#18385E]">
                <tr>
                  <th className="p-3">Title &amp; Type</th>
                  <th className="p-3">Participation</th>
                  <th className="p-3">Questions &amp; Challenges</th>
                  <th className="p-3">Operatives</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18385E]/60 font-mono">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-[#102746]/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] text-[#A9BCD6] font-mono">
                        slug: /{ev.slug} • type: <span className="text-[#00CFFF] uppercase font-bold">{ev.event_type}</span>
                        {ev.banner_url && <span className="text-emerald-400 ml-2 font-semibold">• Banner Attached</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[#F2F7FF] capitalize text-xs">
                        {ev.participation_mode}
                      </span>
                      {ev.participation_mode !== 'individual' && (
                        <div className="text-[10px] text-[#A9BCD6]">Max squad: {ev.team_size_max}</div>
                      )}
                    </td>

                    {/* Question Count Button */}
                    <td className="p-3 text-[#F2F7FF]">
                      <button
                        onClick={() => openQuestionModal(ev)}
                        className="px-2.5 py-1 rounded-lg bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] border border-[#18385E] hover:border-[#00CFFF] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                        title="Click to view and manage event questions"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Questions: {ev.question_count}</span>
                        <ArrowRight className="w-3 h-3 ml-0.5 opacity-70" />
                      </button>
                    </td>

                    <td className="p-3 text-[#F2F7FF] text-[11px]">
                      <span>{ev.registration_count} registered</span>
                      {ev.team_count > 0 && <span className="text-[#A9BCD6] ml-1">({ev.team_count} squads)</span>}
                    </td>

                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        ev.status === 'live' || ev.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
                        ev.status === 'registration_open' ? 'bg-[#087FFF]/20 text-[#00CFFF] border border-[#087FFF]/50' :
                        ev.status === 'draft' ? 'bg-[#102746] text-[#A9BCD6]' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>

                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openQuestionModal(ev)}
                        className="px-2 py-1 rounded bg-[#08172B] hover:bg-[#102746] text-[#00CFFF] border border-[#18385E] text-[10px]"
                        title="View and reorder questions"
                      >
                        View Questions
                      </button>

                      <a
                        href={`/events/${ev.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-[#061329] hover:bg-[#102746] text-[#A9BCD6] hover:text-white border border-[#18385E] text-[10px] inline-flex items-center space-x-1"
                        title="Preview Participant Workspace"
                      >
                        <span>Preview</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => openBannerModal(ev)}
                        className="px-2 py-1 rounded bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] border border-[#18385E] text-[10px] inline-flex items-center space-x-1"
                        title="Manage Event Banner"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Banner</span>
                      </button>

                      {/* Status quick toggles */}
                      {ev.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'registration_open')}
                          className="px-2 py-1 rounded bg-[#102746] hover:bg-[#18385E] text-slate-200 text-[10px]"
                        >
                          Open Reg
                        </button>
                      )}
                      {ev.status === 'registration_open' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'live')}
                          className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-[10px]"
                        >
                          Go Live
                        </button>
                      )}
                      {ev.status === 'live' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'ended')}
                          className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 text-[10px]"
                        >
                          End
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="p-1 rounded text-[#A9BCD6] hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Wizard Modal */}
      <EventWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onEventCreated={loadEvents}
        initialTemplate={preselectedTemplate}
      />

      {/* =========================================================================
          EVENT-SPECIFIC QUESTION MANAGEMENT MODAL
          (Breadcrumb: Admin → Events → [Event Name] → Questions)
          ========================================================================= */}
      {questionModalOpen && targetEvent && questionBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F2F7FF]">
            {/* Header & Breadcrumb */}
            <div className="p-4 border-b border-[#18385E] bg-[#061329] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#A9BCD6] mb-1">
                  <span>Admin</span>
                  <span>→</span>
                  <span>Events</span>
                  <span>→</span>
                  <span className="text-[#00CFFF] font-bold">{targetEvent.title}</span>
                  <span>→</span>
                  <span className="text-white">Questions</span>
                </div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-[#00CFFF]" />
                  <span>Event Question Management</span>
                </h3>
              </div>
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Question Breakdown Stat Banner */}
            <div className="p-4 bg-[#08172B] border-b border-[#18385E] grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Total Questions</span>
                <span className="text-sm font-bold text-white">{questionBreakdown.total_questions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Published</span>
                <span className="text-sm font-bold text-emerald-400">{questionBreakdown.published_questions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Draft</span>
                <span className="text-sm font-bold text-amber-400">{questionBreakdown.draft_questions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Total Points</span>
                <span className="text-sm font-bold text-[#00CFFF]">{questionBreakdown.total_points} pts</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Question Types</span>
                <span className="text-xs text-[#A9BCD6]">
                  DSA:{questionBreakdown.question_types?.dsa || 0} CTF:{questionBreakdown.question_types?.ctf || 0} MCQ:{questionBreakdown.question_types?.mcq || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E]">
                <span className="text-[10px] text-slate-500 block uppercase">Nav Policy</span>
                <span className="text-xs text-white capitalize">{questionBreakdown.navigation_policy}</span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#18385E] bg-[#0B1D38] px-4 pt-2 space-x-2 text-xs font-mono">
              <button
                onClick={() => setQuestionModalTab('list')}
                className={`px-3 py-2 border-b-2 font-bold transition-colors ${questionModalTab === 'list' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                Assigned Questions ({questionBreakdown.questions?.length || 0})
              </button>
              <button
                onClick={() => setQuestionModalTab('add_bank')}
                className={`px-3 py-2 border-b-2 font-bold transition-colors ${questionModalTab === 'add_bank' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                + Add from Bank
              </button>
              <button
                onClick={() => setQuestionModalTab('copy_event')}
                className={`px-3 py-2 border-b-2 font-bold transition-colors ${questionModalTab === 'copy_event' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                Copy from Event
              </button>
              <button
                onClick={() => setQuestionModalTab('experience')}
                className={`px-3 py-2 border-b-2 font-bold transition-colors ${questionModalTab === 'experience' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                Experience &amp; Flow Settings
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 font-mono text-xs">
              
              {/* TAB 1: Assigned Questions with Reordering */}
              {questionModalTab === 'list' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[#A9BCD6] text-[11px]">
                    <span>Use Move Up / Move Down to order questions according to tournament progression rules.</span>
                    {savingReorder && <span className="text-[#00CFFF] animate-pulse">Saving order...</span>}
                  </div>

                  {(!questionBreakdown.questions || questionBreakdown.questions.length === 0) ? (
                    <div className="p-8 text-center text-[#A9BCD6] bg-[#061329] rounded-xl border border-[#18385E]">
                      No challenges attached to this event yet. Use "+ Add from Bank" or "Copy from Event".
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questionBreakdown.questions.map((item, idx) => (
                        <div
                          key={`${item.domain}-${item.question_id}`}
                          className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between gap-3 hover:border-[#087FFF] transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-7 h-7 rounded-lg bg-[#102746] text-[#00CFFF] font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="text-white font-bold text-xs">{item.title}</span>
                              <div className="flex items-center space-x-2 text-[10px] text-[#A9BCD6] mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded uppercase font-bold ${
                                  item.domain === 'dsa' ? 'bg-[#087FFF]/20 text-[#00CFFF]' :
                                  item.domain === 'ctf' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                                }`}>
                                  {item.domain}
                                </span>
                                <span>{item.difficulty}</span>
                                <span>•</span>
                                <span>{item.points} pts</span>
                                <span className={`px-1 rounded text-[9px] ${item.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  [{item.status}]
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Reorder Buttons */}
                            <button
                              disabled={idx === 0 || savingReorder}
                              onClick={() => handleMoveQuestion(idx, -1)}
                              className="p-1.5 rounded bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] disabled:opacity-30"
                              title="Move Question Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === questionBreakdown.questions.length - 1 || savingReorder}
                              onClick={() => handleMoveQuestion(idx, 1)}
                              className="p-1.5 rounded bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] disabled:opacity-30"
                              title="Move Question Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Detach button */}
                            <button
                              onClick={() => handleRemoveQuestionFromEvent(item)}
                              className="p-1.5 rounded bg-rose-950/50 hover:bg-rose-900 text-rose-400 border border-rose-800 ml-2"
                              title="Detach from Event (does not delete shared template)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Add from Bank */}
              {questionModalTab === 'add_bank' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#A9BCD6]">Select challenges from Question Bank to link with this event:</span>
                    <span className="text-[#00CFFF] font-bold">{selectedBankIds.length} selected</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {bankQuestions.map(q => {
                      const isSelected = selectedBankIds.includes(q.id);
                      return (
                        <div
                          key={`${q.domain}-${q.id}`}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer ${isSelected ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'}`}
                        >
                          <label className="flex items-center space-x-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) setSelectedBankIds(selectedBankIds.filter(id => id !== q.id));
                                else setSelectedBankIds([...selectedBankIds, q.id]);
                              }}
                              className="rounded border-[#18385E] text-[#00CFFF]"
                            />
                            <div>
                              <span className="text-white font-bold">{q.title}</span>
                              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-[#08172B] text-[#A9BCD6] uppercase">
                                {q.domain}
                              </span>
                            </div>
                          </label>

                          {isSelected && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-[#A9BCD6]">Points:</span>
                              <input
                                type="number"
                                placeholder={q.points || 100}
                                value={pointsOverrides[q.id] || ''}
                                onChange={(e) => setPointsOverrides({ ...pointsOverrides, [q.id]: parseInt(e.target.value) || undefined })}
                                className="w-16 px-2 py-1 bg-[#08172B] border border-[#18385E] rounded text-[#00CFFF] text-xs font-mono"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleAttachFromBank}
                      disabled={!selectedBankIds.length}
                      className="px-5 py-2 rounded-xl bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-bold disabled:opacity-40"
                    >
                      Attach Selected ({selectedBankIds.length})
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Copy from Another Event */}
              {questionModalTab === 'copy_event' && (
                <div className="space-y-4 p-4 rounded-xl bg-[#061329] border border-[#18385E]">
                  <h4 className="text-white font-bold text-sm">Copy Question Set from Another Tournament</h4>
                  <p className="text-slate-400 text-xs">
                    This copies question associations directly into '{targetEvent.title}'. 
                    It creates explicit target attachments and does not alter the source event or question templates.
                  </p>

                  <div className="space-y-2 pt-2">
                    <label className="block text-[#A9BCD6] text-xs">Select Source Event:</label>
                    <select
                      value={copySourceId}
                      onChange={(e) => setCopySourceId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#08172B] border border-[#18385E] rounded-xl text-white"
                    >
                      <option value="">-- Choose Source Event --</option>
                      {events.filter(e => e.id !== targetEvent.id).map(e => (
                        <option key={e.id} value={e.id}>{e.title} ({e.question_count} questions)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleCopyFromAnotherEvent}
                      disabled={!copySourceId}
                      className="px-5 py-2 rounded-xl bg-[#087FFF] hover:bg-[#00CFFF] hover:text-slate-950 text-white font-bold disabled:opacity-40"
                    >
                      Copy Questions into Target Event
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Experience & Flow Settings */}
              {questionModalTab === 'experience' && (
                <form onSubmit={handleSaveExperience} className="space-y-4">
                  <div>
                    <label className="block text-[#A9BCD6] mb-1 font-bold">Question Navigation Policy</label>
                    <select
                      value={expForm.question_navigation_policy}
                      onChange={(e) => setExpForm({ ...expForm, question_navigation_policy: e.target.value })}
                      className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white"
                    >
                      <option value="free">Mode A: Free Navigation (Any order allowed)</option>
                      <option value="sequential">Mode B: Sequential Navigation (Solve Q[n] to unlock Q[n+1])</option>
                      <option value="unlock">Mode C: Unlock Rules (Score threshold unlocking)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#A9BCD6] mb-1 font-bold">Question Ordering</label>
                    <select
                      value={expForm.question_order_mode}
                      onChange={(e) => setExpForm({ ...expForm, question_order_mode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white"
                    >
                      <option value="fixed">Fixed Order (Identical for all participants)</option>
                      <option value="random_participant">Random Order Per Participant (Stable session seed)</option>
                      <option value="random_team">Random Order Per Squad (Stable squad seed)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2 p-3 rounded-xl bg-[#061329] border border-[#18385E]">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={expForm.show_progress}
                        onChange={(e) => setExpForm({ ...expForm, show_progress: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Show live progress (e.g. "Solved 8 / 20")</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={expForm.mark_solved_immediately}
                        onChange={(e) => setExpForm({ ...expForm, mark_solved_immediately: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Mark questions as solved immediately upon verdict</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        checked={expForm.revisit_solved_questions}
                        onChange={(e) => setExpForm({ ...expForm, revisit_solved_questions: e.target.checked })}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span>Allow revisiting already-solved questions</span>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-bold"
                    >
                      Save Experience Policies
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#18385E] bg-[#061329] flex justify-end">
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-white bg-[#102746] hover:bg-[#18385E]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Upload / Manage Modal */}
      {bannerModalOpen && targetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-[#F2F7FF]">
            <div className="flex items-center justify-between border-b border-[#18385E] pb-3">
              <div>
                <span className="text-xs font-mono text-[#00CFFF] uppercase">BANNER BRANDING</span>
                <h4 className="text-base font-bold font-mono text-white">
                  {targetEvent.title}
                </h4>
              </div>
              <button onClick={() => setBannerModalOpen(false)} className="p-1 rounded text-[#A9BCD6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#A9BCD6]">Current / New Banner Preview:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102746] text-[#A9BCD6] hover:text-white flex items-center space-x-1 border border-[#18385E]"
                  >
                    {previewMode === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    <span>{previewMode === 'desktop' ? 'Desktop' : 'Mobile'}</span>
                  </button>
                </div>
              </div>

              {bannerPreview ? (
                <div className={`overflow-hidden rounded-xl border border-[#18385E] bg-[#061329] relative transition-all ${previewMode === 'desktop' ? 'h-36 w-full' : 'h-44 max-w-xs mx-auto'}`}>
                  <img src={bannerPreview} alt="Event Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 rounded-xl border-2 border-dashed border-[#18385E] flex flex-col items-center justify-center text-center p-4 bg-[#061329]">
                  <ImageIcon className="w-8 h-8 text-[#A9BCD6] opacity-60 mb-2" />
                  <span className="text-xs text-[#A9BCD6] font-mono">No custom banner attached.</span>
                  <span className="text-[10px] text-slate-500 font-mono">Defaults to official CyberAnzen arena theme.</span>
                </div>
              )}
            </div>

            <div
              onClick={() => bannerInputRef.current?.click()}
              className="border-2 border-dashed border-[#18385E] hover:border-[#00CFFF] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#08172B]"
            >
              <Upload className="w-6 h-6 text-[#00CFFF] mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-mono text-[#F2F7FF] font-semibold">
                Click or drag image to replace banner
              </p>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleBannerSelect(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#18385E]">
              {targetEvent.banner_url && (
                <button
                  type="button"
                  disabled={bannerUploading}
                  onClick={handleRemoveBanner}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800"
                >
                  Remove Banner
                </button>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A9BCD6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bannerFile || bannerUploading}
                  onClick={handleSaveBanner}
                  className="px-5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 disabled:opacity-40"
                >
                  {bannerUploading ? 'Uploading...' : 'Save Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
