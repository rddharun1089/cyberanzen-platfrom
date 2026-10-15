import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Shield, Lock, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('lead_investigator');
  const [password, setPassword] = useState('Investigator#2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      onLoginSuccess(data);
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid investigator clearance credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-forensic-900 border border-forensic-800 rounded-xl p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-lg bg-forensic-850 border border-cyan-500/30 text-forensic-cyan mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-wider">
            INVESTIGATOR CLEARANCE
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Authenticate to access the 80 sealed crime investigation cases.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/80 border border-red-500 text-red-300 font-mono text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Callsign / Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-forensic-950 border border-forensic-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Security Passkey</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-forensic-950 border border-forensic-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Lock className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Establish Clearance'}
          </button>
        </form>

        <div className="pt-4 border-t border-forensic-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Need new callsign?</span>
          <Link to="/register" className="text-cyan-400 hover:underline">
            Register Agent Clearance
          </Link>
        </div>
      </div>
    </div>
  );
}
