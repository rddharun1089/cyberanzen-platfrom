import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Shield, Terminal, Trophy, Users, HelpCircle, Code2, Cpu, 
  ArrowRight, CheckCircle2, AlertOctagon, Clock, Flame, Play, 
  RefreshCw, FileText, BarChart2, Check, Lock, Key, AlertTriangle,
  Flag, Settings, Crown, ChevronRight, Award, Sparkles, CheckSquare,
  Smartphone, RotateCcw, Send, ShieldAlert, Calendar, UserPlus,
  Copy, LogOut, ExternalLink, X, ChevronDown, ChevronUp, AlertCircle,
  ChevronLeft, Maximize2, Minimize2, List
} from 'lucide-react';
import { eventService, labService, challengeService, questionService, dsaService, authService, mcqService, teamService } from '../services/api';

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

  // Squad / Team interactive state
  const [userTeam, setUserTeam] = useState(null);
  const [squadName, setSquadName] = useState('');
  const [joinSquadCode, setJoinSquadCode] = useState('');
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadError, setSquadError] = useState('');
  const [squadSuccess, setSquadSuccess] = useState('');
  const [copiedSquadCode, setCopiedSquadCode] = useState(false);
  const [squadSubTab, setSquadSubTab] = useState('commission');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // DSA interactive state (Existing Console Integration)
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [language, setLanguage] = useState('python3');
  const [codeDrafts, setCodeDrafts] = useState({});
  const [executionResults, setExecutionResults] = useState({});
  const [dsaSubTab, setDsaSubTab] = useState('statement'); // 'statement' | 'results' | 'history'
  const [useTouchEditor, setUseTouchEditor] = useState(false);
  const [isRunningSample, setIsRunningSample] = useState(false);
  const [isSubmittingDSA, setIsSubmittingDSA] = useState(false);
  const [clipboardWarning, setClipboardWarning] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [activeTerminalTab, setActiveTerminalTab] = useState('tests'); // 'tests' | 'compiler'
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [showProblemMatrix, setShowProblemMatrix] = useState(false);
  const [editorHeightMode, setEditorHeightMode] = useState('split'); // 'split' | 'max_editor' | 'max_terminal'

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

  const currentUser = user || authService.getCurrentUser();
  const isAdmin = Boolean(currentUser && (
    ['super_admin', 'event_admin', 'challenge_author', 'admin'].includes(currentUser.role?.toLowerCase())
  ));
  const isCopyPasteAllowed = Boolean(
    selectedQuestion?.allow_copy_paste || 
    (config?.clipboard_policy === 'allow') || 
    isAdmin
  );

  // Live countdown timer
  useEffect(() => {
    if (!event?.end_time) return;
    const updateTimer = () => {
      const end = new Date(event.end_time).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeRemaining('Concluded');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.end_time]);

  // Anti-cheat keyboard and clipboard listener
  useEffect(() => {
    if (activeTab !== 'problems' || isCopyPasteAllowed) return;

    const triggerWarning = () => {
      setClipboardWarning('⚠️ EXAM SECURITY LOCKDOWN: Copying & pasting code is restricted by event policy.');
      setTimeout(() => setClipboardWarning(''), 4500);
    };

    const handleKeyDownCapture = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      if (
        (isCtrlOrCmd && ['v', 'c', 'x'].includes(key)) ||
        (isCtrlOrCmd && e.shiftKey && ['c', 'v'].includes(key)) ||
        (e.shiftKey && e.key === 'Insert') ||
        (isCtrlOrCmd && e.key === 'Insert')
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        triggerWarning();
      }
    };

    const handleClipboardEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      triggerWarning();
    };

    window.addEventListener('keydown', handleKeyDownCapture, true);
    window.addEventListener('paste', handleClipboardEvent, true);
    window.addEventListener('copy', handleClipboardEvent, true);
    window.addEventListener('cut', handleClipboardEvent, true);
    window.addEventListener('drop', handleClipboardEvent, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDownCapture, true);
      window.removeEventListener('paste', handleClipboardEvent, true);
      window.removeEventListener('copy', handleClipboardEvent, true);
      window.removeEventListener('cut', handleClipboardEvent, true);
      window.removeEventListener('drop', handleClipboardEvent, true);
    };
  }, [activeTab, isCopyPasteAllowed]);

  const handleEditorMount = (editor, monaco) => {
    if (!isCopyPasteAllowed) {
      const showWarning = () => {
        setClipboardWarning('⚠️ EXAM SECURITY LOCKDOWN: Copying & pasting code is restricted.');
        setTimeout(() => setClipboardWarning(''), 4500);
      };
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, showWarning);
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, showWarning);
    }
  };

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
          const firstAvailable = qData.find(q => !q.is_locked) || qData[0];
          setSelectedQuestion(firstAvailable);
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

      // Load user team state if logged in
      try {
        const teamRes = await teamService.getMyTeam();
        if (teamRes && teamRes.has_team && teamRes.team) {
          setUserTeam(teamRes.team);
        } else {
          setUserTeam(null);
        }
      } catch {
        setUserTeam(null);
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
      setShowRegistrationModal(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed.');
    }
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    if (!squadName.trim()) return;
    setSquadLoading(true);
    setSquadError('');
    setSquadSuccess('');
    try {
      const res = await teamService.createTeam(squadName.trim(), event?.team_size_max || 4, targetEventId);
      setSquadSuccess(`Squad "${res.team?.name || squadName}" successfully commissioned!`);
      setSquadName('');
      await loadEventData();
    } catch (err) {
      setSquadError(err.response?.data?.detail || 'Failed to create squad.');
    } finally {
      setSquadLoading(false);
    }
  };

  const handleJoinSquad = async (e) => {
    e.preventDefault();
    if (!joinSquadCode.trim()) return;
    setSquadLoading(true);
    setSquadError('');
    setSquadSuccess('');
    try {
      const res = await teamService.joinTeam(joinSquadCode.trim());
      setSquadSuccess(`Enlisted in squad "${res.team?.name || 'Squad'}" successfully!`);
      setJoinSquadCode('');
      await loadEventData();
    } catch (err) {
      setSquadError(err.response?.data?.detail || 'Failed to join squad. Please verify invitation token.');
    } finally {
      setSquadLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!window.confirm('Are you sure you want to leave your squad?')) return;
    setSquadLoading(true);
    setSquadError('');
    setSquadSuccess('');
    try {
      await teamService.leaveTeam();
      setSquadSuccess('You have left the squad.');
      await loadEventData();
    } catch (err) {
      setSquadError(err.response?.data?.detail || 'Failed to leave squad.');
    } finally {
      setSquadLoading(false);
    }
  };

  // =========================================================================
  // DSA HELPERS & RUN/SUBMIT SANDBOX EXECUTION (PRESERVING EXISTING CONSOLE)
  // =========================================================================
  const getCurrentCode = () => {
    if (!selectedQuestion) return '';
    const key = `${selectedQuestion.id}_${language}`;
    if (codeDrafts[key] !== undefined) {
      return codeDrafts[key];
    }
    if (selectedQuestion.starter_code?.[language]) {
      return selectedQuestion.starter_code[language];
    }
    if (language === 'python3') return selectedQuestion.starter_py || '# Write solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
    if (language === 'cpp') return selectedQuestion.starter_cpp || '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n';
    return selectedQuestion.starter_c || '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n';
  };

  const handleCodeChange = (newCode) => {
    if (!selectedQuestion) return;
    const key = `${selectedQuestion.id}_${language}`;
    setCodeDrafts(prev => ({ ...prev, [key]: newCode }));
  };

  const selectDSAQuestion = (q) => {
    if (q.is_locked) {
      alert(q.lock_reason || 'This question is locked based on event progression policy.');
      return;
    }
    setSelectedQuestion(q);
  };

  const currentQIndex = questions.findIndex(q => q.id === selectedQuestion?.id);
  const hasPrevQ = currentQIndex > 0;
  const hasNextQ = currentQIndex >= 0 && currentQIndex < questions.length - 1;

  const handlePrevQ = () => {
    if (hasPrevQ) selectDSAQuestion(questions[currentQIndex - 1]);
  };

  const handleNextQ = () => {
    if (hasNextQ) selectDSAQuestion(questions[currentQIndex + 1]);
  };

  const handleResetCode = () => {
    if (!selectedQuestion) return;
    if (!window.confirm('Reset code to original starter template? Any unsaved edits will be lost.')) return;
    const key = `${selectedQuestion.id}_${language}`;
    let starter = selectedQuestion.starter_code?.[language];
    if (!starter) {
      if (language === 'python3') starter = selectedQuestion.starter_py || '# Write solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n';
      else if (language === 'cpp') starter = selectedQuestion.starter_cpp || '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n';
      else starter = selectedQuestion.starter_c || '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n';
    }
    setCodeDrafts(prev => ({ ...prev, [key]: starter }));
  };

  const handleRunSample = async () => {
    if (!selectedQuestion) return;
    setIsRunningSample(true);
    setTerminalOpen(true);
    setActiveTerminalTab('tests');
    setSelectedTestCaseIndex(0);
    setDsaSubTab('results');
    const codeToRun = getCurrentCode();
    try {
      const res = await dsaService.runSample(selectedQuestion.id, language, codeToRun);
      setExecutionResults(prev => ({ ...prev, [selectedQuestion.id]: res }));
    } catch (err) {
      setExecutionResults(prev => ({
        ...prev,
        [selectedQuestion.id]: {
          verdict: 'INTERNAL_ERROR',
          compile_log: err.response?.data?.detail || 'Failed to execute sample code in judge sandbox.'
        }
      }));
    } finally {
      setIsRunningSample(false);
    }
  };

  const handleSubmitDSA = async () => {
    if (!selectedQuestion) return;
    setIsSubmittingDSA(true);
    setTerminalOpen(true);
    setActiveTerminalTab('tests');
    setSelectedTestCaseIndex(0);
    setDsaSubTab('results');
    const codeToSubmit = getCurrentCode();
    try {
      const res = await questionService.submitCode(selectedQuestion.id, codeToSubmit, language, targetEventId);
      setExecutionResults(prev => ({ ...prev, [selectedQuestion.id]: res }));

      // Refresh questions and user submissions
      const [updatedQ, updatedSubs] = await Promise.all([
        eventService.getEventQuestions(targetEventId).catch(() => []),
        eventService.getEventSubmissions(targetEventId).catch(() => [])
      ]);
      if (updatedQ && updatedQ.length > 0) {
        setQuestions(updatedQ);
        const refreshedSelected = updatedQ.find(x => x.id === selectedQuestion.id);
        if (refreshedSelected) setSelectedQuestion(refreshedSelected);
      }
      if (updatedSubs) setUserSubmissions(updatedSubs);
    } catch (err) {
      setExecutionResults(prev => ({
        ...prev,
        [selectedQuestion.id]: {
          verdict: 'SUBMISSION_ERROR',
          compile_log: err.response?.data?.detail || 'Failed to evaluate submission in judge sandbox.'
        }
      }));
    } finally {
      setIsSubmittingDSA(false);
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
  const isCodingFocusMode = activeTab === 'problems';

  return (
    <div className={`flex-1 w-full mx-auto transition-all font-sans text-[#F2F7FF] ${
      isCodingFocusMode 
        ? 'max-w-[1920px] px-3 sm:px-6 py-3 space-y-3' 
        : 'max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6'
    }`}>
      
      {/* Back to Events Breadcrumb */}
      {!isCodingFocusMode && (
        <div>
          <Link to="/events" className="inline-flex items-center space-x-1.5 text-xs text-[#A9BCD6] hover:text-[#00CFFF] transition-colors font-sans">
            <span className="text-sm">←</span>
            <span>Back to Events</span>
          </Link>
        </div>
      )}

      {/* =========================================================================
          HERO EVENT CARD (Hidden in DSA coding focus mode to preserve vertical screen space)
          ========================================================================= */}
      {!isCodingFocusMode && (
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
      )}

      {/* =========================================================================
          WORKSPACE NAVIGATION TABS
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[#18385E] gap-4 font-sans text-xs">
        <div className="flex items-center gap-6 overflow-x-auto">
        {(() => {
          const tabList = [
            { id: 'overview', label: 'Overview' },
            ...(config.tabs.filter(t => t.id !== 'overview').map(t => {
              if (t.id === 'squad') return { id: 'squad', label: 'Team' };
              return t;
            }))
          ];
          const isTeamAllowed = ['team', 'mixed', 'any'].includes(event?.participation_mode?.toLowerCase()) || config?.has_teams;
          if (isTeamAllowed && !tabList.some(t => t.id === 'squad')) {
            tabList.splice(1, 0, { id: 'squad', label: 'Team' });
          }
          return tabList;
        })().map(tab => {
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

        {isCodingFocusMode && (
          <div className="hidden sm:flex items-center space-x-2">
            <Link 
              to="/events" 
              className="px-3 py-1.5 rounded-lg bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-slate-300 hover:text-white transition-colors text-xs font-mono flex items-center space-x-1"
            >
              <span>← Exit to Events</span>
            </Link>
          </div>
        )}
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
                    <span>{userTeam ? 'Manage' : 'Configure'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {userTeam ? (
                  <>
                    {/* Team Box Header */}
                    <div className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Shield className="w-5 h-5 text-[#F5B942]" />
                        <span className="text-xs font-bold text-white">{userTeam.name}</span>
                      </div>
                      <span className="text-[11px] text-[#A9BCD6] font-mono">
                        {userTeam.members?.length || 1} / {userTeam.max_members || 4} Members
                      </span>
                    </div>

                    {/* Member Avatars */}
                    <div className="space-y-2 pt-1 font-sans text-xs">
                      {userTeam.members?.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center justify-between py-1 border-b border-[#18385E]/40 last:border-0">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-6 h-6 rounded-full bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center font-mono text-[10px] text-[#00CFFF] font-bold">
                              {m.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-[#F2F7FF] font-medium">
                              {m.username} {m.user_id === currentUser?.id ? '(You)' : ''}
                            </span>
                          </div>
                          {m.role === 'owner' && (
                            <Crown className="w-3.5 h-3.5 text-[#F5B942]" title="Squad Leader" />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] text-center space-y-3">
                    <p className="text-xs text-[#A9BCD6]">
                      {event?.participation_mode === 'individual'
                        ? 'Enlisted as Individual Operative'
                        : 'No squad formed yet. Form or join a squad to compete with teammates.'}
                    </p>
                    {event?.participation_mode !== 'individual' && (
                      <button
                        onClick={() => setActiveTab('squad')}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-all inline-flex items-center space-x-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Form or Join Squad</span>
                      </button>
                    )}
                  </div>
                )}
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
          TAB: TEAM & SQUAD FORMATION WORKSPACE
          ========================================================================= */}
      {activeTab === 'squad' && (
        <div className="space-y-6">
          {/* Feedback alerts */}
          {squadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{squadSuccess}</span>
              </div>
              <button onClick={() => setSquadSuccess('')} className="p-1 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {squadError && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{squadError}</span>
              </div>
              <button onClick={() => setSquadError('')} className="p-1 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {userTeam ? (
            /* ACTIVE TEAM DASHBOARD */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Team Details & Operatives Roster */}
              <div className="lg:col-span-8 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#18385E] pb-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF]">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-xl font-bold font-mono text-white">{userTeam.name}</h2>
                          {userTeam.owner_id === currentUser?.id && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center space-x-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>SQUAD COMMANDER</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#A9BCD6] font-mono">
                          Squad ID: #{userTeam.id} · Enlisted in {event?.title || 'Tournament'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTab(primaryPlayTab)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-all inline-flex items-center space-x-1.5 shadow-[0_0_15px_rgba(0,207,255,0.3)]"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Enter Challenges</span>
                      </button>
                    </div>
                  </div>

                  {/* Invitation Token Box */}
                  <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A9BCD6] font-mono flex items-center space-x-1.5">
                        <Key className="w-3.5 h-3.5 text-[#00CFFF]" />
                        <span>Recruitment Invitation Token</span>
                      </span>
                      <span className="text-[11px] text-[#A9BCD6] font-mono">Share with your teammates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 bg-[#0B1D38] border border-[#18385E] rounded-lg font-mono text-xs text-[#00CFFF] tracking-wider select-all overflow-x-auto">
                        {userTeam.invitation_code}
                      </div>
                      <button
                        onClick={() => {
                          if (userTeam.invitation_code) {
                            navigator.clipboard.writeText(userTeam.invitation_code);
                            setCopiedSquadCode(true);
                            setTimeout(() => setCopiedSquadCode(false), 2500);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-[#087FFF]/20 hover:bg-[#087FFF]/40 border border-[#087FFF]/50 text-xs font-mono text-[#00CFFF] transition-all flex items-center space-x-1"
                      >
                        {copiedSquadCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSquadCode ? 'Copied' : 'Copy Token'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Operatives Roster */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                        <Users className="w-4 h-4 text-[#00CFFF]" />
                        <span>Operative Roster</span>
                      </h3>
                      <span className="text-xs font-mono text-[#A9BCD6]">
                        {userTeam.members?.length || 1} / {userTeam.max_members || 4} Members
                      </span>
                    </div>

                    <div className="divide-y divide-[#18385E] border border-[#18385E] rounded-xl overflow-hidden bg-[#061329]">
                      {userTeam.members?.map((m, idx) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-[#0B1D38]/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center font-mono text-xs text-[#00CFFF] font-bold">
                              {m.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white">
                                  {m.username} {m.user_id === currentUser?.id ? '(You)' : ''}
                                </span>
                                {m.role === 'owner' && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400" title="Squad Leader" />
                                )}
                              </div>
                              <span className="text-[10px] text-[#A9BCD6] font-mono">
                                {m.role === 'owner' ? 'Squad Commander' : 'Operative'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-[#F5B942]">
                              {m.points || 0} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave squad action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleLeaveSquad}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 transition-colors inline-flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Squadron</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Squad Performance & Directives */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                  <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-[#F5B942]" />
                    <span>Squad Performance</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E]">
                      <span className="text-[10px] text-[#A9BCD6] font-mono block">Squad Score</span>
                      <span className="text-lg font-bold font-mono text-[#F5B942]">
                        {userTeam.points || 0}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E]">
                      <span className="text-[10px] text-[#A9BCD6] font-mono block">Solves</span>
                      <span className="text-lg font-bold font-mono text-[#20C997]">
                        {userTeam.solved_challenges?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] text-xs text-[#A9BCD6] space-y-2 font-sans">
                    <p className="font-bold text-white font-mono">Squad Directives:</p>
                    <p>• Solves by any squadron member automatically credit points to the collective squad leaderboard.</p>
                    <p>• Only members of this squad can share interactive lab environments.</p>
                    <p>• Ensure your team reaches full capacity before the competition ends.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NO SQUAD YET: COMMISSION OR JOIN */
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF] shadow-[0_0_20px_rgba(8,127,255,0.3)]">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold font-mono text-white">Squad Formation Center</h2>
                <p className="text-xs text-[#A9BCD6] max-w-md mx-auto">
                  This tournament supports collaborative team play. Commission a new squad or join your peers using an invitation token.
                </p>
              </div>

              {/* Sub-tabs: Commission vs Join */}
              <div className="flex rounded-xl bg-[#061329] border border-[#18385E] p-1 font-mono text-xs">
                <button
                  onClick={() => setSquadSubTab('commission')}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                    squadSubTab === 'commission'
                      ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_15px_rgba(0,207,255,0.3)]'
                      : 'text-[#A9BCD6] hover:text-white'
                  }`}
                >
                  Commission New Squad
                </button>
                <button
                  onClick={() => setSquadSubTab('join')}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${
                    squadSubTab === 'join'
                      ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_15px_rgba(0,207,255,0.3)]'
                      : 'text-[#A9BCD6] hover:text-white'
                  }`}
                >
                  Join Existing Squad
                </button>
              </div>

              {/* Tab 1: Commission Form */}
              {squadSubTab === 'commission' && (
                <form onSubmit={handleCreateSquad} className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A9BCD6] mb-1.5">
                      Squad Designation / Call-sign *
                    </label>
                    <input
                      type="text"
                      required
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      placeholder="e.g. CyberVanguard, NullPointers, ShadowByte"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#061329] border border-[#18385E] text-white text-xs font-mono placeholder-[#A9BCD6]/40 focus:outline-none focus:border-[#00CFFF]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E] text-[11px] text-[#A9BCD6] font-mono">
                    Squad size limit: <span className="text-white font-bold">{event?.team_size_max || 4} operatives</span> max per squad.
                  </div>

                  <button
                    type="submit"
                    disabled={squadLoading || !squadName.trim()}
                    className="w-full py-3 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,207,255,0.3)]"
                  >
                    {squadLoading ? 'Commissioning Squadron...' : 'Commission Squad & Generate Token'}
                  </button>
                </form>
              )}

              {/* Tab 2: Join Form */}
              {squadSubTab === 'join' && (
                <form onSubmit={handleJoinSquad} className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A9BCD6] mb-1.5">
                      Invitation Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={joinSquadCode}
                      onChange={(e) => setJoinSquadCode(e.target.value)}
                      placeholder="Paste the invitation token provided by your squad commander"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#061329] border border-[#18385E] text-white text-xs font-mono placeholder-[#A9BCD6]/40 focus:outline-none focus:border-[#00CFFF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={squadLoading || !joinSquadCode.trim()}
                    className="w-full py-3 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,207,255,0.3)]"
                  >
                    {squadLoading ? 'Authenticating Token...' : 'Enlist in Squadron'}
                  </button>
                </form>
              )}

              {/* Solo option if event allows */}
              {['mixed', 'any', 'individual'].includes(event?.participation_mode?.toLowerCase()) && (
                <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block font-mono">Prefer to compete alone?</span>
                    <span className="text-[#A9BCD6] text-[11px]">You can participate as an individual operative.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab(primaryPlayTab)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#00CFFF] hover:bg-[#00CFFF]/10 border border-[#00CFFF]/40 transition-colors"
                  >
                    Enter Solo Arena →
                  </button>
                </div>
              )}
            </div>
          )}
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
          TAB 3: DSA PROBLEMS WORKSPACE (FULL-WIDTH LEETCODE-STYLE CODING ARENA)
          ========================================================================= */}
      {activeTab === 'problems' && (
        <div className="space-y-3">
          {/* Anti-cheat banner warning if triggered */}
          {clipboardWarning && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-mono animate-pulse shadow-lg">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{clipboardWarning}</span>
            </div>
          )}

          {/* Slide-over Problem Matrix Drawer / Modal */}
          {showProblemMatrix && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-start animate-fade-in">
              <div className="w-full max-w-md h-full bg-[#08172B] border-r border-[#18385E] shadow-2xl flex flex-col p-5 space-y-4 font-mono text-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#18385E] pb-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-5 h-5 text-[#00CFFF]" />
                    <span className="font-bold text-white text-sm uppercase tracking-wider">Problem Matrix</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] border border-[#00CFFF]/30">
                      {questions.length} Challenges
                    </span>
                  </div>
                  <button
                    onClick={() => setShowProblemMatrix(false)}
                    className="p-1.5 rounded-xl bg-[#061329] hover:bg-[#102746] text-slate-400 hover:text-white border border-[#18385E] transition-colors"
                    title="Close Matrix Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Cards List inside Drawer */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {questions.map((q, idx) => {
                    const isCurrent = selectedQuestion && selectedQuestion.id === q.id;
                    const isSolved = q.status === 'solved';
                    const isLocked = q.is_locked;

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          selectDSAQuestion(q);
                          setShowProblemMatrix(false);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#102746] border-[#00CFFF] shadow-[0_0_15px_rgba(0,207,255,0.25)] ring-1 ring-[#00CFFF]'
                            : isLocked
                            ? 'bg-[#061329]/60 border-[#18385E]/50 opacity-60 cursor-not-allowed'
                            : 'bg-[#061329] border-[#18385E] hover:border-[#087FFF]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCurrent ? 'bg-[#00CFFF] text-slate-950' : 'bg-[#08172B] text-[#A9BCD6] border border-[#18385E]'
                            }`}>
                              {q.display_number || `Q${idx + 1}`}
                            </span>
                            <span className={`font-bold text-xs truncate max-w-[200px] ${
                              isCurrent ? 'text-white font-extrabold' : 'text-slate-200'
                            }`}>
                              {q.title}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {isSolved ? (
                            <span className="flex items-center space-x-1 text-[10px] text-[#20C997] font-bold bg-[#20C997]/10 px-2 py-0.5 rounded-full border border-[#20C997]/30">
                              <Check className="w-3 h-3" />
                              <span>Solved</span>
                            </span>
                          ) : isLocked ? (
                            <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/40">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          ) : isCurrent ? (
                            <span className="text-[10px] text-[#00CFFF] font-bold bg-[#00CFFF]/10 px-2 py-0.5 rounded-full border border-[#00CFFF]/30">
                              Current
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#A9BCD6] font-medium bg-slate-900 px-2 py-0.5 rounded-full border border-[#18385E]">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[#A9BCD6] mt-2 pt-1.5 border-t border-[#18385E]/40 font-mono">
                          <span className="text-[#00CFFF] font-bold">{q.points} PTS</span>
                          <span className={`capitalize ${
                            q.difficulty?.toLowerCase() === 'easy' || q.difficulty?.toLowerCase() === 'beginner' ? 'text-emerald-400' :
                            q.difficulty?.toLowerCase() === 'hard' || q.difficulty?.toLowerCase() === 'advanced' ? 'text-rose-400' : 'text-amber-400'
                          }`}>{q.difficulty}</span>
                          <span className="text-slate-400 truncate max-w-[120px]">{q.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Backdrop click to close */}
              <div className="flex-1" onClick={() => setShowProblemMatrix(false)} />
            </div>
          )}

          {/* Sleek Top Problem Navigation & Status Bar */}
          <div className="px-4 py-2.5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Left: Problem Selector & Steppers */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProblemMatrix(true)}
                className="px-3 py-1.5 rounded-xl bg-[#061329] hover:bg-[#102746] text-[#00CFFF] border border-[#00CFFF]/40 flex items-center space-x-1.5 font-bold transition-all shadow-[0_0_10px_rgba(0,207,255,0.15)]"
                title="Open Problem Matrix List"
              >
                <List className="w-3.5 h-3.5" />
                <span>Problem Matrix ({questions.length})</span>
              </button>

              {/* Prev Problem Button */}
              <button
                onClick={handlePrevQ}
                disabled={!hasPrevQ}
                className="p-1.5 rounded-xl bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                title="Previous Challenge"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Question Jump Selector Dropdown */}
              <select
                value={selectedQuestion?.id || ''}
                onChange={(e) => {
                  const found = questions.find(q => q.id === parseInt(e.target.value));
                  if (found) selectDSAQuestion(found);
                }}
                className="px-3 py-1.5 bg-[#061329] border border-[#18385E] rounded-xl text-white font-bold text-xs focus:border-[#00CFFF] focus:outline-none max-w-[260px] truncate"
              >
                {questions.map((q, idx) => (
                  <option key={q.id} value={q.id}>
                    {q.status === 'solved' ? '✓ ' : ''}{q.display_number || `Q${idx + 1}`}: {q.title} ({q.points} PTS)
                  </option>
                ))}
              </select>

              {/* Next Problem Button */}
              <button
                onClick={handleNextQ}
                disabled={!hasNextQ}
                className="p-1.5 rounded-xl bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                title="Next Challenge"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Live Timer & Progress */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              <div className="flex items-center space-x-1.5 text-xs text-[#00CFFF] bg-[#061329] px-3 py-1 rounded-xl border border-[#18385E]">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeRemaining || 'Active Session'}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-[#20C997] bg-[#061329] px-3 py-1 rounded-xl border border-[#18385E]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Solved {questions.filter(q => q.status === 'solved').length} / {questions.length}</span>
              </div>
            </div>

            {/* Right: Points Badge & Candidate */}
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 rounded-xl bg-[#061329] border border-[#18385E] text-[#00CFFF] font-bold text-[11px]">
                {selectedQuestion?.points} PTS • {selectedQuestion?.difficulty}
              </span>
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#061329] border border-[#18385E] text-[11px]">
                <div className="w-4 h-4 rounded-full bg-[#087FFF]/30 flex items-center justify-center text-[#00CFFF] text-[9px] font-bold">
                  {(currentUser?.username || 'U')[0].toUpperCase()}
                </div>
                <span className="text-white font-medium">{currentUser?.username || 'Candidate'}</span>
              </div>
            </div>
          </div>

          {/* Main Full-Width Split Coding Arena: Left Problem Dossier (50%) + Right IDE & Output Terminal (50%) */}
          {selectedQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[660px]">
              
              {/* Left Column: Spacious Problem Dossier (lg:col-span-6) */}
              <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-2xl flex flex-col space-y-4 font-sans text-xs h-[calc(100vh-170px)] min-h-[640px] overflow-y-auto">
                    {/* Sub-tab Navigation */}
                    <div className="flex items-center justify-between border-b border-[#18385E] pb-3">
                      <div className="flex rounded-xl bg-[#061329] p-1 border border-[#18385E]">
                        <button
                          onClick={() => setDsaSubTab('statement')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            dsaSubTab === 'statement'
                              ? 'bg-[#102746] text-[#00CFFF] shadow-sm'
                              : 'text-[#A9BCD6] hover:text-white'
                          }`}
                        >
                          Problem Dossier
                        </button>
                        <button
                          onClick={() => setDsaSubTab('results')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                            dsaSubTab === 'results'
                              ? 'bg-[#102746] text-[#00CFFF] shadow-sm'
                              : 'text-[#A9BCD6] hover:text-white'
                          }`}
                        >
                          <span>Output Diagnostics</span>
                          {executionResults[selectedQuestion.id] && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              executionResults[selectedQuestion.id].verdict === 'ACCEPTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {executionResults[selectedQuestion.id].verdict}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setDsaSubTab('history')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            dsaSubTab === 'history'
                              ? 'bg-[#102746] text-[#00CFFF] shadow-sm'
                              : 'text-[#A9BCD6] hover:text-white'
                          }`}
                        >
                          Submissions
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[#00CFFF] font-bold text-xs">{selectedQuestion.points} pts</span>
                      </div>
                    </div>

                    {/* Sub-tab 1: Problem Dossier */}
                    {dsaSubTab === 'statement' && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-white text-base font-mono">{selectedQuestion.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#08172B] text-[#A9BCD6] border border-[#18385E]">
                              {selectedQuestion.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-[#A9BCD6]">
                            <span>Difficulty: <strong className="text-white">{selectedQuestion.difficulty}</strong></span>
                            <span>•</span>
                            <span>Time: <strong className="text-white">{selectedQuestion.time_limit_ms || 2000} ms</strong></span>
                            <span>•</span>
                            <span>Mem: <strong className="text-white">{selectedQuestion.memory_limit_mb || 256} MB</strong></span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block mb-1">Specification &amp; Description</span>
                          <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans p-3.5 rounded-xl bg-[#061329] border border-[#18385E]">
                            {selectedQuestion.statement}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block mb-1">Input Specification</span>
                          <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E] text-slate-300 font-mono text-xs whitespace-pre-wrap">
                            {selectedQuestion.input_spec}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block mb-1">Output Specification</span>
                          <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E] text-slate-300 font-mono text-xs whitespace-pre-wrap">
                            {selectedQuestion.output_spec}
                          </div>
                        </div>

                        {selectedQuestion.constraints && (
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block mb-1">Constraints</span>
                            <div className="p-3 rounded-xl bg-[#061329] border border-[#18385E] text-slate-300 font-mono text-xs whitespace-pre-wrap">
                              {selectedQuestion.constraints}
                            </div>
                          </div>
                        )}

                        {/* Public Samples */}
                        {selectedQuestion.sample_tests && selectedQuestion.sample_tests.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block">Public Test Samples</span>
                            {selectedQuestion.sample_tests.map((s, sIdx) => (
                              <div key={sIdx} className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] space-y-2">
                                <span className="text-[10px] font-mono text-[#A9BCD6] font-bold block">Sample Case #{sIdx + 1}</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-[9px] text-[#A9BCD6] block mb-1 uppercase">Standard Input</span>
                                    <pre className="p-2.5 rounded-lg bg-[#08172B] text-slate-200 text-[11px] overflow-x-auto border border-[#18385E]/60">{s.input}</pre>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#A9BCD6] block mb-1 uppercase">Expected Output</span>
                                    <pre className="p-2.5 rounded-lg bg-[#08172B] text-emerald-400 text-[11px] overflow-x-auto border border-[#18385E]/60">{s.output}</pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 2: Execution Results */}
                    {dsaSubTab === 'results' && (
                      <div className="space-y-4">
                        {!executionResults[selectedQuestion.id] ? (
                          <div className="py-16 text-center text-[#A9BCD6]">
                            Click "Run Samples" or "Submit Code" to inspect the sandboxed execution results.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Verdict Box */}
                            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-[#A9BCD6] uppercase block">Evaluation Verdict</span>
                                <span className={`text-base font-bold font-mono ${
                                  executionResults[selectedQuestion.id].verdict === 'ACCEPTED' ? 'text-[#20C997]' : 'text-rose-400'
                                }`}>
                                  {executionResults[selectedQuestion.id].verdict}
                                </span>
                              </div>
                              {executionResults[selectedQuestion.id].execution_time_ms !== undefined && (
                                <div className="text-right">
                                  <span className="text-[10px] text-[#A9BCD6] uppercase block">Execution Time</span>
                                  <span className="text-xs font-mono text-white">{executionResults[selectedQuestion.id].execution_time_ms} ms</span>
                                </div>
                              )}
                            </div>

                            {/* Compiler / Diagnostics Log */}
                            {executionResults[selectedQuestion.id].compile_log && (
                              <div>
                                <span className="text-[10px] text-[#A9BCD6] uppercase block mb-1">Diagnostic Log</span>
                                <pre className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 overflow-x-auto font-mono whitespace-pre-wrap">
                                  {executionResults[selectedQuestion.id].compile_log}
                                </pre>
                              </div>
                            )}

                            {/* Test Matrix */}
                            {executionResults[selectedQuestion.id].test_results && executionResults[selectedQuestion.id].test_results.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] text-[#A9BCD6] uppercase block">Sandbox Test Case Matrix</span>
                                {executionResults[selectedQuestion.id].test_results.map((tr, idx) => (
                                  <div key={idx} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                                    <span className="text-slate-300">Test #{idx + 1} ({tr.type})</span>
                                    <span className={`font-bold ${
                                      tr.verdict === 'ACCEPTED' ? 'text-[#20C997]' : 'text-rose-400'
                                    }`}>
                                      {tr.verdict}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 3: History */}
                    {dsaSubTab === 'history' && (
                      <div className="space-y-3">
                        {userSubmissions.filter(s => s.question_id === selectedQuestion.id).length === 0 ? (
                          <div className="py-12 text-center text-[#A9BCD6]">
                            No submissions recorded for this question in this tournament yet.
                          </div>
                        ) : (
                          userSubmissions
                            .filter(s => s.question_id === selectedQuestion.id)
                            .map(sub => (
                              <div key={sub.id} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-white text-xs">Submission #{sub.id}</span>
                                  <span className="text-[10px] text-[#A9BCD6] block uppercase">{sub.language} • {new Date(sub.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    sub.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-[#20C997] border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                                  }`}>
                                    {sub.verdict}
                                  </span>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Code Console & Interactive Terminal (lg:col-span-6) */}
                  <div className="lg:col-span-6 p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-2xl flex flex-col space-y-3 h-[calc(100vh-170px)] min-h-[640px] overflow-y-auto">
                    {/* Editor Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#18385E] pb-3 font-mono text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#A9BCD6]">Language:</span>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#061329] border border-[#18385E] rounded-xl text-white font-mono text-xs focus:border-[#00CFFF] focus:outline-none"
                        >
                          <option value="python3">Python 3.14</option>
                          <option value="cpp">C++ (g++ 17)</option>
                          <option value="c">C (gcc 11)</option>
                        </select>

                        <button
                          onClick={() => setUseTouchEditor(!useTouchEditor)}
                          title="Toggle Mobile Touch Editor"
                          className={`p-1.5 rounded-xl border text-xs transition-colors ${
                            useTouchEditor ? 'bg-[#00CFFF]/20 text-[#00CFFF] border-[#00CFFF]/60' : 'text-[#A9BCD6] border-[#18385E] hover:bg-[#102746]'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleResetCode}
                          title="Reset code to original starter template"
                          className="p-1.5 rounded-xl border text-xs text-[#A9BCD6] border-[#18385E] hover:bg-[#102746] hover:text-white"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleRunSample}
                          disabled={isRunningSample || isSubmittingDSA}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-200 bg-[#061329] hover:bg-[#102746] border border-[#18385E] transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 text-[#00CFFF] fill-current" />
                          <span>{isRunningSample ? 'Testing...' : 'Run Samples'}</span>
                        </button>

                        <button
                          onClick={handleSubmitDSA}
                          disabled={isSubmittingDSA || isRunningSample}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-[#00CFFF] to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_15px_rgba(0,207,255,0.4)] transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingDSA ? 'Evaluating...' : 'Submit Code'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Monaco Editor Container */}
                    <div className={`rounded-xl overflow-hidden border border-[#18385E] bg-[#061329] transition-all relative ${
                      !terminalOpen ? 'h-[680px]' : (editorHeightMode === 'max_terminal' ? 'h-[240px]' : 'h-[390px]')
                    }`}>
                      {useTouchEditor ? (
                        <textarea
                          value={getCurrentCode()}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          className="w-full h-full p-4 bg-[#061329] text-[#00CFFF] font-mono text-xs leading-relaxed resize-none focus:outline-none"
                          placeholder="// Write your solution here..."
                          spellCheck="false"
                        />
                      ) : (
                        <Editor
                          height="100%"
                          language={language === 'python3' ? 'python' : 'cpp'}
                          theme="vs-dark"
                          value={getCurrentCode()}
                          onChange={(val) => handleCodeChange(val || '')}
                          onMount={handleEditorMount}
                          options={{
                            fontSize: 13,
                            fontFamily: 'JetBrains Mono, monospace',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            lineNumbers: 'on',
                            cursorBlinking: 'smooth',
                            contextmenu: isCopyPasteAllowed
                          }}
                        />
                      )}
                    </div>

                    {/* Integrated Execution Console & Output Terminal */}
                    <div className="rounded-xl border border-[#18385E] bg-[#061329] flex flex-col overflow-hidden font-mono text-xs shadow-xl">
                      {/* Terminal Top Bar */}
                      <div className="px-3.5 py-2.5 bg-[#08172B] border-b border-[#18385E] flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-2.5">
                          <Terminal className="w-4 h-4 text-[#00CFFF]" />
                          <span className="font-bold text-white tracking-wider text-xs">
                            EXECUTION OUTPUT TERMINAL
                          </span>
                          
                          {/* Live Running Badge */}
                          {(isRunningSample || isSubmittingDSA) && (
                            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] border border-[#00CFFF]/40 text-[10px] animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>{isRunningSample ? 'Testing Samples...' : 'Evaluating Judge...'}</span>
                            </span>
                          )}

                          {/* Finished Result Badge */}
                          {executionResults[selectedQuestion.id] && !isRunningSample && !isSubmittingDSA && (
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                executionResults[selectedQuestion.id].verdict === 'ACCEPTED'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                  : executionResults[selectedQuestion.id].verdict === 'WRONG ANSWER' || executionResults[selectedQuestion.id].verdict === 'WRONG_ANSWER'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                              }`}>
                                {executionResults[selectedQuestion.id].verdict}
                              </span>
                              {executionResults[selectedQuestion.id].execution_time_ms !== undefined && (
                                <span className="text-[10px] text-slate-400">
                                  {executionResults[selectedQuestion.id].execution_time_ms} ms
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Terminal Controls */}
                        <div className="flex items-center space-x-2">
                          {executionResults[selectedQuestion.id] && (
                            <div className="flex bg-[#061329] rounded-lg p-0.5 border border-[#18385E]">
                              <button
                                onClick={() => { setActiveTerminalTab('tests'); setTerminalOpen(true); }}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                  activeTerminalTab === 'tests' ? 'bg-[#102746] text-[#00CFFF] shadow-sm' : 'text-[#A9BCD6] hover:text-white'
                                }`}
                              >
                                Test Matrix ({executionResults[selectedQuestion.id].test_results?.length || 0})
                              </button>
                              {(executionResults[selectedQuestion.id].compile_log || executionResults[selectedQuestion.id].compile_output) && (
                                <button
                                  onClick={() => { setActiveTerminalTab('compiler'); setTerminalOpen(true); }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                    activeTerminalTab === 'compiler' ? 'bg-[#102746] text-rose-400 shadow-sm' : 'text-[#A9BCD6] hover:text-white'
                                  }`}
                                >
                                  Compiler Log
                                </button>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (!terminalOpen) setTerminalOpen(true);
                              setEditorHeightMode(editorHeightMode === 'max_terminal' ? 'split' : 'max_terminal');
                            }}
                            className="p-1.5 rounded-lg bg-[#061329] hover:bg-[#102746] text-[#A9BCD6] hover:text-white border border-[#18385E] transition-colors"
                            title={editorHeightMode === 'max_terminal' ? "Restore Split View" : "Maximize Terminal"}
                          >
                            {editorHeightMode === 'max_terminal' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setTerminalOpen(!terminalOpen)}
                            className="p-1.5 rounded-lg bg-[#061329] hover:bg-[#102746] text-[#A9BCD6] hover:text-white border border-[#18385E] transition-colors"
                            title={terminalOpen ? "Collapse Terminal" : "Expand Terminal"}
                          >
                            {terminalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Terminal Body */}
                      {terminalOpen && (
                        <div className={`p-4 overflow-y-auto space-y-3 bg-[#061329] ${
                          editorHeightMode === 'max_terminal' ? 'h-[480px]' : 'max-h-[320px]'
                        }`}>
                          {/* Idle State */}
                          {!executionResults[selectedQuestion.id] && !isRunningSample && !isSubmittingDSA && (
                            <div className="py-8 flex flex-col items-center justify-center text-slate-500 space-y-2">
                              <Terminal className="w-7 h-7 text-slate-600" />
                              <p className="text-xs">
                                Terminal idle. Click <strong className="text-slate-300">"Run Samples"</strong> to test public cases or <strong className="text-slate-300">"Submit Code"</strong> to evaluate against judge vectors.
                              </p>
                            </div>
                          )}

                          {/* Running State */}
                          {(isRunningSample || isSubmittingDSA) && (
                            <div className="py-8 flex flex-col items-center justify-center text-[#00CFFF] space-y-2.5">
                              <RefreshCw className="w-7 h-7 animate-spin" />
                              <p className="text-xs font-bold">
                                Spawning isolated sandbox • Compiling binary • Evaluating test vectors...
                              </p>
                            </div>
                          )}

                          {/* Result Available */}
                          {executionResults[selectedQuestion.id] && !isRunningSample && !isSubmittingDSA && (
                            <>
                              {/* Compiler / Error Output tab or direct display if error */}
                              {(activeTerminalTab === 'compiler' || (!executionResults[selectedQuestion.id].test_results?.length && executionResults[selectedQuestion.id].compile_log)) && (
                                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/60 text-rose-300 text-xs space-y-1">
                                  <div className="flex items-center space-x-1.5 font-bold text-rose-400 mb-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Compiler / Diagnostic Output:</span>
                                  </div>
                                  <pre className="text-[11px] whitespace-pre-wrap font-mono overflow-x-auto">
                                    {executionResults[selectedQuestion.id].compile_log || executionResults[selectedQuestion.id].compile_output || 'No diagnostics recorded.'}
                                  </pre>
                                </div>
                              )}

                              {/* Test Results tab */}
                              {activeTerminalTab === 'tests' && executionResults[selectedQuestion.id].test_results && executionResults[selectedQuestion.id].test_results.length > 0 && (
                                <div className="space-y-3">
                                  {/* Test Case Pill Selector */}
                                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                                    {executionResults[selectedQuestion.id].test_results.map((tr, idx) => {
                                      const isPassed = tr.verdict === 'ACCEPTED' || tr.status === 'PASSED';
                                      const isSelected = selectedTestCaseIndex === idx;
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => setSelectedTestCaseIndex(idx)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                                            isSelected
                                              ? 'bg-[#102746] text-[#00CFFF] border border-[#00CFFF]/60 shadow-[0_0_10px_rgba(0,207,255,0.2)]'
                                              : isPassed
                                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-950/60'
                                              : 'bg-rose-950/40 text-rose-400 border border-rose-800/60 hover:bg-rose-950/60'
                                          }`}
                                        >
                                          <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                          <span>Case #{idx + 1}</span>
                                          <span className="text-[10px] opacity-75">({tr.verdict || tr.status})</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Selected Test Case Detail Box */}
                                  {(() => {
                                    const currentCase = executionResults[selectedQuestion.id].test_results[selectedTestCaseIndex] || executionResults[selectedQuestion.id].test_results[0];
                                    if (!currentCase) return null;
                                    const isPassed = currentCase.verdict === 'ACCEPTED' || currentCase.status === 'PASSED';
                                    const expected = currentCase.expected_output !== undefined ? currentCase.expected_output : (currentCase.output || '');
                                    const actual = currentCase.actual_output !== undefined ? currentCase.actual_output : (currentCase.actual || '<no output>');

                                    return (
                                      <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                                        isPassed ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
                                      }`}>
                                        <div className="flex items-center justify-between font-bold">
                                          <span className="text-white">
                                            Test Case #{selectedTestCaseIndex + 1} ({currentCase.id || `case_${selectedTestCaseIndex + 1}`}) • {currentCase.type || 'sample'}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            {currentCase.exec_time_ms !== undefined && (
                                              <span className="text-[10px] text-slate-400">{currentCase.exec_time_ms} ms</span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              isPassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-rose-950 text-rose-400 border border-rose-700'
                                            }`}>
                                              {currentCase.verdict || currentCase.status}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Input / Expected / Actual Output Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                          {currentCase.input && (
                                            <div className="md:col-span-2">
                                              <span className="text-[10px] text-slate-400 uppercase block mb-1">Standard Input:</span>
                                              <pre className="p-2 rounded-lg bg-[#08172B] border border-[#18385E] text-slate-200 overflow-x-auto text-[11px] whitespace-pre-wrap">
                                                {currentCase.input}
                                              </pre>
                                            </div>
                                          )}
                                          <div>
                                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Expected Output:</span>
                                            <pre className="p-2 rounded-lg bg-[#08172B] border border-[#18385E] text-slate-200 overflow-x-auto text-[11px] whitespace-pre-wrap">
                                              {expected}
                                            </pre>
                                          </div>
                                          <div>
                                            <span className="text-[10px] text-slate-400 uppercase block mb-1">Your Program Output:</span>
                                            <pre className={`p-2 rounded-lg bg-[#08172B] border border-[#18385E] overflow-x-auto text-[11px] whitespace-pre-wrap ${
                                              isPassed ? 'text-emerald-300' : 'text-rose-300'
                                            }`}>
                                              {actual}
                                            </pre>
                                          </div>
                                        </div>

                                        {/* Error / Traceback if any */}
                                        {currentCase.error && currentCase.error !== '[HIDDEN]' && (
                                          <div className="pt-1">
                                            <span className="text-[10px] text-rose-400 uppercase block font-bold mb-1">Standard Error / Traceback:</span>
                                            <pre className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-200 text-[11px] overflow-x-auto whitespace-pre-wrap">
                                              {currentCase.error}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-[#A9BCD6] font-mono rounded-2xl bg-[#0B1D38] border border-[#18385E]">
                  Select a problem from the Problem Matrix to begin coding and sandbox execution.
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
          TAB 7: MY PROGRESS & SCORECARD
          ========================================================================= */}
      {activeTab === 'progress' && (() => {
        const dsaSolved = questions.filter(q => q.status === 'solved');
        const ctfSolved = challenges.filter(c => c.status === 'solved');
        const mcqSolved = mcqs.filter(m => m.status === 'solved');

        const totalItems = questions.length + challenges.length + mcqs.length;
        const totalSolved = dsaSolved.length + ctfSolved.length + mcqSolved.length;
        const completionPct = totalItems > 0 ? Math.round((totalSolved / totalItems) * 100) : 0;

        const maxPoints = (
          questions.reduce((acc, q) => acc + (q.points || 0), 0) +
          challenges.reduce((acc, c) => acc + (c.points || 0), 0) +
          mcqs.reduce((acc, m) => acc + (m.points_positive || 0), 0)
        );

        const earnedPoints = (
          dsaSolved.reduce((acc, q) => acc + (q.points || 0), 0) +
          ctfSolved.reduce((acc, c) => acc + (c.points || 0), 0) +
          mcqSolved.reduce((acc, m) => acc + (m.points_positive || 0), 0)
        );

        const pointsPct = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
        const acceptedSubs = userSubmissions.filter(s => s.verdict === 'ACCEPTED').length;
        const accuracyPct = userSubmissions.length > 0 ? Math.round((acceptedSubs / userSubmissions.length) * 100) : 0;

        return (
          <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
            {/* Top Scorecard Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#A9BCD6] uppercase tracking-wider block mb-1">Total Score Earned</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-[#00CFFF]">{earnedPoints}</span>
                    <span className="text-xs text-[#A9BCD6]">/ {maxPoints} PTS</span>
                  </div>
                </div>
                <div className="w-full bg-[#061329] h-2 rounded-full overflow-hidden mt-3 border border-[#18385E]">
                  <div className="bg-gradient-to-r from-[#087FFF] to-[#00CFFF] h-full transition-all duration-500" style={{ width: `${pointsPct}%` }} />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#A9BCD6] uppercase tracking-wider block mb-1">Completion Rate</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-[#20C997]">{completionPct}%</span>
                    <span className="text-xs text-[#A9BCD6]">({totalSolved}/{totalItems} Solved)</span>
                  </div>
                </div>
                <div className="w-full bg-[#061329] h-2 rounded-full overflow-hidden mt-3 border border-[#18385E]">
                  <div className="bg-[#20C997] h-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#A9BCD6] uppercase tracking-wider block mb-1">Submission Accuracy</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-[#F5B942]">{accuracyPct}%</span>
                    <span className="text-xs text-[#A9BCD6]">({acceptedSubs}/{userSubmissions.length} OK)</span>
                  </div>
                </div>
                <div className="w-full bg-[#061329] h-2 rounded-full overflow-hidden mt-3 border border-[#18385E]">
                  <div className="bg-[#F5B942] h-full transition-all duration-500" style={{ width: `${accuracyPct}%` }} />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#A9BCD6] uppercase tracking-wider block mb-1">Operative Standing</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-lg font-bold text-white truncate">{currentUser?.username || 'Candidate'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#00CFFF] uppercase tracking-wider mt-2">
                  Mode: {event?.participation_mode || 'Individual'}
                </span>
              </div>
            </div>

            {/* Challenge Breakdown Matrix */}
            <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#18385E] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-[#00CFFF]" />
                  <span>CHALLENGE SOLVE PROGRESSION MATRIX</span>
                </h3>
                <span className="text-[#A9BCD6] text-[11px]">
                  {totalSolved} of {totalItems} completed
                </span>
              </div>

              {/* DSA Questions List */}
              {questions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00CFFF] block">
                    Data Structures &amp; Algorithms ({dsaSolved.length}/{questions.length} Solved)
                  </span>
                  <div className="divide-y divide-[#18385E]/50 rounded-xl border border-[#18385E] overflow-hidden bg-[#061329]">
                    {questions.map((q, idx) => {
                      const isSolved = q.status === 'solved';
                      return (
                        <div key={q.id} className="p-3.5 flex items-center justify-between hover:bg-[#102746]/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isSolved ? 'bg-emerald-950 text-[#20C997] border border-emerald-800' : 'bg-[#08172B] text-slate-400 border border-[#18385E]'
                            }`}>
                              {isSolved ? '✓' : idx + 1}
                            </span>
                            <div>
                              <span className="text-white font-medium block">{q.title}</span>
                              <span className="text-[10px] text-[#A9BCD6]">{q.category} • {q.difficulty} • {q.points} PTS</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isSolved ? 'bg-emerald-950/60 text-[#20C997] border border-emerald-800/60' : 'bg-slate-900 text-slate-400 border border-[#18385E]'
                            }`}>
                              {isSolved ? 'SOLVED' : 'PENDING'}
                            </span>
                            <button
                              onClick={() => {
                                selectDSAQuestion(q);
                                setActiveTab('problems');
                              }}
                              className="px-3 py-1 rounded-lg bg-[#08172B] hover:bg-[#102746] text-[#00CFFF] border border-[#18385E] text-[10px] font-bold transition-colors"
                            >
                              {isSolved ? 'Review' : 'Solve'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTF Challenges List */}
              {challenges.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                    CTF Flags &amp; Targets ({ctfSolved.length}/{challenges.length} Captured)
                  </span>
                  <div className="divide-y divide-[#18385E]/50 rounded-xl border border-[#18385E] overflow-hidden bg-[#061329]">
                    {challenges.map(c => {
                      const isSolved = c.status === 'solved';
                      return (
                        <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-[#102746]/30 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isSolved ? 'bg-emerald-950 text-[#20C997] border border-emerald-800' : 'bg-[#08172B] text-slate-400 border border-[#18385E]'
                            }`}>
                              {isSolved ? '✓' : '⚑'}
                            </span>
                            <div>
                              <span className="text-white font-medium block">{c.title}</span>
                              <span className="text-[10px] text-[#A9BCD6]">{c.category} • {c.difficulty} • {c.points} PTS</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isSolved ? 'bg-emerald-950/60 text-[#20C997] border border-emerald-800/60' : 'bg-slate-900 text-slate-400 border border-[#18385E]'
                            }`}>
                              {isSolved ? 'CAPTURED' : 'PENDING'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedChallenge(c);
                                setActiveTab('challenges');
                              }}
                              className="px-3 py-1 rounded-lg bg-[#08172B] hover:bg-[#102746] text-[#00CFFF] border border-[#18385E] text-[10px] font-bold transition-colors"
                            >
                              {isSolved ? 'Inspect' : 'Capture'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 8: RULES & PROTOCOL
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

      {/* =========================================================================
          REGISTRATION CONFIRMATION & NAVIGATION MODAL
          ========================================================================= */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0B1D38] border border-[#00CFFF]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,207,255,0.25)] space-y-6 relative">
            <button
              onClick={() => setShowRegistrationModal(false)}
              className="absolute top-4 right-4 text-[#A9BCD6] hover:text-white p-1 rounded-lg hover:bg-[#102746] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#20C997]/20 border border-[#20C997] flex items-center justify-center text-[#20C997] shadow-[0_0_20px_rgba(32,201,151,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black font-mono text-white tracking-wide">
                ENLISTMENT CONFIRMED
              </h2>
              <p className="text-xs text-[#A9BCD6]">
                You have officially registered for <span className="text-[#00CFFF] font-bold font-mono">{event?.title}</span>. Choose how you want to proceed into the tournament:
              </p>
            </div>

            <div className="space-y-3">
              {/* If team / mixed event, show Team Formation option */}
              {(['team', 'mixed', 'any'].includes(event?.participation_mode?.toLowerCase()) || config?.has_teams) && (
                <button
                  onClick={() => {
                    setShowRegistrationModal(false);
                    setActiveTab('squad');
                  }}
                  className="w-full p-4 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] hover:bg-[#102746] transition-all text-left flex items-start space-x-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF] group-hover:scale-110 transition-transform shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white group-hover:text-[#00CFFF] font-mono">
                        Squad Formation & Recruitment
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#00CFFF] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-[#A9BCD6] mt-1 font-sans">
                      Form an operative team, generate invitation tokens for teammates, or join an existing squad.
                    </p>
                  </div>
                </button>
              )}

              {/* Enter Arena directly */}
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setActiveTab(primaryPlayTab);
                }}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-[#087FFF]/20 to-[#00CFFF]/20 border border-[#00CFFF]/50 hover:border-[#00CFFF] hover:shadow-[0_0_25px_rgba(0,207,255,0.3)] transition-all text-left flex items-start space-x-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00CFFF]/20 border border-[#00CFFF] flex items-center justify-center text-[#00CFFF] group-hover:scale-110 transition-transform shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-[#00CFFF] font-mono">
                      Launch Challenge Arena Directly
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#00CFFF] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-[#A9BCD6] mt-1 font-sans">
                    Deploy straight into the competition arena to view problems, launch container labs, and submit solutions.
                  </p>
                </div>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-xs text-[#A9BCD6] hover:text-white transition-colors font-mono underline"
              >
                Stay on Event Overview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
