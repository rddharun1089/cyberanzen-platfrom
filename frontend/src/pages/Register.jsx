import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Terminal, Shield, UserPlus } from 'lucide-react';
import { authService } from '../services/api';

export default function Register({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.register(username, email, password);
      onLoginSuccess(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-forensic-900 border border-forensic-800 rounded-xl p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-lg bg-forensic-850 border border-cyan-500/30 text-forensic-cyan mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-wider">
            ENROLL INVESTIGATOR
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Create an agent profile to begin tracking solved crime cases and points.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/80 border border-red-500 text-red-300 font-mono text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Agent Callsign</label>
            <input
              type="text"
              required
              placeholder="e.g. investigator_007"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-forensic-950 border border-forensic-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Secure Email</label>
            <input
              type="email"
              required
              placeholder="agent@consortium.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-forensic-950 border border-forensic-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Master Passkey</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
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
            <Shield className="w-4 h-4" />
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div className="pt-4 border-t border-forensic-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Already registered?</span>
          <Link to="/login" className="text-cyan-400 hover:underline">
            Authenticate Callsign
          </Link>
        </div>
      </div>
    </div>
  );
}
