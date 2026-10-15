import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, Shield, Trophy, UserPlus, Key, Copy, Check, RefreshCw, 
  LogOut, UserMinus, Crown, ArrowRight, AlertTriangle, ShieldCheck, 
  Terminal, Sparkles, FolderGit2
} from 'lucide-react';
import { teamService } from '../services/api';

export default function TeamWorkspace({ user }) {
  const [searchParams] = useSearchParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setSuccessMsg(`Squad "${createName.trim()}" commissioned successfully!`);
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

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to depart from this squad? If you are the squad commander and other members exist, command will transfer automatically.')) {
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
    if (!window.confirm('Rotate invitation token? All previously shared invitation codes and links will be invalidated.')) {
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
    if (!window.confirm(`Discharge operative "${targetUsername}" from the squad?`)) {
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
        INITIALIZING SQUAD TELEMETRY & WORKSPACE MATRIX...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Title & Alerts */}
      <div className="border-b border-forensic-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-forensic-cyan" />
            TEAM OPERATIONS DECK
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Collaborative investigation squad workspace, invitation management, and shared challenge intelligence.
          </p>
        </div>

        <Link
          to="/team-leaderboard"
          className="px-4 py-2 rounded-lg bg-forensic-850 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 font-mono text-xs font-bold transition flex items-center gap-2 w-fit shadow-lg shadow-cyan-950/30"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          View Team Leaderboard
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/80 border border-red-600 text-red-200 font-mono text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-200 font-mono text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STATE 1: User has NO team */}
      {!team ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card A: Create Team */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 shadow-xl space-y-4 font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Commission New Squad</h2>
                <p className="text-xs text-slate-400">Found your own elite unit as Squad Commander.</p>
              </div>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-slate-300 uppercase mb-1.5">Squad Callsign / Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. NIGHTHAWKS, ZERO_DAY_DEFENDERS"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  maxLength={50}
                  required
                  className="w-full px-4 py-2.5 bg-forensic-950 border border-forensic-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-forensic-950 p-3 rounded-lg border border-forensic-800 space-y-1">
                <p className="text-cyan-400 font-bold">• Roster Cap: Maximum 4 Operatives per squad.</p>
                <p>• Challenge points earned by any teammate count toward shared squad score.</p>
                <p>• Points for each problem are credited only once to prevent duplicate scoring.</p>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !createName.trim()}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Commission Squad
              </button>
            </form>
          </div>

          {/* Card B: Join Existing Team */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 shadow-xl space-y-4 font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">Enlist via Invitation Token</h2>
                <p className="text-xs text-slate-400">Enter a cryptographically generated squad invitation code.</p>
              </div>
            </div>

            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-slate-300 uppercase mb-1.5">Invitation Security Token / Code</label>
                <input
                  type="text"
                  placeholder="Paste invitation token received from Commander..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-forensic-950 border border-forensic-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-forensic-950 p-3 rounded-lg border border-forensic-800 space-y-1">
                <p className="text-emerald-400 font-bold">• Strict 1-Squad Rule: Participants may belong to 1 squad.</p>
                <p>• Validates token on server against squad capacity limits.</p>
                <p>• Immediate synchronization of all shared solved cases upon enlistment.</p>
              </div>

              <button
                type="submit"
                disabled={actionLoading || !joinCode.trim()}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Enlist In Squad
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* STATE 2: User is in a team */
        <div className="space-y-6">
          
          {/* Squad Header Banner */}
          <div className="bg-gradient-to-r from-forensic-900 via-forensic-850 to-forensic-900 border border-cyan-500/30 rounded-xl p-6 shadow-2xl font-mono">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-xs uppercase tracking-widest">
                    SQUAD #{team.id}
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-wider">{team.name}</h2>
                  <span className={`px-2.5 py-1 rounded font-bold text-xs flex items-center gap-1 ${
                    team.is_owner ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {team.is_owner ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Users className="w-3.5 h-3.5 text-cyan-400" />}
                    {team.is_owner ? 'SQUAD COMMANDER' : 'OPERATIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Commissioned on {new Date(team.created_at).toLocaleDateString()} • Lead Commander: <span className="text-white font-bold">{team.owner?.username}</span>
                </p>
              </div>

              {/* Quick Telemetry Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-forensic-950/80 border border-forensic-800 p-3.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Squad Score</span>
                  <span className="text-xl font-bold text-amber-400">{team.points}</span>
                  <span className="text-[10px] text-slate-500 block">PTS</span>
                </div>

                <div className="bg-forensic-950/80 border border-forensic-800 p-3.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Cases Solved</span>
                  <span className="text-xl font-bold text-cyan-400">{team.solved_count}</span>
                  <span className="text-[10px] text-slate-500 block">/ 80 Cases</span>
                </div>

                <div className="bg-forensic-950/80 border border-forensic-800 p-3.5 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Operatives</span>
                  <span className="text-xl font-bold text-emerald-400">{team.members?.length || 1}</span>
                  <span className="text-[10px] text-slate-500 block">/ {team.max_members} Max</span>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Squad Credentials & Invitations */}
            <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white uppercase">Invitation Credentials</h3>
                </div>
                <span className="text-[10px] text-slate-400">Roster: {team.members?.length || 1}/{team.max_members}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">Security Token / Invite Code</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={team.invitation_code}
                      className="flex-1 px-3 py-2 bg-forensic-950 border border-forensic-750 rounded text-cyan-300 font-bold text-xs select-all"
                    />
                    <button
                      onClick={copyCodeToClipboard}
                      className="px-3 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 transition flex items-center gap-1"
                      title="Copy invitation code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={copyLinkToClipboard}
                    className="w-full py-2 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Direct Enlistment Link'}</span>
                  </button>

                  {team.is_owner && (
                    <button
                      onClick={handleRotateInvite}
                      disabled={actionLoading}
                      className="w-full py-2 rounded bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600 text-amber-200 font-bold text-xs transition flex items-center justify-center gap-2"
                      title="Invalidate old invite codes and issue a new random token"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rotate Security Token</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-forensic-800 pt-3">
                  <button
                    onClick={handleLeaveTeam}
                    disabled={actionLoading}
                    className="w-full py-2 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-700 text-red-300 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Depart from Squad</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Squad Operatives Roster */}
            <div className="lg:col-span-2 bg-forensic-900 border border-forensic-800 rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white uppercase">Operatives Roster ({team.members?.length} / {team.max_members})</h3>
                </div>
                {team.is_owner && team.members?.length > 1 && (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-forensic-850 hover:bg-forensic-800 border border-cyan-700 text-cyan-300 text-[11px] flex items-center gap-1.5 transition"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Transfer Command
                  </button>
                )}
              </div>

              <div className="divide-y divide-forensic-800">
                {team.members?.map((m) => (
                  <div key={m.user_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        m.role === 'OWNER' ? 'bg-amber-950/80 border-amber-600 text-amber-400' : 'bg-cyan-950/80 border-cyan-800 text-cyan-400'
                      }`}>
                        {m.role === 'OWNER' ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{m.username}</span>
                          {m.is_current_user && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Enlisted on {new Date(m.joined_at).toLocaleDateString()} • Role: <b className={m.role === 'OWNER' ? 'text-amber-400' : 'text-slate-300'}>{m.role}</b>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-forensic-950 border border-forensic-800 text-amber-400 font-bold">
                        {m.points} PTS
                      </span>

                      {team.is_owner && !m.is_current_user && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.username)}
                          disabled={actionLoading}
                          title="Discharge operative"
                          className="p-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 transition"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section 3: Shared Challenge Progress Board */}
          <div className="bg-forensic-900 border border-forensic-800 rounded-xl p-6 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forensic-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-forensic-cyan" />
                  SHARED SQUAD INVESTIGATION LOG
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time record of all forensic cases unlocked and completed by this squad.
                </p>
              </div>

              <Link
                to="/archive"
                className="px-3.5 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-bold transition flex items-center gap-1.5 w-fit"
              >
                <span>Browse All 80 Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {team.solved_cases?.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Terminal className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm">No forensic challenges solved by squad operatives yet.</p>
                <p className="text-xs text-slate-600">Head to the Case Archive and submit solutions to earn shared team points!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-forensic-850 border-b border-forensic-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Case ID</th>
                      <th className="py-2.5 px-3">Title & Domain</th>
                      <th className="py-2.5 px-3 text-center">Points</th>
                      <th className="py-2.5 px-3">Cracked By</th>
                      <th className="py-2.5 px-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forensic-800">
                    {team.solved_cases?.map((sc) => (
                      <tr key={sc.case_id} className="hover:bg-forensic-850/60 transition">
                        <td className="py-3 px-3">
                          <Link to={`/cases/${sc.case_id}`} className="font-bold text-cyan-400 hover:underline">
                            {sc.case_id}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{sc.case_title}</span>
                          <span className="text-[10px] text-slate-500">{sc.domain}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-400">
                          +{sc.points_awarded}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-forensic-950 border border-forensic-800 text-slate-300 font-bold">
                            {sc.solved_by_username}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                          {new Date(sc.solved_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transfer Ownership Modal */}
          {transferModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-forensic-900 border border-forensic-750 rounded-xl p-6 max-w-md w-full space-y-4 font-mono shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400">
                  <Crown className="w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase">Transfer Squad Command</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Select an active operative from your roster to become the new Squad Commander:
                </p>

                <select
                  value={selectedNewOwner}
                  onChange={(e) => setSelectedNewOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-forensic-950 border border-forensic-700 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Select Operative --</option>
                  {team.members?.filter(m => !m.is_current_user).map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.username} ({m.points} pts)
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => setTransferModalOpen(false)}
                    className="px-4 py-2 rounded bg-forensic-800 hover:bg-forensic-750 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransferOwnership}
                    disabled={!selectedNewOwner || actionLoading}
                    className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold text-xs"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
