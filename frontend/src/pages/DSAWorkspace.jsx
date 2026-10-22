import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  Play, Send, RotateCcw, ArrowLeft, CheckCircle2, AlertTriangle, 
  Code2, ShieldAlert, Smartphone, RefreshCw, Terminal
} from 'lucide-react';
import { dsaService, authService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function DSAWorkspace() {
  const { identifier } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python3');
  const [sourceCode, setSourceCode] = useState('');
  const [useTouchEditor, setUseTouchEditor] = useState(false);

  // Execution states
  const [isRunningSample, setIsRunningSample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'results'

  // Anti-Cheat & Clipboard Restriction State (Admins always bypass)
  const currentUser = authService.getCurrentUser();
  const isAdmin = Boolean(currentUser && (
    ['super_admin', 'event_admin', 'challenge_author', 'admin'].includes(currentUser.role?.toLowerCase())
  ));
  const isCopyPasteAllowed = Boolean(question?.allow_copy_paste || isAdmin);
  const [clipboardWarning, setClipboardWarning] = useState('');

  useEffect(() => {
    loadQuestion();
  }, [identifier]);

  // Sync starter code when language changes
  useEffect(() => {
    if (!question) return;
    const starter = question.starter_code?.[language] || '';
    setSourceCode(starter);
  }, [language, question]);

  // Global Keyboard & Clipboard Event Interceptor (Captures Ctrl+Shift+C, Ctrl+V, Shift+Insert, etc.)
  useEffect(() => {
    if (isCopyPasteAllowed) return;

    const triggerWarning = () => {
      setClipboardWarning('⚠️ EXAM SECURITY LOCKDOWN: Copying & pasting code is restricted by administrator for this challenge.');
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
  }, [isCopyPasteAllowed]);

  const loadQuestion = async () => {
    setLoading(true);
    try {
      const data = await dsaService.getQuestionDetail(identifier);
      setQuestion(data);
      setSourceCode(data.starter_code?.python3 || '');
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRunSample = async () => {
    setIsRunningSample(true);
    setActiveTab('results');
    try {
      const res = await dsaService.runSample(identifier, language, sourceCode);
      setExecutionResult(res);
    } catch (err) {
      setExecutionResult({
        verdict: 'INTERNAL_ERROR',
        compile_log: err.response?.data?.detail || 'Failed to run sample.'
      });
    } finally {
      setIsRunningSample(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActiveTab('results');
    try {
      const res = await dsaService.submitSolution(identifier, language, sourceCode);
      setExecutionResult(res);
    } catch (err) {
      setExecutionResult({
        verdict: 'INTERNAL_ERROR',
        compile_log: err.response?.data?.detail || 'Failed to evaluate submission.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-cyan-400 animate-pulse">
        Loading Problem Specification...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-rose-400">
        Question not found in published repository.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            to="/arena?tab=dsa"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white font-mono truncate max-w-xs sm:max-w-md">
              {question.title}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              {question.points} PTS
            </span>
          </div>
        </div>

        {/* Anti-cheat banner warning if triggered */}
        {clipboardWarning && (
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-amber-400 bg-amber-950/60 px-3 py-1 rounded border border-amber-800/80 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{clipboardWarning}</span>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
          >
            <option value="python3">Python 3.14</option>
            <option value="cpp">C++ (g++ 17)</option>
            <option value="c">C (gcc 11)</option>
          </select>

          {/* Toggle Touch Editor */}
          <button
            onClick={() => setUseTouchEditor(!useTouchEditor)}
            title="Toggle Mobile Touchpad Editor"
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
              useTouchEditor
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Run Sample Button */}
          <button
            onClick={handleRunSample}
            disabled={isRunningSample || isSubmitting}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span>{isRunningSample ? 'Running...' : 'Run Samples'}</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isRunningSample}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Statement / Results */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-6 space-y-6">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('statement')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'statement' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Problem Dossier
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'results' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Execution Output {executionResult && `(${executionResult.verdict})`}
            </button>
          </div>

          {activeTab === 'statement' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">Description</h3>
                <div className="text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                  {question.statement}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">Input Specification</h3>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {question.input_spec}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">Output Specification</h3>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                  {question.output_spec}
                </div>
              </div>

              {question.constraints && (
                <div>
                  <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">Constraints</h3>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {question.constraints}
                  </div>
                </div>
              )}

              {/* Sample Testcases */}
              {question.sample_tests && question.sample_tests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider">Public Samples</h3>
                  {question.sample_tests.map((s, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[11px] font-mono text-slate-400 font-bold">Sample #{idx + 1}</span>
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-1">Standard Input</span>
                          <pre className="p-2 rounded bg-slate-900 text-slate-200 overflow-x-auto">{s.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-1">Expected Output</span>
                          <pre className="p-2 rounded bg-slate-900 text-emerald-400 overflow-x-auto">{s.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Execution Output Tab */
            <div className="space-y-4">
              {!executionResult ? (
                <div className="text-xs font-mono text-slate-500 py-12 text-center">
                  Execute "Run Samples" or "Submit Code" to inspect sandbox diagnostics.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Verdict</span>
                      <span className={`text-sm font-mono font-bold ${
                        executionResult.verdict === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {executionResult.verdict}
                      </span>
                    </div>
                    {executionResult.execution_time_ms !== undefined && (
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Runtime</span>
                        <span className="text-xs font-mono text-slate-300">{executionResult.execution_time_ms} ms</span>
                      </div>
                    )}
                  </div>

                  {executionResult.compile_log && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Compiler / Runtime Diagnostic Log</span>
                      <pre className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs font-mono text-rose-300 overflow-x-auto">
                        {executionResult.compile_log}
                      </pre>
                    </div>
                  )}

                  {executionResult.test_results && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Test Case Matrix</span>
                      {executionResult.test_results.map((tr, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
                          <span className="text-slate-400">Test #{idx + 1} ({tr.type})</span>
                          <span className={tr.verdict === 'ACCEPTED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
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
        </div>

        {/* Right Pane: Code Editor */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-950">
          {useTouchEditor ? (
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              className="flex-1 w-full p-4 bg-slate-950 text-cyan-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="// Write your solution here..."
              spellCheck="false"
            />
          ) : (
            <div className="flex-1 w-full h-full">
              <Editor
                height="100%"
                language={language === 'python3' ? 'python' : 'cpp'}
                theme="vs-dark"
                value={sourceCode}
                onChange={(val) => setSourceCode(val || '')}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
