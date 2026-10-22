import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Shield, Terminal, Play, Square, RotateCcw, Clock, 
  ExternalLink, Key, CheckCircle2, AlertTriangle, Download, ArrowLeft, Cpu
} from 'lucide-react';
import { ctfService, labService } from '../services/api';

export default function CTFWorkspace() {
  const { identifier } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flagInput, setFlagInput] = useState('');
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  // Docker Lab state
  const [labInstance, setLabInstance] = useState(null);
  const [isLaunchingLab, setIsLaunchingLab] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    loadChallenge();
  }, [identifier]);

  // Countdown timer for active lab
  useEffect(() => {
    if (!remainingSec || remainingSec <= 0) return;
    const timer = setInterval(() => {
      setRemainingSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSec]);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const data = await ctfService.getChallengeDetail(identifier);
      setChallenge(data);
    } catch (err) {
      console.error('Failed to load challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchLab = async () => {
    setIsLaunchingLab(true);
    try {
      const res = await labService.launchLab(challenge.id);
      setLabInstance(res);
      setRemainingSec(res.remaining_seconds || 3600);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start Docker container lab.');
    } finally {
      setIsLaunchingLab(false);
    }
  };

  const handleStopLab = async () => {
    if (!labInstance) return;
    try {
      await labService.stopLab(labInstance.instance_id);
      setLabInstance(null);
      setRemainingSec(0);
    } catch (err) {
      alert('Failed to stop lab.');
    }
  };

  const handleResetLab = async () => {
    if (!labInstance) return;
    setIsLaunchingLab(true);
    try {
      const res = await labService.resetLab(labInstance.instance_id);
      setLabInstance(res);
      setRemainingSec(res.remaining_seconds || 3600);
    } catch (err) {
      alert('Failed to reset lab.');
    } finally {
      setIsLaunchingLab(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagInput.trim()) return;

    setIsSubmittingFlag(true);
    setSubmissionFeedback(null);
    try {
      const res = await ctfService.submitFlag(identifier, flagInput);
      setSubmissionFeedback(res);
    } catch (err) {
      setSubmissionFeedback({
        is_correct: false,
        message: err.response?.data?.detail || 'Failed to submit flag.'
      });
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-cyan-400 animate-pulse">
        Decrypting Mission Dossier...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-rose-400">
        Challenge dossier not found or classified.
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        to="/arena?tab=ctf"
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Arena</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dossier, Files, Lab Controls (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-mono uppercase px-3 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
                {challenge.category}
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {challenge.points} PTS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mb-4">
              {challenge.title}
            </h1>

            {/* Markdown narrative */}
            <div className="prose prose-invert max-w-none text-slate-300 font-sans leading-relaxed text-sm whitespace-pre-wrap">
              {challenge.description}
            </div>

            {/* Challenge Files */}
            {challenge.files && challenge.files.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center space-x-2">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Confidential Artifacts</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {challenge.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      download
                      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors font-mono"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>{file.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Docker Lab Section */}
          {challenge.has_docker_lab && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-800/60 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">
                    DOCKER LAB CONTAINER
                  </h3>
                </div>
                {labInstance && (
                  <span className="px-2.5 py-1 rounded text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ONLINE ({formatTimer(remainingSec)})</span>
                  </span>
                )}
              </div>

              {!labInstance ? (
                <div>
                  <p className="text-xs text-slate-400 mb-4 font-sans">
                    Spin up a private, isolated container instance for this challenge. You will receive a dedicated access URL and dynamic port.
                  </p>
                  <button
                    onClick={handleLaunchLab}
                    disabled={isLaunchingLab}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isLaunchingLab ? 'Provisioning Environment...' : 'Start Instance'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 font-mono">
                  <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Access Target</span>
                      <a
                        href={labInstance.access_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-cyan-400 hover:underline flex items-center space-x-1.5"
                      >
                        <span>{labInstance.access_url}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Port</span>
                      <span className="text-sm text-white font-bold">{labInstance.access_port}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleResetLab}
                      disabled={isLaunchingLab}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>Reset Instance</span>
                    </button>
                    <button
                      onClick={handleStopLab}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 transition-colors"
                    >
                      <Square className="w-3 h-3 text-rose-400 fill-current" />
                      <span>Terminate Lab</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Flag Submission & Hints (1 col) */}
        <div className="space-y-6">
          {/* Flag Submission Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>SUBMIT CAPTURED FLAG</span>
            </h3>

            {submissionFeedback && (
              <div className={`p-4 rounded-xl mb-4 text-xs font-mono border ${
                submissionFeedback.is_correct
                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-700 text-rose-300'
              }`}>
                <div className="flex items-center space-x-2 font-bold mb-1">
                  {submissionFeedback.is_correct ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{submissionFeedback.is_correct ? 'CORRECT FLAG' : 'REJECTED'}</span>
                </div>
                <p>{submissionFeedback.message}</p>
                {submissionFeedback.points_awarded > 0 && (
                  <span className="block mt-1 font-bold text-cyan-400">
                    +{submissionFeedback.points_awarded} Points Claimed!
                  </span>
                )}
              </div>
            )}

            <form onSubmit={handleFlagSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="FLAG{...}"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingFlag || !flagInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {isSubmittingFlag ? 'Verifying Cipher...' : 'Authenticate Flag'}
              </button>
            </form>
          </div>

          {/* Hints Section */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">
                Decryption Hints
              </h4>
              <div className="space-y-2">
                {challenge.hints.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span>Hint #{idx + 1}</span>
                      <span className="text-amber-400">{h.cost > 0 ? `-${h.cost} pts` : 'Free'}</span>
                    </div>
                    <p className="text-slate-300 font-sans">{h.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
