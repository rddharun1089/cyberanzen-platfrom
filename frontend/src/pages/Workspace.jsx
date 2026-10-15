import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, Send, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertTriangle, Key, Terminal, Code2, Lock, Unlock, ShieldAlert, FileText 
} from 'lucide-react';
import { authService, caseService, submissionService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function Workspace() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python3');
  const [sourceCode, setSourceCode] = useState('');
  
  // Execution & Verdict states
  const [isRunningSample, setIsRunningSample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [unlockedToken, setUnlockedToken] = useState(null);
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'results'

  // Strict Anti-Cheat & Clipboard Restriction State
  const currentUser = authService.getCurrentUser();
  const isCopyPasteAllowed = Boolean(caseData?.allow_copy_paste || currentUser?.role === 'admin');
  const [clipboardWarning, setClipboardWarning] = useState('');
  const [mobileView, setMobileView] = useState('dossier'); // 'dossier' | 'editor'

  // Global Keyboard & Clipboard Event Interceptor (Captures Ctrl+Shift+C, Ctrl+V, Shift+Insert, Extensions)
  useEffect(() => {
    if (isCopyPasteAllowed) return;

    const triggerWarning = () => {
      setClipboardWarning('⚠️ STRICT COMPLIANCE: Copying & pasting code (including Ctrl+Shift+C / Ctrl+V / extensions) is restricted by administrator for this challenge.');
      setTimeout(() => setClipboardWarning(''), 4500);
    };

    const handleKeyDownCapture = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      // Block Ctrl/Cmd + V, C, X
      // Block Ctrl/Cmd + Shift + C, V
      // Block Shift + Insert, Ctrl + Insert
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

    // Attach capture listeners on window to stop browser shortcuts and extensions
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
  }, [isCopyPasteAllowed]);

  // Monaco Editor Specific Mount Interceptor
  const handleEditorMount = (editor, monaco) => {
    if (!isCopyPasteAllowed) {
      const showWarning = () => {
        setClipboardWarning('⚠️ STRICT COMPLIANCE: Copying & pasting code (including Ctrl+Shift+C / Ctrl+V / extensions) is restricted by administrator for this challenge.');
        setTimeout(() => setClipboardWarning(''), 4500);
      };

      // Unbind Monaco Internal Commands
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, showWarning);
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Insert, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, showWarning);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV, showWarning);

      // DOM event listener directly on Monaco's DOM element
      const editorDom = editor.getDomNode();
      if (editorDom) {
        editorDom.addEventListener('paste', (e) => { e.preventDefault(); e.stopPropagation(); showWarning(); }, true);
        editorDom.addEventListener('copy', (e) => { e.preventDefault(); e.stopPropagation(); showWarning(); }, true);
        editorDom.addEventListener('cut', (e) => { e.preventDefault(); e.stopPropagation(); showWarning(); }, true);
        editorDom.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); showWarning(); }, true);
        editorDom.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); showWarning(); }, true);
      }
    }
  };

  useEffect(() => {
    async function loadCase() {
      setLoading(true);
      setExecutionResult(null);
      setUnlockedToken(null);
      try {
        const data = await caseService.getCaseDetail(caseId);
        setCaseData(data);
        // Load starter code for selected language
        const starter = data.starter_code?.[language] || '';
        setSourceCode(starter);
      } catch (err) {
        console.error('Failed to load case detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [caseId]);

  // Update editor content when language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (caseData?.starter_code?.[newLang]) {
      setSourceCode(caseData.starter_code[newLang]);
    }
  };

  const handleResetStarter = () => {
    if (caseData?.starter_code?.[language]) {
      setSourceCode(caseData.starter_code[language]);
    }
  };

  // Run Sample Tests
  const handleRunSample = async () => {
    if (!sourceCode.trim()) return;
    setIsRunningSample(true);
    setActiveTab('results');
    try {
      const res = await submissionService.runSample(caseId, language, sourceCode);
      setExecutionResult({
        ...res,
        type: 'sample'
      });
    } catch (err) {
      setExecutionResult({
        verdict: 'RUNTIME_ERROR',
        compile_log: err.response?.data?.detail || err.message,
        test_results: []
      });
    } finally {
      setIsRunningSample(false);
    }
  };

  // Submit Final Solution
  const handleSubmitSolution = async () => {
    if (!sourceCode.trim()) return;
    setIsSubmitting(true);
    setActiveTab('results');
    try {
      const res = await submissionService.submitSolution(caseId, language, sourceCode);
      setExecutionResult({
        ...res,
        type: 'submission'
      });
      if (res.unlocked_token) {
        setUnlockedToken(res.unlocked_token);
      }
    } catch (err) {
      setExecutionResult({
        verdict: 'RUNTIME_ERROR',
        compile_log: err.response?.data?.detail || err.message,
        test_results: []
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case navigation (previous and next)
  const currentNum = caseData?.number || 1;
  const prevCaseId = currentNum > 1 ? `CASE-${String(currentNum - 1).padStart(2, '0')}` : null;
  const nextCaseId = currentNum < 80 ? `CASE-${String(currentNum + 1).padStart(2, '0')}` : null;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        LOADING CASE DOSSIER {caseId}...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center font-mono text-slate-400">
        <p className="mb-4">Case file not found.</p>
        <Link to="/archive" className="text-cyan-400 underline text-xs">Return to Investigation Archive</Link>
      </div>
    );
  }

  const monacoLanguage = language === 'python3' ? 'python' : (language === 'cpp' ? 'cpp' : 'c');

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-forensic-950">
      
      {/* Top Workspace Header */}
      <div className="h-12 border-b border-forensic-800 bg-forensic-900 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link to="/archive" className="text-slate-400 hover:text-slate-200 text-xs font-mono flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Archive
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-xs font-bold text-forensic-cyan">{caseData.id}</span>
          <span className="text-xs font-bold text-white hidden sm:inline">{caseData.title}</span>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
            {caseData.points} PTS
          </span>
        </div>

        {/* Previous / Next Case buttons */}
        <div className="flex items-center space-x-2">
          {prevCaseId && (
            <button
              onClick={() => navigate(`/cases/${prevCaseId}`)}
              className="px-2 py-1 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>
          )}
          {nextCaseId && (
            <button
              onClick={() => navigate(`/cases/${nextCaseId}`)}
              className="px-2 py-1 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Tablet View Switcher */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-forensic-950 border-b border-forensic-800 flex-shrink-0">
        <div className="flex rounded-lg bg-forensic-900 p-1 border border-forensic-800 w-full max-w-sm">
          <button
            onClick={() => setMobileView('dossier')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition ${
              mobileView === 'dossier'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Problem Dossier</span>
          </button>
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition ${
              mobileView === 'editor'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Compiler Terminal</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Problem Dossier & Narrative */}
        <div className={`w-full lg:w-1/2 border-r border-forensic-800 flex flex-col bg-forensic-900/40 overflow-hidden ${
          mobileView === 'dossier' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Dossier Tabs */}
          <div className="h-10 border-b border-forensic-800 bg-forensic-900 px-4 flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`text-xs font-mono uppercase tracking-wider h-full flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'dossier'
                  ? 'border-cyan-400 text-cyan-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Case Dossier
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`text-xs font-mono uppercase tracking-wider h-full flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'results'
                  ? 'border-cyan-400 text-cyan-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Verdict & Execution {executionResult && `(${executionResult.verdict})`}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
            {activeTab === 'dossier' ? (
              <>
                {/* Unlocked Token Banner if already unlocked */}
                {unlockedToken && (
                  <div className="p-4 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-xs font-mono uppercase text-emerald-300 font-bold block">Evidence Token Recovered</span>
                        <code className="text-xs font-mono text-emerald-400">{unlockedToken}</code>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                )}

                {/* Narrative Section */}
                <section className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-forensic-cyan">Technical Domain: {caseData.domain}</span>
                  <h2 className="text-xl font-bold text-white">{caseData.title}</h2>
                  <div className="p-4 rounded-lg bg-forensic-900 border border-forensic-800 text-slate-300 leading-relaxed font-sans text-sm whitespace-pre-line">
                    {caseData.story}
                  </div>
                </section>

                {/* Objective */}
                <section className="space-y-2">
                  <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Investigator Objective</h3>
                  <div className="p-3 rounded bg-forensic-950 border border-forensic-800 text-slate-200 font-mono text-xs">
                    {caseData.objective}
                  </div>
                </section>

                {/* Input & Output Contracts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <section className="space-y-1">
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Input Contract</h3>
                    <div className="p-3 rounded bg-forensic-950 border border-forensic-800 text-slate-300 font-mono text-xs whitespace-pre-line">
                      {caseData.input_contract}
                    </div>
                  </section>
                  <section className="space-y-1">
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Required Result</h3>
                    <div className="p-3 rounded bg-forensic-950 border border-forensic-800 text-slate-300 font-mono text-xs whitespace-pre-line">
                      {caseData.required_result}
                    </div>
                  </section>
                </div>

                {/* Constraints */}
                {caseData.constraints && (
                  <section className="space-y-1">
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Constraints</h3>
                    <p className="text-xs text-slate-400 font-mono">{caseData.constraints}</p>
                  </section>
                )}

                {/* Public Sample Tests */}
                {caseData.sample_tests && caseData.sample_tests.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">Public Sample Evidence Tests</h3>
                    {caseData.sample_tests.map((s, idx) => (
                      <div key={s.id} className="rounded-lg bg-forensic-950 border border-forensic-800 overflow-hidden text-xs font-mono">
                        <div className="bg-forensic-900 px-3 py-1.5 border-b border-forensic-800 text-slate-400 flex justify-between">
                          <span>Sample Test #{idx + 1}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-forensic-800 p-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">Standard Input (stdin)</span>
                            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">{s.input || "(empty)"}</pre>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">Expected Output (stdout)</span>
                            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{s.output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>
                )}
              </>
            ) : (
              /* Verdict / Results Tab */
              <div className="space-y-4">
                {!executionResult ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No execution results yet. Click "Run Sample Tests" or "Submit Solution".
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg bg-forensic-900 border border-forensic-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Execution Verdict</span>
                        <div className="mt-1">
                          <VerdictBadge verdict={executionResult.verdict} />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Performance</span>
                        <span className="text-xs font-mono text-slate-200">
                          {executionResult.execution_time_ms || 0} ms
                        </span>
                      </div>
                    </div>

                    {/* Unlocked Token Notification */}
                    {unlockedToken && (
                      <div className="p-4 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-xs space-y-1">
                        <div className="font-bold flex items-center gap-2">
                          <Key className="w-4 h-4 text-emerald-400" />
                          CASE RESOLVED — EVIDENCE TOKEN UNLOCKED
                        </div>
                        <div className="p-2 bg-emerald-900/60 rounded text-emerald-200 font-bold">
                          {unlockedToken}
                        </div>
                        <p className="text-[11px] text-emerald-400">
                          This token has been persisted to your clearance vault and will link into Case 80!
                        </p>
                      </div>
                    )}

                    {/* Compilation Errors */}
                    {executionResult.compile_log && (
                      <div className="space-y-1">
                        <span className="text-xs font-mono uppercase text-amber-400 font-bold">Diagnostics & Compiler Output</span>
                        <pre className="p-3 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {executionResult.compile_log}
                        </pre>
                      </div>
                    )}

                    {/* Detailed Test Results */}
                    {executionResult.test_results && executionResult.test_results.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-mono uppercase text-slate-400 font-bold">Test Case Evaluations</span>
                        {executionResult.test_results.map((tr, i) => (
                          <div key={i} className="p-3 rounded bg-forensic-950 border border-forensic-800 space-y-2 text-xs font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 font-semibold">{tr.id} ({tr.type})</span>
                              <span className={tr.verdict === 'ACCEPTED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                {tr.verdict}
                              </span>
                            </div>

                            {/* Show inputs/outputs for sample tests */}
                            {tr.input && (
                              <div className="text-[11px] space-y-1 text-slate-400">
                                <div><span className="text-slate-500">Input:</span> {tr.input.trim()}</div>
                                <div><span className="text-slate-500">Expected:</span> {tr.expected_output?.trim()}</div>
                                <div><span className="text-slate-500">Actual:</span> <span className={tr.verdict === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}>{tr.actual_output?.trim()}</span></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Execution HUD */}
        <div className={`w-full lg:w-1/2 flex flex-col bg-forensic-950 overflow-hidden ${
          mobileView === 'editor' ? 'flex' : 'hidden lg:flex'
        }`}>
          
          {/* Editor Header Toolbar */}
          <div className="h-10 border-b border-forensic-800 bg-forensic-900 px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-mono uppercase text-slate-400">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-2.5 py-1 bg-forensic-950 border border-forensic-800 rounded text-xs text-forensic-cyan font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="python3">Python 3.14</option>
                <option value="cpp">C++17 (g++)</option>
                <option value="c">C11 (gcc)</option>
              </select>

              {/* Clipboard Anti-Cheat Security Status Badge */}
              {isCopyPasteAllowed ? (
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-600 flex items-center gap-1 font-semibold"
                  title="Administrator clearance: Copy/Paste is allowed"
                >
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  Clipboard: Allowed
                </span>
              ) : (
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/90 text-red-300 border border-red-500 flex items-center gap-1 font-bold animate-pulse"
                  title="Strict Anti-Cheat Enforced: Copy/Paste shortcuts (Ctrl+C, Ctrl+V, Ctrl+Shift+C) and extensions are blocked by administrator"
                >
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  Clipboard: Locked (Anti-Cheat)
                </span>
              )}
            </div>

            <button
              onClick={handleResetStarter}
              title="Reset code to starter template"
              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
            {/* High-Visibility Floating Warning Banner on Copy/Paste Attempt */}
            {clipboardWarning && (
              <div className="absolute top-3 left-4 right-4 z-50 p-3 rounded-lg bg-red-950/95 border-2 border-red-500 text-red-200 font-mono text-xs flex items-center gap-2.5 shadow-2xl animate-bounce">
                <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="font-semibold">{clipboardWarning}</span>
              </div>
            )}

            <Editor
              height="100%"
              language={monacoLanguage}
              theme="vs-dark"
              value={sourceCode}
              onMount={handleEditorMount}
              onChange={(value) => setSourceCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                tabSize: 4,
                contextmenu: isCopyPasteAllowed,
                dragAndDrop: isCopyPasteAllowed
              }}
            />
          </div>

          {/* Bottom Execution Action Toolbar */}
          <div className="h-14 border-t border-forensic-800 bg-forensic-900 px-4 flex items-center justify-between flex-shrink-0">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Isolated Judge Worker Ready</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRunSample}
                disabled={isRunningSample || isSubmitting}
                className="px-4 py-2 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                {isRunningSample ? 'Running Samples...' : 'Run Sample Tests'}
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isRunningSample || isSubmitting}
                className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Evaluating Submission...' : 'Submit Solution'}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
