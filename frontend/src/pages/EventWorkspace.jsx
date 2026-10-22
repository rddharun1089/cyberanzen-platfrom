import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Shield, Terminal, Trophy, Users, HelpCircle, Code2, Cpu, 
  ArrowRight, CheckCircle2, AlertOctagon, Clock, Flame, Play, 
  RefreshCw, FileText, BarChart2, Check, Lock, Key, AlertTriangle 
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

      // Default active tab to problems/challenges/quizzes if user already registered
      if (evDetail.is_registered) {
        if (evConfig.event_type === 'dsa') setActiveTab('problems');
        else if (evConfig.event_type === 'ctf') setActiveTab('challenges');
        else if (evConfig.event_type === 'mcq') setActiveTab('quizzes');
      }

      // Load event-specific content
      if (evConfig.event_type === 'dsa') {
        const qData = await eventService.getEventQuestions(targetEventId);
        setQuestions(qData);
        if (qData.length > 0) {
          selectDSAQuestion(qData[0]);
        }
      } else if (evConfig.event_type === 'ctf') {
        const cData = await eventService.getEventChallenges(targetEventId);
        setChallenges(cData);
        if (cData.length > 0) {
          selectCTFChallenge(cData[0]);
        }
      } else if (evConfig.event_type === 'mcq') {
        const mData = await eventService.getEventMCQs(targetEventId);
        setMcqs(mData);
        if (mData.length > 0) {
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

  const selectDSAQuestion = (q) => {
    setSelectedQuestion(q);
    setJudgeVerdict(null);
    setCode(q.starter_py || '# Write solution here\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n');
  };

  const selectCTFChallenge = (c) => {
    setSelectedChallenge(c);
    setFlagInput('');
    setFlagResult(null);
    setLabInstance(null);
  };

  const handleRegister = async (mode = 'individual') => {
    try {
      await eventService.registerEvent(event.id, mode);
      alert(`Enlistment confirmed for ${event.title}!`);
      await loadEventData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed.');
    }
  };

  const handleRunSample = async () => {
    if (!selectedQuestion) return;
    setJudgeRunning(true);
    try {
      const res = await questionService.runSample(selectedQuestion.id, language, code);
      setJudgeVerdict(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Execution failed.');
    } finally {
      setJudgeRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!selectedQuestion) return;
    setJudgeRunning(true);
    try {
      const res = await questionService.submitSolution(selectedQuestion.id, language, code, event.id);
      setJudgeVerdict(res);
      if (res.verdict === 'ACCEPTED') {
        alert('ACCEPTED! Solution verified against hidden test suite.');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed.');
    } finally {
      setJudgeRunning(false);
    }
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!selectedChallenge || !flagInput.trim()) return;
    setFlagSubmitting(true);
    try {
      const res = await challengeService.submitFlag(selectedChallenge.id, flagInput.trim(), event.id);
      setFlagResult(res);
      if (res.success) {
        alert(`CORRECT FLAG! Awarded ${res.points_awarded} points.`);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Invalid flag submission.');
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleLaunchLab = async () => {
    if (!selectedChallenge) return;
    setLabLoading(true);
    try {
      const res = await labService.launchLab(selectedChallenge.id);
      setLabInstance(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to spawn lab environment.');
    } finally {
      setLabLoading(false);
    }
  };

  const handleStopLab = async () => {
    if (!labInstance) return;
    try {
      await labService.stopLab(labInstance.instance_id);
      setLabInstance(null);
    } catch (err) {
      alert('Failed to stop lab.');
    }
  };

  const handleSubmitMcq = async () => {
    if (!selectedMcq || selectedOptions.length === 0) return;
    setMcqSubmitting(true);
    try {
      const res = await mcqService.submitAttempt(selectedMcq.id, selectedOptions, 30, event.id);
      setMcqResult(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record attempt.');
    } finally {
      setMcqSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 font-mono text-cyan-400 animate-pulse">
        Initializing Event Neural Link...
      </div>
    );
  }

  if (!event || !config) {
    return (
      <div className="flex-1 max-w-4xl mx-auto py-20 text-center font-mono">
        <h3 className="text-xl font-bold text-white">Event Tournament Not Found</h3>
        <Link to="/events" className="text-xs text-cyan-400 underline mt-3 inline-block">Back to Events Hub</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Breadcrumb Back to Events */}
      <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
        <Link to="/events" className="hover:text-cyan-400 flex items-center space-x-1">
          <ArrowRight className="w-3.5 h-3.5 rotate-180 text-cyan-400" />
          <span>Back to All Events</span>
        </Link>
        <span>/</span>
        <span className="text-white truncate max-w-md">{event.title}</span>
      </div>

      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-bold tracking-wider">
              {config.event_type.toUpperCase()} ARENA
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize font-medium">
              Mode: {config.participation_mode}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
              event.status === 'live' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
              event.status === 'registration_open' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
              'bg-slate-800 text-slate-400'
            }`}>
              {event.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {event.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
            {event.short_description || event.description}
          </p>
        </div>

        {/* Registration CTA if not registered */}
        {!event.is_registered ? (
          <div className="flex items-center space-x-3">
            {event.participation_mode === 'mixed' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRegister('individual')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Join Solo
                </button>
                <button
                  onClick={() => handleRegister('team')}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                  Join Squad
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleRegister(event.participation_mode === 'team' ? 'team' : 'individual')}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
              >
                Enroll in Competition
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>OPERATIVE ENLISTED // READY</span>
          </div>
        )}
      </div>

      {/* Dynamic Event Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1 pb-1 font-mono text-xs">
        {config.tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-xl transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-slate-900 text-cyan-400 border-t border-x border-slate-800 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider">Tournament Dossier</h3>
            <div className="prose prose-invert prose-sm text-slate-300 text-xs leading-relaxed whitespace-pre-line font-mono">
              {event.description}
            </div>
            {event.rules && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-mono text-amber-400 font-bold uppercase mb-2">Rules of Engagement</h4>
                <div className="text-xs text-slate-400 whitespace-pre-line font-mono">{event.rules}</div>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-sm text-cyan-400 font-bold uppercase tracking-wider">Parameters</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Category:</span>
                <span className="text-white font-bold">{event.category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Difficulty:</span>
                <span className="text-white">{event.difficulty}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Organizer:</span>
                <span className="text-white">{event.organizer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Timezone:</span>
                <span className="text-white">{event.timezone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Start Time:</span>
                <span className="text-white">{event.start_time ? new Date(event.start_time).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">End Time:</span>
                <span className="text-white">{event.end_time ? new Date(event.end_time).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Clipboard Restriction:</span>
                <span className="text-cyan-400 font-bold uppercase">{event.clipboard_policy}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DSA PROBLEMS WORKSPACE */}
      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Sidebar */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2 max-h-[750px] overflow-y-auto font-mono text-xs">
            <h3 className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-3">Event Problem Set</h3>
            {questions.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No challenges assigned to this event yet.</div>
            ) : (
              questions.map(q => {
                const isCurrent = selectedQuestion && selectedQuestion.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => selectDSAQuestion(q)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{q.title}</span>
                      <span className="text-cyan-400 text-xs font-bold">{q.points} pts</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
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
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-white text-sm">{selectedQuestion.title}</h3>
                  <span className="text-cyan-400 font-bold">{selectedQuestion.points} points</span>
                </div>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedQuestion.statement}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Input Specification:</span>
                    <span className="text-slate-200">{selectedQuestion.input_spec}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Output Specification:</span>
                    <span className="text-slate-200">{selectedQuestion.output_spec}</span>
                  </div>
                </div>
              </div>

              {/* Monaco IDE Header */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">Runtime:</span>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    >
                      <option value="python3">Python 3.14</option>
                      <option value="cpp">C++ 17 (G++)</option>
                      <option value="c">C 11 (GCC)</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={judgeRunning}
                      onClick={handleRunSample}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold disabled:opacity-40"
                    >
                      Run Samples
                    </button>
                    <button
                      type="button"
                      disabled={judgeRunning}
                      onClick={handleSubmitSolution}
                      className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40"
                    >
                      {judgeRunning ? 'Evaluating...' : 'Submit Code'}
                    </button>
                  </div>
                </div>

                {/* Editor Container */}
                <div className="h-80">
                  <Editor
                    height="100%"
                    language={language === 'python3' ? 'python' : 'cpp'}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </div>

              {/* Verdict Console */}
              {judgeVerdict && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">JUDGE VERDICT:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      judgeVerdict.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {judgeVerdict.verdict}
                    </span>
                  </div>
                  {judgeVerdict.compile_log && (
                    <pre className="text-[11px] text-rose-300 bg-slate-900 p-2 rounded max-h-32 overflow-y-auto">
                      {judgeVerdict.compile_log}
                    </pre>
                  )}
                  {judgeVerdict.test_results && (
                    <div className="space-y-1 pt-1">
                      {judgeVerdict.test_results.map((tr, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] border-b border-slate-800/40 pb-1">
                          <span className="text-slate-400">Test #{idx + 1} ({tr.type}):</span>
                          <span className={tr.verdict === 'ACCEPTED' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                            {tr.verdict} ({tr.execution_time_ms || 0}ms)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500 font-mono text-xs">
              Select a challenge from the problem set to begin coding.
            </div>
          )}
        </div>
      )}

      {/* 3. CTF CHALLENGES WORKSPACE */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Challenge List Sidebar */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2 max-h-[750px] overflow-y-auto font-mono text-xs">
            <h3 className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-3">Targets & Exploits</h3>
            {challenges.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No CTF targets assigned to this event.</div>
            ) : (
              challenges.map(c => {
                const isCurrent = selectedChallenge && selectedChallenge.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectCTFChallenge(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{c.title}</span>
                      <span className="text-teal-400 text-xs font-bold">{c.points} pts</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span className="uppercase">{c.category}</span>
                      <span>•</span>
                      <span>{c.difficulty}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* CTF Dossier & Flag Submitter */}
          {selectedChallenge ? (
            <div className="lg:col-span-8 space-y-5">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                      TARGET // {selectedChallenge.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{selectedChallenge.title}</h3>
                  </div>
                  <span className="text-sm font-bold text-teal-400">{selectedChallenge.points} PTS</span>
                </div>

                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedChallenge.description}
                </div>

                {/* Live Docker Lab Controller if enabled */}
                {selectedChallenge.has_docker_lab && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        <span>INTERACTIVE CONTAINER LAB</span>
                      </span>
                      {labInstance ? (
                        <button
                          type="button"
                          onClick={handleStopLab}
                          className="px-3 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 text-[10px]"
                        >
                          Stop Lab Instance
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={labLoading}
                          onClick={handleLaunchLab}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs"
                        >
                          {labLoading ? 'Spawning Container...' : 'Spawn Interactive Lab'}
                        </button>
                      )}
                    </div>
                    {labInstance && (
                      <div className="text-[11px] text-slate-300 space-y-1">
                        <div>Host: <span className="text-cyan-400">{labInstance.access_host}</span></div>
                        <div>Assigned Port: <span className="text-cyan-400 font-bold">{labInstance.access_port}</span></div>
                        <div>Remaining: <span className="text-amber-400">{labInstance.remaining_seconds}s</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Flag Submission Bar */}
                <form onSubmit={handleSubmitFlag} className="pt-2">
                  <label className="block text-slate-400 text-xs mb-1 font-bold">SUBMIT CAPTURED FLAG</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder="flag{...}"
                      value={flagInput}
                      onChange={(e) => setFlagInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={flagSubmitting}
                      className="px-5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs font-mono disabled:opacity-50"
                    >
                      {flagSubmitting ? 'Verifying...' : 'Submit Flag'}
                    </button>
                  </div>
                </form>

                {flagResult && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    flagResult.success ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}>
                    {flagResult.message || (flagResult.success ? 'Flag Accepted!' : 'Incorrect flag.')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500 font-mono text-xs">
              Select a target from the mission set to inspect dossier.
            </div>
          )}
        </div>
      )}

      {/* 4. MCQ QUIZZES WORKSPACE */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2 max-h-[750px] overflow-y-auto font-mono text-xs">
            <h3 className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-3">Quiz Questions</h3>
            {mcqs.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMcq(m);
                  setSelectedOptions([]);
                  setMcqResult(null);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedMcq && selectedMcq.id === m.id
                    ? 'bg-cyan-950/40 border-cyan-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">#{idx + 1} {m.title}</span>
                  <span className="text-emerald-400 font-bold">+{m.points_positive}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedMcq ? (
            <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">{selectedMcq.title}</h3>
                <span className="text-emerald-400 font-bold">+{selectedMcq.points_positive} / -{selectedMcq.points_negative} pts</span>
              </div>

              <div className="text-slate-200 text-sm font-sans leading-relaxed">
                {selectedMcq.prompt}
              </div>

              <div className="space-y-2 pt-2">
                {selectedMcq.options && selectedMcq.options.map(opt => {
                  const isChecked = selectedOptions.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (selectedMcq.question_type === 'single_choice') {
                          setSelectedOptions([opt.id]);
                        } else {
                          if (isChecked) setSelectedOptions(selectedOptions.filter(id => id !== opt.id));
                          else setSelectedOptions([...selectedOptions, opt.id]);
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                        isChecked ? 'bg-cyan-950/40 border-cyan-400 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type={selectedMcq.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-cyan-500"
                      />
                      <span className="text-xs">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={mcqSubmitting || selectedOptions.length === 0}
                onClick={handleSubmitMcq}
                className="px-5 py-2.5 rounded-xl font-bold font-mono text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40"
              >
                {mcqSubmitting ? 'Verifying Attempt...' : 'Record Quiz Answer'}
              </button>

              {mcqResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  mcqResult.is_correct ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
                }`}>
                  <div className="font-bold">{mcqResult.is_correct ? 'CORRECT ANSWER!' : 'INCORRECT ANSWER'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Score Awarded: {mcqResult.score_awarded} pts</div>
                  {mcqResult.explanation && (
                    <div className="mt-2 text-slate-300 font-sans">{mcqResult.explanation}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-8 flex items-center justify-center p-12 text-slate-500 font-mono text-xs">
              Select a quiz item to begin.
            </div>
          )}
        </div>
      )}

      {/* 5. LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>EVENT SCOREBOARD // {leaderboard?.mode?.toUpperCase()} RANKINGS</span>
            </h3>
            {leaderboard?.is_frozen && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase font-bold">
                RANKINGS FROZEN
              </span>
            )}
          </div>

          {!leaderboard || !leaderboard.standings || leaderboard.standings.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No solves recorded on scoreboard yet. Be the first to capture points!
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3 w-12">Rank</th>
                  <th className="p-3">Operative / Squad</th>
                  <th className="p-3">Solves</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.standings.map(s => (
                  <tr key={s.rank} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-cyan-400">#{s.rank}</td>
                    <td className="p-3 text-white font-bold">{s.team_name || s.username}</td>
                    <td className="p-3 text-slate-300">{s.solved_count} solves</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{s.points} PTS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 6. SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>YOUR EVENT SUBMISSION AUDIT LOG</span>
            </h3>
            <button
              onClick={() => {
                eventService.getEventSubmissions(targetEventId)
                  .then(data => setUserSubmissions(data || []))
                  .catch(() => {});
              }}
              className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Log</span>
            </button>
          </div>

          {userSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No submissions recorded yet for this event tournament.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Problem / Target</th>
                    <th className="p-3">Language</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3">Execution</th>
                    <th className="p-3">Points</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {userSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/30">
                      <td className="p-3 text-slate-400">#{sub.id}</td>
                      <td className="p-3 text-white font-medium">{sub.question_title}</td>
                      <td className="p-3 text-cyan-400 uppercase font-mono">{sub.language}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          sub.verdict === 'WRONG_ANSWER' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {sub.execution_time_ms ? `${sub.execution_time_ms}ms` : '—'}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">
                        +{sub.points_awarded || 0}
                      </td>
                      <td className="p-3 text-slate-400">
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

      {/* 7. RULES TAB */}
      {activeTab === 'rules' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6 font-mono text-xs max-w-4xl">
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>RULES OF ENGAGEMENT // TOURNAMENT PROTOCOL</span>
            </h3>
            <p className="text-slate-400 text-xs font-sans leading-relaxed">
              All participants are required to conduct themselves in accordance with tournament policies, ethical security practices, and responsible disclosure.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="font-bold text-cyan-400 uppercase mb-1">1. Anti-Cheat & Clipboard Restraints</h4>
              <p className="text-slate-300 font-sans text-xs">
                Policy Active: <span className="font-mono text-white font-bold uppercase">{event.clipboard_policy}</span>. 
                External assistance, code sharing between competing squads, and unauthorized automation are strictly audited.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="font-bold text-emerald-400 uppercase mb-1">2. Sandboxed Target Boundaries</h4>
              <p className="text-slate-300 font-sans text-xs">
                Do not attempt Denial-of-Service (DoS) attacks against competition infrastructure, scoring servers, or peer participants. All attacks must be targeted exclusively at assigned lab instances.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="font-bold text-amber-400 uppercase mb-1">3. Scoring & Tie-Breakers</h4>
              <p className="text-slate-300 font-sans text-xs">
                Scoring Policy: <span className="font-mono text-white font-bold uppercase">{event.scoring_policy}</span>. 
                In the event of score parity, rankings are determined by submission timestamps (first to capture points ranks higher).
              </p>
            </div>

            {event.rules && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-slate-200 uppercase mb-1">Event-Specific Directives</h4>
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
