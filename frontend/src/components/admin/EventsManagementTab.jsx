import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Trophy, Plus, Users, Shield, Clock, 
  Trash2, CheckCircle2, AlertOctagon, Settings, Layers, Play,
  Image as ImageIcon, Upload, X, Smartphone, Monitor
} from 'lucide-react';
import { adminService } from '../../services/api';
import EventWizardModal from './EventWizardModal';

export default function EventsManagementTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [pointsOverrides, setPointsOverrides] = useState({});

  // Banner modal state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef(null);

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
      const evType = (ev.event_type || '').toLowerCase();
      const hasDsa = evType.includes('dsa') || ['combined', 'all'].includes(evType);
      const hasCtf = evType.includes('ctf') || ['combined', 'all'].includes(evType);
      const hasMcq = evType.includes('mcq') || ['combined', 'all'].includes(evType);

      let bank = [];
      if (hasDsa) {
        const dsa = await adminService.listDSA();
        bank = bank.concat(dsa.map(q => ({ ...q, domain: 'DSA' })));
      }
      if (hasCtf) {
        const ctf = await adminService.listCTF();
        bank = bank.concat(ctf.map(q => ({ ...q, domain: 'CTF' })));
      }
      if (hasMcq) {
        const mcq = await adminService.listMCQs();
        bank = bank.concat(mcq.map(q => ({ ...q, domain: 'MCQ' })));
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

  const openBannerModal = (ev) => {
    setTargetEvent(ev);
    setBannerFile(null);
    setBannerPreview(ev.banner_url || null);
    setBannerModalOpen(true);
  };

  const handleBannerSelect = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only PNG, JPG, and WebP images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Banner image must be under 10MB.');
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async () => {
    if (!targetEvent || !bannerFile) return;
    setBannerUploading(true);
    try {
      await adminService.uploadEventBanner(targetEvent.id, bannerFile);
      alert('Event banner updated successfully!');
      setBannerModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload event banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!targetEvent) return;
    if (!window.confirm('Remove custom banner for this event? It will fallback to the official CyberAnzen banner.')) return;
    setBannerUploading(true);
    try {
      await adminService.removeEventBanner(targetEvent.id);
      setBannerPreview(null);
      setBannerFile(null);
      alert('Event banner removed.');
      setBannerModalOpen(false);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#F2F7FF]">
      {/* Top Banner & Wizard Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#00CFFF]" />
            <span>EVENT BUILDER &amp; TOURNAMENT ORCHESTRATION</span>
          </h3>
          <p className="text-xs text-[#A9BCD6] mt-1">
            Configure algorithmic coding battles, cybersecurity CTFs, and MCQ assessments with custom banners and team policies.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 bg-gradient-to-r from-[#087FFF] to-[#00CFFF] hover:opacity-95 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE EVENT WIZARD</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#00CFFF] animate-pulse">
            Querying Tournament Registry...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-[#A9BCD6] text-xs font-mono">
            No events scheduled. Click "Create Event Wizard" above to schedule a competition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#08172B] text-[#A9BCD6] font-mono uppercase text-[10px] tracking-wider border-b border-[#18385E]">
                <tr>
                  <th className="p-3">Title &amp; Type</th>
                  <th className="p-3">Participation</th>
                  <th className="p-3">Challenges</th>
                  <th className="p-3">Operatives / Squads</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18385E]/60 font-mono">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-[#102746]/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] text-[#A9BCD6] font-mono">
                        slug: /{ev.slug} • type: <span className="text-[#00CFFF] uppercase font-bold">{ev.event_type}</span>
                        {ev.banner_url && <span className="text-emerald-400 ml-2 font-semibold">• Banner Attached</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-[#F2F7FF] capitalize text-xs">
                        {ev.participation_mode}
                      </span>
                      {ev.participation_mode !== 'individual' && (
                        <div className="text-[10px] text-[#A9BCD6]">Max squad: {ev.team_size_max}</div>
                      )}
                    </td>
                    <td className="p-3 text-[#F2F7FF]">
                      <span className="font-bold text-[#00CFFF]">{ev.question_count}</span> assigned
                    </td>
                    <td className="p-3 text-[#F2F7FF] text-[11px]">
                      <span>{ev.registration_count} registered</span>
                      {ev.team_count > 0 && <span className="text-[#A9BCD6] ml-1">({ev.team_count} squads)</span>}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        ev.status === 'live' || ev.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
                        ev.status === 'registration_open' ? 'bg-[#087FFF]/20 text-[#00CFFF] border border-[#087FFF]/50' :
                        ev.status === 'draft' ? 'bg-[#102746] text-[#A9BCD6]' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openBannerModal(ev)}
                        className="px-2.5 py-1 rounded bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] border border-[#18385E] text-[10px] inline-flex items-center space-x-1"
                        title="Manage Event Banner"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Banner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAssignModal(ev)}
                        className="px-2.5 py-1 rounded bg-[#08172B] hover:bg-[#102746] text-[#00CFFF] border border-[#18385E] text-[10px]"
                      >
                        Assign Challenges
                      </button>

                      {/* Status Transition Quick Actions */}
                      {ev.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ev.id, 'registration_open')}
                          className="px-2 py-1 rounded bg-[#102746] hover:bg-[#18385E] text-slate-200 text-[10px]"
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
                        className="p-1 rounded text-[#A9BCD6] hover:text-rose-400 hover:bg-rose-950/40"
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

      {/* Banner Upload / Manage Modal */}
      {bannerModalOpen && targetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-[#F2F7FF]">
            <div className="flex items-center justify-between border-b border-[#18385E] pb-3">
              <div>
                <span className="text-xs font-mono text-[#00CFFF] uppercase">BANNER BRANDING</span>
                <h4 className="text-base font-bold font-mono text-white">
                  {targetEvent.title}
                </h4>
              </div>
              <button onClick={() => setBannerModalOpen(false)} className="p-1 rounded text-[#A9BCD6] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#A9BCD6]">Current / New Banner Preview:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#102746] text-[#A9BCD6] hover:text-white flex items-center space-x-1 border border-[#18385E]"
                  >
                    {previewMode === 'desktop' ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    <span>{previewMode === 'desktop' ? 'Desktop' : 'Mobile'}</span>
                  </button>
                </div>
              </div>

              {bannerPreview ? (
                <div className={`overflow-hidden rounded-xl border border-[#18385E] bg-[#061329] relative transition-all ${previewMode === 'desktop' ? 'h-36 w-full' : 'h-44 max-w-xs mx-auto'}`}>
                  <img src={bannerPreview} alt="Event Banner" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-[#00CFFF]">
                    Preview ({previewMode})
                  </div>
                </div>
              ) : (
                <div className="h-32 rounded-xl border-2 border-dashed border-[#18385E] flex flex-col items-center justify-center text-center p-4 bg-[#061329]">
                  <ImageIcon className="w-8 h-8 text-[#A9BCD6] opacity-60 mb-2" />
                  <span className="text-xs text-[#A9BCD6] font-mono">No custom banner attached.</span>
                  <span className="text-[10px] text-slate-500 font-mono">Defaults to official CyberAnzen arena theme.</span>
                </div>
              )}
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => bannerInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files?.[0]) handleBannerSelect(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-[#18385E] hover:border-[#00CFFF] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#08172B]"
            >
              <Upload className="w-6 h-6 text-[#00CFFF] mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-mono text-[#F2F7FF] font-semibold">
                Click or drag image to replace banner
              </p>
              <p className="text-[10px] text-[#A9BCD6] font-mono mt-0.5">
                PNG, JPG, or WebP up to 10MB
              </p>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleBannerSelect(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#18385E]">
              {targetEvent.banner_url && (
                <button
                  type="button"
                  disabled={bannerUploading}
                  onClick={handleRemoveBanner}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800"
                >
                  Remove Banner
                </button>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono text-[#A9BCD6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bannerFile || bannerUploading}
                  onClick={handleSaveBanner}
                  className="px-5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 disabled:opacity-40 shadow-[0_0_15px_rgba(0,207,255,0.3)]"
                >
                  {bannerUploading ? 'Uploading...' : 'Save Banner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Assignment Modal */}
      {assignModalOpen && targetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0B1D38] border border-[#18385E] w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col text-[#F2F7FF]">
            <div className="border-b border-[#18385E] pb-3">
              <span className="text-xs font-mono text-[#00CFFF] uppercase">ASSIGN CONTENT</span>
              <h4 className="text-base font-bold font-mono text-white">
                Assign Challenges to '{targetEvent.title}'
              </h4>
              <p className="text-xs text-[#A9BCD6] mt-1">
                Showing available challenges for {targetEvent.event_type.toUpperCase()} Paradigm.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-72 pr-1">
              {bankQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A9BCD6] font-mono">
                  No challenges found in bank for {targetEvent.event_type.toUpperCase()}.
                </div>
              ) : (
                bankQuestions.map(q => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={`${q.domain}-${q.id}`}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono transition-colors ${
                        isChecked ? 'bg-[#102746] border-[#00CFFF]' : 'bg-[#061329] border-[#18385E]'
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
                          className="rounded border-[#18385E] text-[#00CFFF]"
                        />
                        <div>
                          <span className="text-white font-bold">{q.title}</span>
                          {q.domain && (
                            <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded font-mono ${
                              q.domain === 'DSA' ? 'bg-[#087FFF]/20 text-[#00CFFF]' :
                              q.domain === 'CTF' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                            }`}>
                              {q.domain}
                            </span>
                          )}
                        </div>
                      </label>

                      {isChecked && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-[#A9BCD6]">Pts Override:</span>
                          <input
                            type="number"
                            placeholder={q.points || 100}
                            value={pointsOverrides[q.id] || ''}
                            onChange={(e) => setPointsOverrides({ ...pointsOverrides, [q.id]: parseInt(e.target.value) || undefined })}
                            className="w-16 px-2 py-1 bg-[#061329] border border-[#18385E] rounded text-[#00CFFF] text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#18385E]">
              <span className="text-xs font-mono text-[#A9BCD6]">
                {selectedQuestionIds.length} challenges selected
              </span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-[#A9BCD6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAssignments}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300"
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
