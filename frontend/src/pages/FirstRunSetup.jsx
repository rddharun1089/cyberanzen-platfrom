import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, User, Building, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export default function FirstRunSetup({ onSetupComplete }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('admin@cyberanzen.io');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('CyberAnzen Arena');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Master Passphrase must contain at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.firstRunSetup(username, email, password, orgName);
      if (onSetupComplete) {
        onSetupComplete(data.user);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initialize Super Administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 border border-cyan-800/60 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white font-mono tracking-wide">
            FIRST-RUN SETUP
          </h2>
          <p className="text-xs text-cyan-400 font-mono mt-1 uppercase tracking-widest">
            Establish Root Super Administrator
          </p>
          <p className="text-xs text-slate-400 mt-2">
            No administrator accounts currently exist. Configure the primary Super Administrator to unlock the Arena.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">Organization Name</label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                placeholder="CyberAnzen Arena"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">Super Admin Callsign</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">Contact Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                placeholder="admin@cyberanzen.io"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase">Root Master Passphrase</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                placeholder="••••••••••••"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Minimum 8 characters with high entropy recommended.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 py-2.5 px-4 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 transition-all duration-200 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Establishing Security Boundary...' : 'Initialize Super Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
