import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Terminal, Trophy, Users, Calendar, 
  Settings, LogOut, LogIn, UserPlus, Sparkles, Code2, AlertOctagon
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/landing');
  };

  const isAdmin = user && (
    ['super_admin', 'event_admin', 'challenge_author', 'admin'].includes(user.role?.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300">
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">
                CYBER<span className="text-cyan-400">ANZEN</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wider">
                ARENA
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              Cybersecurity & Code
            </span>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link
            to="/arena"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors"
          >
            <Terminal className="w-4 h-4 text-cyan-400/80" />
            <span>Challenge Arena</span>
          </Link>

          <Link
            to="/events"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors"
          >
            <Calendar className="w-4 h-4 text-cyan-400/80" />
            <span>Competitions</span>
          </Link>

          <Link
            to="/team"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors"
          >
            <Users className="w-4 h-4 text-cyan-400/80" />
            <span>Squads</span>
          </Link>

          <Link
            to="/leaderboard"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400/80" />
            <span>Leaderboards</span>
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 hover:border-cyan-500/60 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Settings className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span>Admin Studio</span>
            </Link>
          )}
        </nav>

        {/* User Clearance / Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors group"
              >
                <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-medium">
                    {user.points || 0} pts
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogoutClick}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enlist</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
