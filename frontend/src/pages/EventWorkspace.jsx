import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Shield, Terminal, Trophy, Users, HelpCircle, Code2, Cpu, 
  ArrowRight, CheckCircle2, AlertOctagon, Clock, Flame, Play, 
  RefreshCw, FileText, BarChart2, Check, Lock, Key, AlertTriangle,
  Flag, Settings, Crown, ChevronRight, Award, Sparkles, CheckSquare
} from 'lucide-react';
import { eventService, labService, challengeService, questionService, mcqService } from '../services/api';

export default function EventWorkspace({ user }) {
  const { eventId, id, tab } = useParams();
  const targetEventId = eventId || id;
  const [event, setEvent] = useState(null);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const [loading, setLoading] = useState(true);

  // Content states
  const [questions, setQuestions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);

  // DSA interactive state
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [judgeRunning, setJudgeRunning] = useState(false);
  const [judgeVerdict, setJudgeVerdict] = useState(null);

  // CTF interactive state
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flagInput, setFlagInput] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagResult, setFlagResult] = useState(null);
  const [labInstance, setLabInstance] = useState(null);
  const [labLoading, setLabLoading] = useState(false);

  // MCQ interactive state
  const [selectedMcq, setSelectedMcq] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [mcqSubmitting, setMcqSubmitting] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);

  useEffect(() => {
    loadEventData();
  }, [targetEventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const [evDetail, evConfig] = await Promise.all([
        eventService.getEventDetail(targetEventId),
        eventService.getWorkspaceConfig(targetEventId)
      ]);
      setEvent(evDetail);
      setConfig(evConfig);

      const evType = (evConfig.event_type || '').toLowerCase();
      const hasDsa = evConfig.has_dsa || evType.includes('dsa') || ['combined', 'all'].includes(evType);
      const hasCtf = evConfig.has_ctf || evType.includes('ctf') || ['combined', 'all'].includes(evType);
      const hasMcq = evConfig.has_mcq || evType.includes('mcq') || ['combined', 'all'].includes(evType);

      // Load event-specific content for all active paradigms
      if (hasDsa) {
        const qData = await eventService.getEventQuestions(targetEventId).catch(() => []);
        setQuestions(qData || []);
        if (qData && qData.length > 0) {
          selectDSAQuestion(qData[0]);
        }
      }
      if (hasCtf) {
        const cData = await eventService.getEventChallenges(targetEventId).catch(() => []);
        setChallenges(cData || []);
        if (cData && cData.length > 0) {
          selectCTFChallenge(cData[0]);
        }
      }
      if (hasMcq) {
        const mData = await eventService.getEventMCQs(targetEventId).catch(() => []);
        setMcqs(mData || []);
        if (mData && mData.length > 0) {
          setSelectedMcq(mData[0]);
        }
      }

      // Load leaderboard if enabled
      if (evConfig.leaderboard_visible) {
        const lbData = await eventService.getEventLeaderboard(targetEventId).catch(() => null);
        setLeaderboard(lbData);
      }

      // Load user submissions for this event if registered
      if (evDetail.is_registered) {
        const subData = await eventService.getEventSubmissions(targetEventId).catch(() => []);
        setUserSubmissions(subData || []);
      }
    } catch (err) {
      console.error('Failed to load event workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (mode = 'individual') => {
    try {
      await eventService.registerEvent(targetEventId, mode);
      await loadEventData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed.');
    }
  };

  // DSA Helpers
  const selectDSAQuestion = (q) => {
    setSelectedQuestion(q);
    setJudgeVerdict(null);
    if (language === 'python3') setCode(q.starter_py || '# Write solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n');
    else if (language === 'cpp') setCode(q.starter_cpp || '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n');
    else setCode(q.starter_c || '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n');
  };

  const handleRunJudge = async () => {
    if (!selectedQuestion) return;
    setJudgeRunning(true);
    setJudgeVerdict(null);
    try {
      const res = await questionService.submitCode(selectedQuestion.id, code, language, targetEventId);
      setJudgeVerdict(res);
      const subData = await eventService.getEventSubmissions(targetEventId).catch(() => []);
      setUserSubmissions(subData || []);
    } catch (err) {
      setJudgeVerdict({ verdict: 'SUBMISSION_ERROR', log: err.response?.data?.detail || 'Failed to execute code.' });
    } finally {
      setJudgeRunning(false);
    }
  };

  // CTF Helpers
  const selectCTFChallenge = async (c) => {
    setSelectedChallenge(c);
    setFlagResult(null);
    setFlagInput('');
    setLabInstance(null);
    try {
      const detail = await challengeService.getChallengeDetail(c.id || c.slug);
      setSelectedChallenge(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!selectedChallenge || !flagInput.trim()) return;
    setFlagSubmitting(true);
    setFlagResult(null);
    try {
      const res = await challengeService.submitFlag(selectedChallenge.id, flagInput.trim(), targetEventId);
      setFlagResult(res);
      if (res.correct) {
        const updated = await eventService.getEventChallenges(targetEventId).catch(() => []);
        setChallenges(updated);
        const subData = await eventService.getEventSubmissions(targetEventId).catch(() => []);
        setUserSubmissions(subData || []);
      }
    } catch (err) {
      setFlagResult({ correct: false, message: err.response?.data?.detail || 'Flag verification failed.' });
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleLaunchLab = async () => {
    if (!selectedChallenge) return;
    setLabLoading(true);
    try {
      const instance = await labService.launchLab(selectedChallenge.id);
      setLabInstance(instance);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start Docker container.');
    } finally {
      setLabLoading(false);
    }
  };

  const handleStopLab = async () => {
    if (!labInstance) return;
    try {
      await labService.stopLab(labInstance.id);
      setLabInstance(null);
    } catch (err) {
      alert('Failed to stop lab.');
    }
  };

  // MCQ Helpers
  const handleMCQSubmit = async () => {
    if (!selectedMcq || selectedOptions.length === 0) return;
    setMcqSubmitting(true);
    setMcqResult(null);
    try {
      const res = await mcqService.submitAttempt(selectedMcq.id, selectedOptions, 30, targetEventId);
      setMcqResult(res);
      const updated = await eventService.getEventMCQs(targetEventId).catch(() => []);
      setMcqs(updated);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit quiz answer.');
    } finally {
      setMcqSubmitting(false);
    }
  };

  const getEventPoster = () => {
    if (event?.banner_url) return event.banner_url;
    const type = (config?.event_type || 'ctf').toLowerCase();
    if (type.includes('dsa')) return '/ui-assets/event-algo.png';
    if (type.includes('mcq')) return '/ui-assets/event-mcq.png';
    return '/ui-assets/workspace-nightfall.png';
  };

  const formatDisplayDate = (dString) => {
    if (!dString) return 'Jan 10, 2026';
    try {
      const d = new Date(dString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dString;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-cyan-400 font-mono text-sm animate-pulse">
        Initializing Tactical Arena Workspace...
      </div>
    );
  }

  if (!event || !config) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center font-mono">
        <h3 className="text-xl font-bold text-white">Event Tournament Not Found</h3>
        <Link to="/events" className="text-xs text-cyan-400 underline mt-3 inline-block">Back to Events Hub</Link>
      </div>
    );
  }

  // Determine main interactive tab for "Continue Event" CTA
  const primaryPlayTab = config.tabs.find(t => ['challenges', 'problems', 'quizzes'].includes(t.id))?.id || 'overview';

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-[#F2F7FF]">
      
      {/* Back to Events Breadcrumb */}
      <div>
        <Link to="/events" className="inline-flex items-center space-x-1.5 text-xs text-[#A9BCD6] hover:text-[#00CFFF] transition-colors font-sans">
          <span className="text-sm">←</span>
          <span>Back to Events</span>
        </Link>
      </div>

      {/* =========================================================================
          HERO EVENT CARD (EXACT SCREENSHOT LAYOUT 3)
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-6">
        
        {/* Left Thumbnail (Nightfall Hooded Hacker with CyberAnzen badge) */}
        <div className="w-full md:w-52 h-44 md:h-36 rounded-xl overflow-hidden bg-[#061329] border border-[#18385E] flex-shrink-0 relative">
          <img 
            src={getEventPoster()} 
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/ui-assets/workspace-nightfall.png";
            }}
          />
        </div>

        {/* Middle Details */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF5263]/20 text-[#FF5263] border border-[#FF5263]/40 uppercase">
              {config.event_type?.toUpperCase() || 'CTF'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/40">
              Ongoing
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {event.title}
          </h1>

          <p className="text-xs text-[#A9BCD6] leading-relaxed line-clamp-2 max-w-xl">
            {event.short_description || event.description || 'Investigate vulnerabilities, solve forensic cases and capture flags in a high-intensity CTF event.'}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#A9BCD6] pt-1">
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#00CFFF]" />
              <span>{formatDisplayDate(event.start_time)} – {formatDisplayDate(event.end_time)}</span>
            </span>

            <span className="flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#F5B942]" />
              <span className="font-semibold text-white">2,500 Points</span>
            </span>

            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#00CFFF]" />
              <span>
                {event.participation_mode === 'individual'
                  ? 'Solo Event (Individual)'
                  : `Team Event (2 – ${event.team_size_max || 4} members)`}
              </span>
            </span>
          </div>
        </div>

        {/* Right CTA Button & Settings */}
        <div className="flex items-center md:flex-col justify-end gap-2 flex-shrink-0 pt-2 md:pt-0">
          {!event.is_registered ? (
            <button
              onClick={() => handleRegister(event.participation_mode === 'team' ? 'team' : 'individual')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all whitespace-nowrap"
            >
              <span>Enroll in Competition</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab(primaryPlayTab)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold font-mono text-xs text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all whitespace-nowrap"
            >
              <span>Continue Event</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setActiveTab('rules')}
            className="p-2.5 rounded-xl bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-white transition-colors"
            title="Event Protocol & Directives"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          WORKSPACE NAVIGATION TABS (EXACT SCREENSHOT 3 BAR)
          ========================================================================= */}
      <div className="flex items-center border-b border-[#18385E] gap-6 font-sans text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          ...(config.tabs.filter(t => t.id !== 'overview').map(t => {
            if (t.id === 'squad') return { id: 'squad', label: 'Team' };
            return t;
          }))
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-medium transition-all relative ${
                isActive
                  ? 'text-[#00CFFF] font-bold'
                  : 'text-[#A9BCD6] hover:text-[#F2F7FF]'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00CFFF] shadow-[0_0_10px_#00CFFF]" />
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW (EXACT SCREENSHOT LAYOUT 3)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (Width ~65%) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* About This Event Card */}
              <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white font-mono">
                  About This Event
                </h3>
                <p className="text-xs text-[#A9BCD6] leading-relaxed">
                  {event.description || 'Project Nightfall is a cybersecurity CTF event designed to test your investigation, exploitation and forensic analysis skills. Solve challenges across multiple categories, capture flags and climb the leaderboard.'}
                </p>

                {/* 2 Quick Specs Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A9BCD6] block font-mono">Event Type</span>
                      <span className="text-xs font-bold text-white uppercase">{config.event_type || 'CTF'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF]">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A9BCD6] block font-mono">Mode</span>
                      <span className="text-xs font-bold text-white">
                        {event.participation_mode === 'individual' ? 'Solo Event' : `Team (2 – ${event.team_size_max || 4} members)`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Timeline Card */}
              <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white font-mono">
                  Event Timeline
                </h3>

                <div className="space-y-4 pt-2 relative">
                  {/* Timeline Steps */}
                  {[
                    { title: 'Registration Opens', time: 'Dec 20, 2025 10:00 IST', completed: true },
                    { title: 'Registration Closes', time: 'Jan 8, 2026 23:59 IST', completed: true },
                    { title: 'Event Starts', time: 'Jan 10, 2026 10:00 IST', active: true },
                    { title: 'Event Ends', time: 'Jan 12, 2026 10:00 IST' },
                    { title: 'Results Announcement', time: 'Jan 15, 2026 12:00 IST', isFinal: true },
                  ].map((step, sIdx, arr) => (
                    <div key={sIdx} className="flex items-start space-x-4 relative">
                      {/* Connecting Line */}
                      {sIdx < arr.length - 1 && (
                        <div className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-[#18385E]" />
                      )}

                      {/* Timeline Node Icon */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        step.active
                          ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_15px_rgba(0,207,255,0.7)]'
                          : step.completed
                          ? 'bg-[#20C997]/20 border border-[#20C997] text-[#20C997]'
                          : 'bg-[#061329] border border-[#18385E] text-[#A9BCD6]'
                      }`}>
                        {step.active ? (
                          <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        ) : step.completed ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : step.isFinal ? (
                          <Trophy className="w-3.5 h-3.5 text-[#F5B942]" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#A9BCD6]" />
                        )}
                      </div>

                      {/* Timeline Label & Date */}
                      <div className="flex-1 -mt-0.5">
                        <span className={`text-xs font-semibold block ${step.active ? 'text-[#00CFFF] font-bold' : 'text-white'}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] text-[#A9BCD6] font-mono block">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column (Width ~35%) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Your Team Card */}
              <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-mono">
                    Your Team
                  </h3>
                  <button
                    onClick={() => setActiveTab('squad')}
                    className="inline-flex items-center space-x-1 text-xs font-mono text-[#00CFFF] hover:underline"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Team Box Header */}
                <div className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-5 h-5 text-[#F5B942]" />
                    <span className="text-xs font-bold text-white">Shadow Byte</span>
                  </div>
                  <span className="text-[11px] text-[#A9BCD6] font-mono">4 / 4 Members</span>
                </div>

                {/* Member Avatars */}
                <div className="space-y-2 pt-1 font-sans text-xs">
                  {[
                    { name: 'Dharun (You)', isLeader: true },
                    { name: 'Arjun' },
                    { name: 'Kavya' },
                    { name: 'Rohit' }
                  ].map((m, mIdx) => (
                    <div key={mIdx} className="flex items-center justify-between py-1 border-b border-[#18385E]/40 last:border-0">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center font-mono text-[10px] text-[#00CFFF] font-bold">
                          {m.name[0]}
                        </div>
                        <span className="text-[#F2F7FF] font-medium">{m.name}</span>
                      </div>
                      {m.isLeader && (
                        <Crown className="w-3.5 h-3.5 text-[#F5B942]" title="Squad Leader" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* What to Expect Card */}
              <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white font-mono">
                  What to Expect
                </h3>

                <div className="space-y-3 pt-1 text-xs text-[#A9BCD6]">
                  {[
                    'Realistic security challenges',
                    'Web, crypto, forensics, reverse engineering and more',
                    'Team-based competition (2 – 4 members)',
                    'Exciting prizes and recognition'
                  ].map((item, iIdx) => (
                    <div key={iIdx} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF] flex-shrink-0 mt-0.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-300 leading-relaxed font-sans">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            
            {/* Metric 1: Total Points */}
            <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center text-[#F5B942]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-white block">2,500</span>
                <span className="text-[10px] font-mono text-[#A9BCD6] block">Total Points</span>
              </div>
            </div>

            {/* Metric 2: Challenges */}
            <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-[#FF5263]">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-white block">
                  {challenges.length || questions.length || mcqs.length || 15}
                </span>
                <span className="text-[10px] font-mono text-[#A9BCD6] block">Challenges</span>
              </div>
            </div>

            {/* Metric 3: Registered Teams */}
            <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-white block">
                  {event.registration_count || 128}
                </span>
                <span className="text-[10px] font-mono text-[#A9BCD6] block">Registered Teams</span>
              </div>
            </div>

            {/* Metric 4: Leaderboard */}
            <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-center text-[#087FFF]">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold font-mono text-white block">Live</span>
                <span className="text-[10px] font-mono text-[#A9BCD6] block">Leaderboard</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CTF CHALLENGES & LIVE DOCKER LABS
          ========================================================================= */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Challenge List Sidebar */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-2 max-h-[750px] overflow-y-auto font-mono text-xs">
            <h3 className="text-xs text-[#00CFFF] font-bold uppercase tracking-wider mb-3">Targets &amp; Exploit Vector</h3>
            {challenges.length === 0 ? (
              <div className="p-4 text-center text-[#A9BCD6]">No CTF challenges assigned to this event yet.</div>
            ) : (
              challenges.map(c => {
                const isCurrent = selectedChallenge && selectedChallenge.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCTFChallenge(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_15px_rgba(0,207,255,0.25)]'
                        : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{c.title}</span>
                      <span className="text-[#00CFFF] text-xs font-bold">{c.points} pts</span>
                    </div>
                    <div className="text-[10px] text-[#A9BCD6] mt-1 flex items-center space-x-2">
                      <span className="uppercase">{c.category}</span>
                      <span>•</span>
                      <span>{c.difficulty}</span>
                      {c.has_docker_lab && <span className="text-emerald-400 font-semibold">• Lab</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive CTF Workspace */}
          {selectedChallenge ? (
            <div className="lg:col-span-8 flex flex-col space-y-4 font-mono text-xs">
              <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#18385E] pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedChallenge.title}</h3>
                    <span className="text-[10px] text-[#A9BCD6] uppercase">{selectedChallenge.category} • {selectedChallenge.difficulty}</span>
                  </div>
                  <span className="text-[#00CFFF] font-bold text-sm">{selectedChallenge.points} points</span>
                </div>

                <div className="text-slate-300 leading-relaxed whitespace-pre-line font-sans text-xs">
                  {selectedChallenge.description}
                </div>

                {/* Docker Container Lab Controls */}
                {selectedChallenge.has_docker_lab && (
                  <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-[#00CFFF]" />
                        <span className="font-bold text-white text-xs">Target Container Lab</span>
                      </div>
                      {labInstance && (
                        <span className="text-emerald-400 text-[10px] animate-pulse">Running ({labInstance.container_id?.substring(0, 10)})</span>
                      )}
                    </div>

                    {labInstance ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded bg-[#102746] text-[#00CFFF] text-xs font-mono break-all border border-[#18385E]">
                          Target Host: {labInstance.access_url || `http://localhost:${labInstance.port_allocated}`}
                        </div>
                        <button
                          onClick={handleStopLab}
                          className="px-4 py-1.5 rounded-lg text-xs bg-red-950/80 text-red-400 border border-red-800 hover:bg-red-900/60"
                        >
                          Terminate Container Lab
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleLaunchLab}
                        disabled={labLoading}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-[#00CFFF] shadow-md hover:opacity-95"
                      >
                        {labLoading ? 'Deploying Container...' : 'Spawn Dedicated Target Lab'}
                      </button>
                    )}
                  </div>
                )}

                {/* Flag Submission Form */}
                <form onSubmit={handleSubmitFlag} className="space-y-3 pt-2 border-t border-[#18385E]">
                  <label className="text-[#A9BCD6] block font-mono text-xs">Flag Verification</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      placeholder="FLAG{cyberanzen_...}"
                      className="flex-1 px-4 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono text-xs focus:border-[#00CFFF]"
                    />
                    <button
                      type="submit"
                      disabled={flagSubmitting}
                      className="px-5 py-2 rounded-xl font-bold font-mono text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-colors"
                    >
                      {flagSubmitting ? 'Checking...' : 'Submit Flag'}
                    </button>
                  </div>

                  {flagResult && (
                    <div className={`p-3 rounded-xl border text-xs font-mono ${
                      flagResult.correct
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                        : 'bg-red-950/60 border-red-800 text-red-400'
                    }`}>
                      {flagResult.correct ? 'Captured! Points awarded to scoreboard.' : flagResult.message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-[#A9BCD6] font-mono rounded-2xl bg-[#0B1D38] border border-[#18385E]">
              Select a target from the sidebar to inspect brief and submit flag.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: DSA PROBLEMS WORKSPACE (WITH MONACO EDITOR)
          ========================================================================= */}
      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Sidebar */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-2 max-h-[750px] overflow-y-auto font-mono text-xs">
            <h3 className="text-xs text-[#00CFFF] font-bold uppercase tracking-wider mb-3">Event Problem Set</h3>
            {questions.length === 0 ? (
              <div className="p-4 text-center text-[#A9BCD6]">No challenges assigned to this event yet.</div>
            ) : (
              questions.map(q => {
                const isCurrent = selectedQuestion && selectedQuestion.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => selectDSAQuestion(q)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_15px_rgba(0,207,255,0.2)]'
                        : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{q.title}</span>
                      <span className="text-[#00CFFF] text-xs font-bold">{q.points} pts</span>
                    </div>
                    <div className="text-[10px] text-[#A9BCD6] mt-1 flex items-center space-x-2">
                      <span>{q.difficulty}</span>
                      <span>•</span>
                      <span>{q.category}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive Monaco Workspace */}
          {selectedQuestion ? (
            <div className="lg:col-span-8 flex flex-col space-y-4">
              {/* Problem Statement Card */}
              <div className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-[#18385E] pb-2">
                  <h3 className="font-bold text-white text-sm">{selectedQuestion.title}</h3>
                  <span className="text-[#00CFFF] font-bold">{selectedQuestion.points} points</span>
                </div>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {selectedQuestion.statement}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-[#18385E]/60">
                  <div>
                    <span className="text-[#A9BCD6] block mb-0.5">Input Specification:</span>
                    <span className="text-slate-200">{selectedQuestion.input_spec}</span>
                  </div>
                  <div>
                    <span className="text-[#A9BCD6] block mb-0.5">Output Specification:</span>
                    <span className="text-slate-200">{selectedQuestion.output_spec}</span>
                  </div>
                </div>
              </div>

              {/* Monaco IDE */}
              <div className="rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl overflow-hidden flex flex-col">
                <div className="p-3 bg-[#061329] border-b border-[#18385E] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-[#A9BCD6]">Runtime:</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-[#102746] border border-[#18385E] rounded px-2 py-1 text-white text-xs"
                    >
                      <option value="python3">Python 3.14</option>
                      <option value="cpp">C++ 17 (G++)</option>
                      <option value="c">C 11 (GCC)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunJudge}
                    disabled={judgeRunning}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{judgeRunning ? 'Judging...' : 'Submit to Sandbox'}</span>
                  </button>
                </div>

                <div className="h-80 w-full">
                  <Editor
                    height="100%"
                    language={language === 'python3' ? 'python' : 'cpp'}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      tabSize: 4
                    }}
                  />
                </div>

                {judgeVerdict && (
                  <div className={`p-4 border-t font-mono text-xs ${
                    judgeVerdict.verdict === 'ACCEPTED'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : 'bg-red-950/60 border-red-800 text-red-400'
                  }`}>
                    <div className="font-bold flex items-center space-x-2">
                      <span>Verdict: {judgeVerdict.verdict}</span>
                      {judgeVerdict.execution_time_ms && <span>({judgeVerdict.execution_time_ms} ms)</span>}
                    </div>
                    {judgeVerdict.compile_log && (
                      <pre className="mt-2 text-[10px] whitespace-pre-wrap opacity-90">{judgeVerdict.compile_log}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-[#A9BCD6] font-mono rounded-2xl bg-[#0B1D38] border border-[#18385E]">
              Select a DSA problem to begin coding and sandbox execution.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: MCQ QUIZZES
          ========================================================================= */}
      {activeTab === 'quizzes' && (
        <div className="max-w-3xl mx-auto space-y-6 font-mono text-xs">
          {mcqs.length === 0 ? (
            <div className="p-8 text-center text-[#A9BCD6] rounded-2xl bg-[#0B1D38] border border-[#18385E]">
              No MCQ assessments configured for this tournament.
            </div>
          ) : (
            mcqs.map((m, idx) => (
              <div key={m.id} className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-[#18385E] pb-2">
                  <span className="text-white font-bold">Assessment #{idx + 1}: {m.title}</span>
                  <span className="text-[#00CFFF] font-bold">+{m.points_positive} pts</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{m.prompt}</p>

                <div className="space-y-2 pt-2">
                  {m.options?.map(opt => (
                    <label
                      key={opt.id}
                      className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center space-x-3 cursor-pointer hover:border-[#00CFFF]/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(opt.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOptions([...selectedOptions, opt.id]);
                          else setSelectedOptions(selectedOptions.filter(id => id !== opt.id));
                        }}
                        className="rounded border-[#18385E] text-[#00CFFF]"
                      />
                      <span className="text-white">{opt.text}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedMcq(m);
                      handleMCQSubmit();
                    }}
                    disabled={mcqSubmitting}
                    className="px-5 py-2 rounded-xl font-bold font-mono text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-colors"
                  >
                    {mcqSubmitting ? 'Evaluating...' : 'Confirm Answer'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: LEADERBOARD
          ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl font-mono text-xs">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-[#F5B942]" />
            <span>TOURNAMENT SCOREBOARD &amp; CLASSIFICATION</span>
          </h3>

          {!leaderboard || !leaderboard.standings || leaderboard.standings.length === 0 ? (
            <div className="py-12 text-center text-[#A9BCD6]">
              No solves recorded on scoreboard yet. Be the first to capture points!
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#061329] text-[#A9BCD6] text-[10px] uppercase border-b border-[#18385E]">
                <tr>
                  <th className="p-3 w-12">Rank</th>
                  <th className="p-3">Operative / Squad</th>
                  <th className="p-3">Solves</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18385E]/60">
                {leaderboard.standings.map(s => (
                  <tr key={s.rank} className="hover:bg-[#102746]/40">
                    <td className="p-3 font-bold text-[#00CFFF]">#{s.rank}</td>
                    <td className="p-3 text-white font-bold">{s.team_name || s.username}</td>
                    <td className="p-3 text-[#A9BCD6]">{s.solved_count} solves</td>
                    <td className="p-3 text-right font-bold text-[#20C997]">{s.points} PTS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: SUBMISSIONS AUDIT LOG
          ========================================================================= */}
      {activeTab === 'submissions' && (
        <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-[#18385E] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#00CFFF]" />
              <span>YOUR EVENT SUBMISSION AUDIT LOG</span>
            </h3>
            <button
              onClick={() => {
                eventService.getEventSubmissions(targetEventId)
                  .then(data => setUserSubmissions(data || []))
                  .catch(() => {});
              }}
              className="text-[11px] text-[#00CFFF] hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Log</span>
            </button>
          </div>

          {userSubmissions.length === 0 ? (
            <div className="py-12 text-center text-[#A9BCD6]">
              No submissions recorded yet for this event tournament.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#061329] text-[#A9BCD6] text-[10px] uppercase border-b border-[#18385E]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Language</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3">Execution</th>
                    <th className="p-3">Points</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18385E]/60 text-xs">
                  {userSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-[#102746]/40">
                      <td className="p-3 text-[#A9BCD6]">#{sub.id}</td>
                      <td className="p-3 text-white font-medium">{sub.question_title}</td>
                      <td className="p-3 text-[#00CFFF] uppercase font-mono">{sub.language}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-[#20C997] border border-emerald-800' :
                          sub.verdict === 'WRONG_ANSWER' ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-amber-950 text-[#F5B942] border border-amber-800'
                        }`}>
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="p-3 text-[#A9BCD6]">
                        {sub.execution_time_ms ? `${sub.execution_time_ms}ms` : '—'}
                      </td>
                      <td className="p-3 text-[#20C997] font-bold">
                        +{sub.points_awarded || 0}
                      </td>
                      <td className="p-3 text-[#A9BCD6]">
                        {sub.created_at ? new Date(sub.created_at).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 7: RULES & PROTOCOL
          ========================================================================= */}
      {activeTab === 'rules' && (
        <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-6 font-mono text-xs max-w-4xl">
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#00CFFF]" />
              <span>RULES OF ENGAGEMENT // TOURNAMENT PROTOCOL</span>
            </h3>
            <p className="text-[#A9BCD6] text-xs font-sans leading-relaxed">
              All participants are required to conduct themselves in accordance with tournament policies, ethical security practices, and responsible disclosure.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E]">
              <h4 className="font-bold text-[#00CFFF] uppercase mb-1">1. Anti-Cheat &amp; Clipboard Restraints</h4>
              <p className="text-slate-300 font-sans text-xs">
                Policy Active: <span className="font-mono text-white font-bold uppercase">{event.clipboard_policy}</span>. 
                External assistance, unauthorized automation, and code sharing between competing squads are strictly audited.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E]">
              <h4 className="font-bold text-[#20C997] uppercase mb-1">2. Sandboxed Target Boundaries</h4>
              <p className="text-slate-300 font-sans text-xs">
                Do not attempt Denial-of-Service attacks against competition infrastructure or scoring servers. Attacks must be directed exclusively at assigned target environments.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E]">
              <h4 className="font-bold text-[#F5B942] uppercase mb-1">3. Scoring &amp; Tie-Breakers</h4>
              <p className="text-slate-300 font-sans text-xs">
                Scoring Policy: <span className="font-mono text-white font-bold uppercase">{event.scoring_policy}</span>. 
                In the event of score parity, rankings are determined by submission timestamps (first to capture points ranks higher).
              </p>
            </div>

            {event.rules && (
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E]">
                <h4 className="font-bold text-white uppercase mb-1">Event-Specific Directives</h4>
                <div className="text-slate-300 font-sans text-xs whitespace-pre-line leading-relaxed">
                  {event.rules}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
