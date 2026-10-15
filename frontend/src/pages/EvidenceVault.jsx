import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, Shield, CheckCircle2, Lock, ArrowRight, Zap, RefreshCw, Cpu, Database, Network } from 'lucide-react';
import { evidenceService } from '../services/api';

export default function EvidenceVault() {
  const [tokens, setTokens] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [convergenceResult, setConvergenceResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConverging, setIsConverging] = useState(false);

  useEffect(() => {
    async function loadVault() {
      try {
        const [tokenList, graph] = await Promise.all([
          evidenceService.getTokens(),
          evidenceService.getEvidenceGraph()
        ]);
        setTokens(tokenList);
        setGraphData(graph);
      } catch (err) {
        console.error('Failed to load vault:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVault();
  }, []);

  const handleConverge = async () => {
    setIsConverging(true);
    try {
      const res = await evidenceService.runFinalConvergence();
      setConvergenceResult(res);
    } catch (err) {
      console.error('Convergence failed:', err);
    } finally {
      setIsConverging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        DECRYPTING EVIDENCE GRAPH...
      </div>
    );
  }

  const tokenMap = new Map();
  tokens.forEach(t => {
    try {
      const num = parseInt(t.case_id.split('-')[1]);
      tokenMap.set(num, t.token_value);
    } catch {}
  });

  const totalTokens = tokenMap.size;
  const readyToConverge = totalTokens >= 79;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-forensic-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-forensic-cyan" />
            EVIDENCE VAULT — CASE 80 CONVERGENCE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Cases 01–79 produce independent evidence tokens. Case 80 converges all 79 tokens into the final cryptographic reconstruction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded bg-forensic-850 border border-slate-700 text-slate-200 text-xs font-mono">
            TOKENS RECOVERED: <span className="text-forensic-cyan font-bold">{totalTokens}</span> / 79
          </span>
          <button
            onClick={handleConverge}
            disabled={isConverging}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-purple-600/30"
          >
            <Zap className="w-4 h-4" />
            {isConverging ? 'Synthesizing...' : 'Reconstruct Master Hash'}
          </button>
        </div>
      </div>

      {/* Case 80 Convergence Result Banner */}
      {convergenceResult && (
        <div className="p-6 rounded-xl bg-purple-950/70 border border-purple-500/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              CASE 80 CONVERGENCE RESULT
            </span>
            <span className="text-xs font-mono text-purple-400">
              {convergenceResult.token_count} / {convergenceResult.total_required} Tokens Ingested
            </span>
          </div>

          <div className="p-4 rounded-lg bg-black/60 border border-purple-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Cryptographic Master Flag (SHA-256 truncated)</span>
              <code className="text-lg font-mono font-bold text-forensic-cyan tracking-wider">
                {convergenceResult.master_flag}
              </code>
            </div>
            <Link
              to="/cases/CASE-80"
              className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto"
            >
              Open Case 80 Workspace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="text-xs font-mono text-slate-400">
            <span className="text-slate-500">Canonical Token Chain: </span>
            <span className="text-slate-300">{convergenceResult.canonical_chain_preview}</span>
          </div>
        </div>
      )}

      {/* 79 Case Evidence Token Grid */}
      <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6">
        <h2 className="text-base font-bold font-mono text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Recovered Token Fragments (01–79)</span>
          <span className="text-xs text-slate-400 font-normal">Click any case to investigate</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {Array.from({ length: 79 }, (_, i) => i + 1).map(num => {
            const hasToken = tokenMap.has(num);
            const tokenVal = tokenMap.get(num);
            const cid = `CASE-${String(num).padStart(2, '0')}`;
            return (
              <Link
                key={num}
                to={`/cases/${cid}`}
                title={hasToken ? `Solved: ${tokenVal}` : `Case ${num} not solved`}
                className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${
                  hasToken
                    ? 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-forensic-950 border-forensic-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400">#{num}</span>
                  {hasToken ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-600" />
                  )}
                </div>
                <span className={`text-[11px] font-mono font-bold truncate ${hasToken ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasToken ? 'RECOVERED' : 'SEALED'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
