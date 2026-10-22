import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HelpCircle, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { mcqService } from '../services/api';

export default function MCQWorkspace() {
  const { id } = useParams();
  const [mcq, setMcq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [remainingSec, setRemainingSec] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadMCQ();
  }, [id]);

  useEffect(() => {
    if (!remainingSec || remainingSec <= 0 || result) return;
    const interval = setInterval(() => {
      setRemainingSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSec, result]);

  const loadMCQ = async () => {
    setLoading(true);
    try {
      const data = await mcqService.getMCQDetail(id);
      setMcq(data);
      setRemainingSec(data.time_limit_sec || 60);
    } catch (err) {
      console.error('Failed to load MCQ:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOption = (optId) => {
    if (result) return;
    if (mcq.question_type === 'single_choice') {
      setSelectedIds([optId]);
    } else {
      setSelectedIds(prev => 
        prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0 || isSubmitting || result) return;
    setIsSubmitting(true);
    try {
      const timeTaken = (mcq.time_limit_sec || 60) - remainingSec;
      const res = await mcqService.submitMCQ(mcq.id, selectedIds, timeTaken);
      setResult(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit MCQ response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-cyan-400 animate-pulse">
        Fetching Assessment Vector...
      </div>
    );
  }

  if (!mcq) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 font-mono text-rose-400">
        Assessment item not found.
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/events"
        className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Events</span>
      </Link>

      <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-mono uppercase px-3 py-1 rounded bg-slate-800 text-purple-400 border border-slate-700 font-semibold">
            {mcq.category}
          </span>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 bg-amber-950/40 px-3 py-1 rounded border border-amber-800/60">
            <Clock className="w-3.5 h-3.5" />
            <span>{remainingSec}s Remaining</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono mb-4">
          {mcq.title}
        </h1>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-sans mb-8 leading-relaxed whitespace-pre-wrap">
          {mcq.prompt}
        </div>

        <div className="space-y-3 mb-8">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Select {mcq.question_type === 'single_choice' ? 'the correct answer' : 'all that apply'}:
          </span>
          {mcq.options.map(opt => {
            const isSelected = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => handleToggleOption(opt.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between text-sm font-sans ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <span>{opt.text}</span>
                <span className={`w-4 h-4 rounded-${mcq.question_type === 'single_choice' ? 'full' : 'md'} border flex items-center justify-center text-[10px] ${
                  isSelected ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' : 'border-slate-600'
                }`}>
                  {isSelected && '✓'}
                </span>
              </button>
            );
          })}
        </div>

        {result ? (
          <div className={`p-4 rounded-xl border text-xs font-mono ${
            result.is_correct
              ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1">
              {result.is_correct ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>{result.is_correct ? 'CORRECT ASSESSMENT' : 'INCORRECT'}</span>
            </div>
            <p>Score Awarded: {result.score_awarded} pts</p>
            {result.explanation && (
              <p className="mt-2 pt-2 border-t border-slate-800 text-slate-300 font-sans">
                Explanation: {result.explanation}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all font-mono text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Evaluating...' : 'Confirm Response'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
