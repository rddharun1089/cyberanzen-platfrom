import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Shield, FolderGit2, Award, FileCode, Activity, LogOut, Lock, Key } from 'lucide-react';
import { authService } from '../services/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/archive', label: 'All Cases (80)', icon: FolderGit2 },
    { to: '/vault', label: 'Evidence Vault', icon: Key },
    { to: '/submissions', label: 'Submissions', icon: FileCode },
    { to: '/leaderboard', label: 'Leaderboard', icon: Award },
  ];

  if (user && user.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin Terminal', icon: Lock });
  }

  return (
    <header className="border-b border-forensic-800 bg-forensic-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded bg-forensic-850 border border-cyan-500/30 text-forensic-cyan group-hover:border-cyan-400 transition">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-white text-lg flex items-center gap-2">
              CYBER<span className="text-forensic-cyan">ANZEN</span>
              <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                80-Cases
              </span>
            </span>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Forensic Programming Grid</p>
          </div>
        </Link>

        {/* Navigation items */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition ${
                    isActive
                      ? 'bg-forensic-800 text-forensic-cyan border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-forensic-850'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User stats / Auth action */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-mono text-slate-200 font-semibold">{user.username}</span>
                <span className="text-[10px] font-mono text-forensic-cyan flex items-center justify-end gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  {user.points || 0} PTS
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Disconnect Clearance"
                className="p-2 rounded bg-forensic-850 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-mono px-3 py-1.5 rounded bg-forensic-800 text-slate-200 hover:bg-forensic-700 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-mono px-3 py-1.5 rounded bg-cyan-600 text-black font-semibold hover:bg-cyan-500 transition"
              >
                Clearance Reg
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
