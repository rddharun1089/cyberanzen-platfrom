import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Cpu } from 'lucide-react';

export default function VerdictBadge({ verdict, className = '' }) {
  switch (verdict) {
    case 'ACCEPTED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ACCEPTED (AC)
        </span>
      );
    case 'WRONG_ANSWER':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-red-950/80 text-red-400 border border-red-600/40 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          WRONG ANSWER (WA)
        </span>
      );
    case 'COMPILE_ERROR':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-600/40 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          COMPILE ERROR (CE)
        </span>
      );
    case 'TIME_LIMIT_EXCEEDED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-purple-950/80 text-purple-400 border border-purple-600/40 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          TIME LIMIT EXCEEDED (TLE)
        </span>
      );
    case 'RUNTIME_ERROR':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-rose-950/80 text-rose-400 border border-rose-600/40 ${className}`}>
          <Cpu className="w-3.5 h-3.5 text-rose-400" />
          RUNTIME ERROR (RE)
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-600/40 animate-pulse ${className}`}>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          JUDGING...
        </span>
      );
  }
}
