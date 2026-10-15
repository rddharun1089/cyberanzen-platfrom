import React, { useState, useEffect } from 'react';
import { FileCode, Activity, Clock, Cpu, RefreshCw, ChevronRight } from 'lucide-react';
import { submissionService } from '../services/api';
import VerdictBadge from '../components/VerdictBadge';

export default function Submissions() {
  const [subs, setSubs] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubs() {
      try {
        const data = await submissionService.getSubmissions();
        setSubs(data);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSubs();
  }, []);

  const handleSelectSub = async (id) => {
    try {
      const detail = await submissionService.getSubmissionDetail(id);
      setSelectedSub(detail);
    } catch (err) {
      console.error('Failed to load submission detail:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        FETCHING SUBMISSION LOGS...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-forensic-800 pb-5">
        <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
          <FileCode className="w-6 h-6 text-forensic-cyan" />
          INVESTIGATIVE SUBMISSIONS & VERDICTS
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Audit trail of code evaluations executed in the isolated judge worker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Submissions List */}
        <div className="lg:col-span-2 bg-forensic-900 border border-forensic-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-forensic-800 bg-forensic-850 flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-300 font-bold">Recorded Submissions ({subs.length})</span>
          </div>

          {subs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              No submissions recorded yet. Open a case in the archive to begin!
            </div>
          ) : (
            <div className="divide-y divide-forensic-800">
              {subs.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSub(s.id)}
                  className={`p-4 flex items-center justify-between hover:bg-forensic-850 cursor-pointer transition ${
                    selectedSub?.id === s.id ? 'bg-forensic-850 border-l-4 border-cyan-400' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white">{s.case_id}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-forensic-950 text-slate-400 border border-slate-800">
                        {s.language}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">
                      {new Date(s.created_at).toLocaleString()} • {s.execution_time_ms} ms
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <VerdictBadge verdict={s.verdict} />
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Submission Inspector */}
        <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">
            Submission Inspector
          </h2>

          {!selectedSub ? (
            <div className="flex-1 flex items-center justify-center text-center text-slate-500 font-mono text-xs py-12">
              Select a submission from the log to view submitted code and execution details.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded bg-forensic-850 border border-forensic-800">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">{selectedSub.case_id}</span>
                  <span className="text-[10px] font-mono text-slate-400">Score: {selectedSub.score} PTS</span>
                </div>
                <VerdictBadge verdict={selectedSub.verdict} />
              </div>

              {selectedSub.compile_log && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">Compiler Output</span>
                  <pre className="p-2.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedSub.compile_log}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-1">Submitted Source</span>
                <pre className="p-3 rounded bg-forensic-950 border border-forensic-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap">
                  {selectedSub.source_code}
                </pre>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
