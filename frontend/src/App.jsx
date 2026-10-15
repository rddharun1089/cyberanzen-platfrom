import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Archive from './pages/Archive';
import Workspace from './pages/Workspace';
import EvidenceVault from './pages/EvidenceVault';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import TeamWorkspace from './pages/TeamWorkspace';
import TeamLeaderboard from './pages/TeamLeaderboard';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import { authService } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    // If token exists, refresh profile
    const token = localStorage.getItem('enigmatrix_token') || localStorage.getItem('cyberanzen_token');
    if (token) {
      authService.getProfile()
        .then(data => setUser(data))
        .catch(() => {
          authService.logout();
          setUser(null);
        });
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser({
      username: userData.username,
      role: userData.role,
      points: userData.points
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-forensic-950 text-slate-100 flex flex-col font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/challenges" element={<Archive />} />
            <Route path="/cases/:caseId" element={<Workspace />} />
            <Route path="/team" element={user ? <TeamWorkspace user={user} /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/team-leaderboard" element={<Leaderboard />} />
            <Route path="/vault" element={<EvidenceVault />} />
            <Route path="/submissions" element={<Submissions />} />
            
            {/* Protected Admin Route */}
            <Route
              path="/admin"
              element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/login" />}
            />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
