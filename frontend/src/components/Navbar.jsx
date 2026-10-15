import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Terminal, Shield, FolderGit2, Trophy, FileCode, Activity, 
  LogOut, Lock, Key, Users, Menu, X, User, CheckCircle2, ChevronRight
} from 'lucide-react';
import { authService } from '../services/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/archive', label: 'Investigation Archive', icon: FolderGit2 },
    { to: '/challenges', label: 'Challenges', icon: Terminal },
    { to: '/team', label: 'Team Workspace', icon: Users },
    { to: '/team-leaderboard', label: 'Team Leaderboard', icon: Trophy },
    { to: '/submissions', label: 'My Submissions', icon: FileCode },
    { to: '/vault', label: 'Evidence Vault', icon: Key },
  ];

  if (user && user.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin Terminal', icon: Lock, isAdmin: true });
  }

  const isLinkActive = (to) => {
    if (to === '/' && location.pathname === '/') return true;
    if (to !== '/' && location.pathname.startsWith(to)) return true;
    return false;
  };

  return (
    <>
      <header className="border-b border-forensic-800 bg-forensic-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand / Logo */}
          <Link to="/" className="flex items-center space-x-3 group min-h-[44px]">
            <div className="p-2 rounded bg-forensic-850 border border-cyan-500/30 text-forensic-cyan group-hover:border-cyan-400 group-hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-wider text-white text-lg flex items-center gap-2">
                ENIG<span className="text-forensic-cyan">MATRIX</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                  80-Cases
                </span>
              </span>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">Forensic Programming Grid</p>
            </div>
          </Link>

          {/* Desktop Navigation items */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition ${
                      active
                        ? item.isAdmin 
                          ? 'bg-red-950/60 text-red-300 border border-red-500/40 shadow-sm shadow-red-950'
                          : 'bg-forensic-800 text-forensic-cyan border border-cyan-500/30 shadow-sm shadow-cyan-950'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-forensic-850'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User stats / Auth action / Mobile Hamburger */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Profile Modal Trigger */}
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-forensic-850 hover:bg-forensic-800 border border-slate-700/80 transition min-h-[44px]"
                  title="View Investigator Profile"
                >
                  <div className="p-1 rounded bg-cyan-950 text-cyan-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-mono text-slate-200 font-bold truncate max-w-[120px]">{user.username}</span>
                    <span className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-amber-400" />
                      {user.points || 0} PTS
                    </span>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Disconnect Clearance"
                  className="p-2.5 rounded-lg bg-forensic-850 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2.5 rounded-lg bg-forensic-850 border border-slate-700 text-slate-300 hover:text-cyan-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-xs font-mono px-3.5 py-2.5 rounded bg-forensic-800 text-slate-200 hover:bg-forensic-700 transition min-h-[44px] flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-mono px-3.5 py-2.5 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition min-h-[44px] flex items-center"
                >
                  Enlist
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && user && (
          <div className="lg:hidden fixed inset-x-0 top-16 bg-forensic-950/95 border-b border-forensic-800 backdrop-blur-xl p-4 shadow-2xl z-50 space-y-2 font-mono">
            <div className="text-[11px] text-slate-400 uppercase px-3 py-1 font-bold">Navigation Matrix</div>
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs uppercase tracking-wider transition min-h-[44px] ${
                      active
                        ? item.isAdmin 
                          ? 'bg-red-950/80 text-red-200 border border-red-600'
                          : 'bg-cyan-950/80 text-cyan-300 border border-cyan-600'
                        : 'text-slate-300 hover:bg-forensic-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-forensic-800 flex items-center justify-between px-2 text-xs">
              <span className="text-slate-400">Clearance: <b className="text-white">{user.username}</b></span>
              <span className="text-amber-400 font-bold">{user.points || 0} PTS</span>
            </div>
          </div>
        )}
      </header>

      {/* Profile Modal */}
      {profileModalOpen && user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-forensic-900 border border-forensic-750 rounded-xl p-6 max-w-md w-full space-y-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-forensic-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-sm uppercase">Investigator Profile Dossier</h3>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-forensic-950 p-3.5 rounded-lg border border-forensic-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Callsign / Handle:</span>
                  <span className="text-white font-bold">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Role / Rank:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    user.role === 'admin' ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Earned Points:</span>
                  <span className="text-amber-400 font-bold text-sm">{user.points || 0} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Access Status:</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CLEARANCE ACTIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link
                  to="/team"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 font-bold text-center transition"
                >
                  Manage Squad
                </Link>
                <Link
                  to="/submissions"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded bg-forensic-850 hover:bg-forensic-800 border border-slate-700 text-slate-200 font-bold text-center transition"
                >
                  Submissions
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
