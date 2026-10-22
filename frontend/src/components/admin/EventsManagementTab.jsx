import React, { useState, useEffect } from 'react';
import { 
  Calendar, Trophy, Plus, Users, Shield, Clock, 
  Trash2, CheckCircle2, AlertOctagon, Settings, Layers, Play 
} from 'lucide-react';
import { adminService } from '../../services/api';
import EventWizardModal from './EventWizardModal';

export default function EventsManagementTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [pointsOverrides, setPointsOverrides] = useState({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await adminService.listEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await adminService.updateEventStatus(eventId, newStatus);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update event status.');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to permanently delete this competition event?')) return;
    try {
      await adminService.deleteEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert('Failed to delete event.');
    }
  };

  const openAssignModal = async (ev) => {
    setTargetEvent(ev);
    setSelectedQuestionIds([]);
    setPointsOverrides({});
    try {
      let bank = [];
      if (ev.event_type === 'dsa') {
        bank = await adminService.listDSA();
      } else if (ev.event_type === 'ctf') {
        bank = await adminService.listCTF();
      } else if (ev.event_type === 'mcq') {
        bank = await adminService.listMCQs();
      }
      setBankQuestions(bank);

      // Fetch current assigned
      const detail = await adminService.getEvent(ev.id);
      if (detail.assigned_questions) {
        setSelectedQuestionIds(detail.assigned_questions.map(q => q.id));
        const overrides = {};
        detail.assigned_questions.forEach(q => {
          if (q.points) overrides[q.id] = q.points;
        });
        setPointsOverrides(overrides);
      }
      setAssignModalOpen(true);
    } catch (err) {
      alert('Failed to load bank questions for assignment.');
    }
  };

  const saveAssignments = async () => {
    if (!targetEvent) return;
    try {
      await adminService.assignEventQuestions(targetEvent.id, selectedQuestionIds, pointsOverrides);
      alert('Questions assigned successfully to event!');
      setAssignModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save question assignments.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Wizard Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>EVENT BUILDER & TOURNAMENT ORCHESTRATION</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure algorithmic coding battles, cybersecurity CTFs, and MCQ assessments with custom team policies and scoring.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE EVENT WIZARD</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-cyan-400 animate-pulse">
            Querying Tournament Registry...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            No events scheduled. Click "Create Event Wizard" above to schedule a competition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Title & Type</th>
                  <th className="p-3">Participation</th>
                  <th className="p-3">Challenges</th>
                  <th className="p-3">Operatives / Squads</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        slug: /{ev.slug} • type: <span className="text-cyan-400 uppercase font-bold">{ev.event_type}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-300 capitalize text-xs">
                        {ev.participation_mode}
                      </span>
                      {ev.participation_mode !== 'individual' && (
                        <div className="text-[10px] text-slate-500">Max squad: {ev.team_size_max}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="font-bold text-cyan-400">{ev.question_count}</span> assigned
                    </td>
                    <td className="p-3 text-slate-300 text-[11px]">
                      <span>{ev.registration_count} registered</span>
                      {ev.team_count > 0 && <span className="text-slate-500 ml-1">({ev.team_count} squads)</span>}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        ev.status === 'live' || ev.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
                        ev.status === 'registration_open' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                        ev.status === 'draft' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openAssignModal(ev)}
                        className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 text-[10px]"
                      >
                        Assign Questions
                      </button>

                      {/* Status Transition Quick Actions */}
                      {ev.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'registration_open')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px]"
                        >
                          Open Reg
                        </button>
                      )}
                      {ev.status === 'registration_open' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'live')}
                          className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-[10px]"
                        >
                          Go Live
                        </button>
                      )}
                      {ev.status === 'live' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'ended')}
                          className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 text-[10px]"
                        >
                          End Event
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Wizard Modal */}
      <EventWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onEventCreated={loadEvents}
      />

      {/* Question Assignment Modal */}
      {assignModalOpen && targetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase">ASSIGN CONTENT</span>
              <h4 className="text-base font-bold font-mono text-white">
                Assign Challenges to '{targetEvent.title}'
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Showing available challenges from {targetEvent.event_type.toUpperCase()} Question Bank.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
              {bankQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No {targetEvent.event_type.toUpperCase()} challenges found in bank.
                </div>
              ) : (
                bankQuestions.map(q => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono ${
                        isChecked ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <label className="flex items-center space-x-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                            } else {
                              setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                            }
                          }}
                          className="rounded border-slate-700 text-cyan-500"
                        />
                        <span className="text-white font-bold">{q.title}</span>
                      </label>

                      {isChecked && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400">Pts Override:</span>
                          <input
                            type="number"
                            placeholder={q.points || 100}
                            value={pointsOverrides[q.id] || ''}
                            onChange={(e) => setPointsOverrides({ ...pointsOverrides, [q.id]: parseInt(e.target.value) || undefined })}
                            className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-400 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                {selectedQuestionIds.length} challenges selected
              </span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAssignments}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
