import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, Shield, Trophy, UserPlus, Key, Copy, Check, RefreshCw, 
  LogOut, UserMinus, Crown, ArrowRight, AlertTriangle, ShieldCheck, 
  Terminal, Sparkles, FolderGit2, ClipboardCheck, ClipboardPaste, Award
} from 'lucide-react';
import { teamService } from '../services/api';

export default function TeamWorkspace({ user }) {
  const [searchParams] = useSearchParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mode selection when not in team: 'create' | 'join'
  const [formationTab, setFormationTab] = useState(searchParams.get('join') ? 'join' : 'create');

  // Form states
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState(searchParams.get('join') || '');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Transfer ownership modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');

  useEffect(() => {
    loadMyTeam();
  }, []);

  async function loadMyTeam() {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await teamService.getMyTeam();
      setTeam(data.team);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setErrorMsg('Failed to fetch squad telemetry.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await teamService.createTeam(createName.trim());
      setSuccessMsg(`Squad "${createName.trim()}" successfully commissioned!`);
      setCreateName('');
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create squad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await teamService.joinTeam(joinCode.trim());
      setSuccessMsg(res.message || 'Successfully joined squad!');
      setJoinCode('');
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to enlist in squad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setJoinCode(text.trim());
    } catch (err) {
      // Browser clipboard permission denied or unsupported
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Depart from this squad? Command will automatically transfer to the next senior operative if you are Commander.')) {
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await teamService.leaveTeam();
      setSuccessMsg(res.message);
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to depart from squad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateInvite = async () => {
    if (!window.confirm('Rotate invitation token? All previously shared invitation codes will be revoked.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await teamService.rotateInviteCode();
      setSuccessMsg(res.message);
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to rotate code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId, targetUsername) => {
    if (!window.confirm(`Discharge operative "${targetUsername}" from squad?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await teamService.removeMember(targetUserId);
      setSuccessMsg(res.message);
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;
    setActionLoading(true);
    try {
      const res = await teamService.transferOwnership(parseInt(selectedNewOwner, 10));
      setSuccessMsg(res.message);
      setTransferModalOpen(false);
      await loadMyTeam();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to transfer command.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.invitation_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyLinkToClipboard = () => {
    if (!team) return;
    const shareUrl = `${window.location.origin}/team?join=${team.invitation_code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-cyan-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        INITIALIZING SQUAD TELEMETRY MATRIX...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-forensic-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider font-bold">Multi-Agent Unit Operations</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-forensic-cyan" />
            SQUAD OPERATIONS DECK
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Collaborate with up to 4 operatives to pool intelligence, conquer 80 forensic cases, and compete on the global leaderboard.
          </p>
        </div>

        <Link
          to="/leaderboard"
          className="px-4 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition flex items-center gap-2 w-fit shadow-md shadow-amber-950/20"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Global Leaderboard</span>
        </Link>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/90 border border-red-500 text-red-200 font-mono text-xs flex items-center gap-2.5 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-mono text-xs flex items-center gap-2.5 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STATE 1: PARTICIPANT HAS NO ACTIVE SQUAD                             */}
      {/* ==================================================================== */}
      {!team ? (
        <div className="space-y-6">
          
          {/* Tactical Formation Switcher */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-2 max-w-md mx-auto flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFormationTab('create')}
              className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                formationTab === 'create'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Commission New Squad</span>
            </button>
            <button
              onClick={() => setFormationTab('join')}
              className={`flex-1 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                formationTab === 'join'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Enlist via Code</span>
            </button>
          </div>

          {/* Tab 1: Commission Squad Form */}
          {formationTab === 'create' && (
            <div className="max-w-2xl mx-auto bg-forensic-900 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 font-mono">
              <div className="flex items-center gap-3 border-b border-forensic-800 pb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    Found an Elite Investigation Squad
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You will become the Squad Commander and receive an invitation token for 3 teammates.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase text-slate-300 font-bold mb-2">
                    Squad Name / Unit Callsign
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NIGHTHAWKS, ZERO_DAY_CORPS, SHADOW_ROOT"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    maxLength={50}
                    required
                    className="w-full px-4 py-3 bg-forensic-950 border border-forensic-750 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                  {createName && (
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Squad Tag Preview:</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                        {createName.toUpperCase().replace(/\s+/g, '_')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-forensic-950 p-4 rounded-xl border border-forensic-800 space-y-2 text-xs text-slate-300">
                  <span className="font-bold text-cyan-400 uppercase block mb-1">Squad Engagement Rules:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Max Roster: <b>4 Operatives</b> per squad.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Shared Progression: Solutions accepted by any member credit points to the whole team.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>No Double Scoring: Each problem awards points only once per squad.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !createName.trim()}
                  className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>Commission Squad Now</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Enlist via Invitation Code Form */}
          {formationTab === 'join' && (
            <div className="max-w-2xl mx-auto bg-forensic-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 font-mono">
              <div className="flex items-center gap-3 border-b border-forensic-800 pb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    Enlist into Existing Squad
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter the cryptographic invitation token generated by your Squad Commander.
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinTeam} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase text-slate-300 font-bold">
                      Invitation Security Token
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste from Clipboard</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. j7xK29LaQvM89BwZ..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-forensic-950 border border-forensic-750 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 font-mono transition"
                  />
                </div>

                <div className="bg-forensic-950 p-4 rounded-xl border border-forensic-800 space-y-2 text-xs text-slate-300">
                  <span className="font-bold text-emerald-400 uppercase block mb-1">Enlistment Verification:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>1-Squad Policy: A participant can only belong to 1 squad at a time.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Instant Progress Sync: All previous case unlocks from your squad become available immediately.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !joinCode.trim()}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Verify Token & Enlist</span>
                </button>
              </form>
            </div>
          )}

        </div>
      ) : (
        /* ==================================================================== */
        /* STATE 2: PARTICIPANT HAS ACTIVE SQUAD WORKSPACE                      */
        /* ==================================================================== */
        <div className="space-y-6 font-mono">
          
          {/* Executive Squad Banner */}
          <div className="bg-gradient-to-r from-forensic-900 via-forensic-850 to-forensic-900 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-xs">
                    SQUAD #{team.id}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">{team.name}</h2>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 ${
                    team.is_owner ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {team.is_owner ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Users className="w-3.5 h-3.5 text-cyan-400" />}
                    {team.is_owner ? 'SQUAD COMMANDER' : 'OPERATIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Lead Commander: <b className="text-white">{team.owner?.username}</b> • Commissioned: {new Date(team.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* KPI Score Cards */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="bg-forensic-950 p-4 rounded-xl border border-forensic-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Squad Score</span>
                  <span className="text-2xl font-bold text-amber-400">{team.points}</span>
                  <span className="text-[10px] text-slate-500 block">PTS</span>
                </div>

                <div className="bg-forensic-950 p-4 rounded-xl border border-forensic-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Solved Cases</span>
                  <span className="text-2xl font-bold text-emerald-400">{team.solved_count}</span>
                  <span className="text-[10px] text-slate-500 block">/ 80</span>
                </div>

                <div className="bg-forensic-950 p-4 rounded-xl border border-forensic-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Roster</span>
                  <span className="text-2xl font-bold text-cyan-400">{team.members?.length || 1}</span>
                  <span className="text-[10px] text-slate-500 block">/ 4 Max</span>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Operatives Roster & Shared Progress */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Operatives Roster */}
              <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                      Squad Roster ({team.members?.length || 1} / {team.max_members} Operatives)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {team.max_members - (team.members?.length || 1)} open slot(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {team.members?.map((m) => (
                    <div 
                      key={m.user_id}
                      className="p-4 rounded-xl bg-forensic-950 border border-forensic-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{m.username}</span>
                          {m.role === 'OWNER' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              LEAD
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-amber-400">{m.points} PTS</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-forensic-850 pt-2">
                        <span>Joined: {new Date(m.joined_at).toLocaleDateString()}</span>
                        
                        {/* Commander Removal Action */}
                        {team.is_owner && m.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id, m.username)}
                            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                            title="Discharge operative from squad"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Discharge</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team Commander Actions */}
                <div className="pt-3 border-t border-forensic-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {team.is_owner && team.members?.length > 1 && (
                    <button
                      onClick={() => setTransferModalOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Transfer Squad Command</span>
                    </button>
                  )}

                  <button
                    onClick={handleLeaveTeam}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 flex items-center gap-1.5 transition ml-auto"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Depart Squad</span>
                  </button>
                </div>
              </div>

              {/* Shared Solved Cases Intelligence */}
              <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                      Shared Dossier Solves ({team.solved_count} Cases)
                    </h3>
                  </div>
                  <Link to="/archive" className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                    <span>Explore Remaining Dossiers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {team.solved_cases?.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No cases solved yet. Begin solving forensic challenges to pool squad clearance points!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {team.solved_cases?.map((sc) => (
                      <div key={sc.case_id} className="p-3 rounded-lg bg-forensic-950 border border-forensic-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{sc.case_id}</span>
                          <span className="text-[10px] text-slate-400">Solved by: <b className="text-slate-300">{sc.solver_username}</b></span>
                        </div>
                        <span className="text-amber-400 font-bold">+{sc.points_awarded} PTS</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Column 3: Squad Invitation Deck */}
            <div className="space-y-6">
              
              <div className="bg-forensic-900 border border-cyan-500/40 rounded-xl p-6 shadow-xl space-y-4 text-xs">
                <div className="flex items-center gap-2 text-cyan-400 border-b border-forensic-800 pb-3">
                  <Key className="w-4 h-4" />
                  <h3 className="font-bold uppercase tracking-wider">Operative Invitation Token</h3>
                </div>

                <p className="text-slate-400">
                  Share this security token with your teammates to enlist them into your squad (max 4 members).
                </p>

                {/* Token Box */}
                <div className="p-3.5 rounded-xl bg-forensic-950 border border-forensic-750 space-y-2">
                  <span className="text-[10px] uppercase text-slate-500 block">Invitation Code:</span>
                  <div className="font-mono text-sm font-bold text-cyan-300 break-all select-all">
                    {team.invitation_code}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={copyCodeToClipboard}
                    className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-950"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Token Copied to Clipboard!' : 'Copy Invitation Token'}</span>
                  </button>

                  <button
                    onClick={copyLinkToClipboard}
                    className="w-full py-2.5 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-2 transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                    <span>{copiedLink ? 'Direct Link Copied!' : 'Copy Direct Join Link'}</span>
                  </button>
                </div>

                {/* Rotate Token Action for Commander */}
                {team.is_owner && (
                  <div className="pt-3 border-t border-forensic-800">
                    <button
                      onClick={handleRotateInvite}
                      disabled={actionLoading}
                      className="w-full py-2 rounded-lg bg-forensic-950 hover:bg-forensic-850 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition text-[11px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Rotate Security Token (Revoke Old)</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferModalOpen && team && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-forensic-900 border border-forensic-750 rounded-xl p-6 max-w-md w-full space-y-4 font-mono shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 border-b border-forensic-800 pb-3">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm uppercase">Transfer Squad Command</h3>
            </div>
            
            <p className="text-xs text-slate-300">
              Select the operative who will assume command of squad <b className="text-white">{team.name}</b>.
            </p>

            <div>
              <label className="block text-xs text-slate-400 uppercase mb-1">New Commander</label>
              <select
                value={selectedNewOwner}
                onChange={(e) => setSelectedNewOwner(e.target.value)}
                className="w-full px-3 py-2 bg-forensic-950 border border-forensic-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="">Select an operative...</option>
                {team.members?.filter(m => m.user_id !== team.owner?.id).map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.username} ({m.points} PTS)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 rounded bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferOwnership}
                disabled={actionLoading || !selectedNewOwner}
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs"
              >
                Confirm Command Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
