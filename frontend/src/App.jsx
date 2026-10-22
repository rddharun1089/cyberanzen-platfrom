import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import FirstRunSetup from './pages/FirstRunSetup';
import Dashboard from './pages/Dashboard';
import ChallengeArena from './pages/ChallengeArena';
import CTFWorkspace from './pages/CTFWorkspace';
import DSAWorkspace from './pages/DSAWorkspace';
import MCQWorkspace from './pages/MCQWorkspace';
import EventsHub from './pages/EventsHub';
import EventWorkspace from './pages/EventWorkspace';
import TeamWorkspace from './pages/TeamWorkspace';
import Leaderboard from './pages/Leaderboard';
import AdminStudio from './pages/AdminStudio';
import Login from './pages/Login';
import Register from './pages/Register';
import { authService } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isSetupNeeded, setIsSetupNeeded] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // 1. Check if platform needs first-run Super Admin setup
    authService.getSetupStatus()
      .then(res => {
        setIsSetupNeeded(res.is_setup_needed);
      })
      .catch(() => {})
      .finally(() => setCheckingSetup(false));

    // 2. If token exists, refresh profile
    const token = localStorage.getItem('arena_token') || localStorage.getItem('enigmatrix_token');
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
    setIsSetupNeeded(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-cyan-400">
        Initializing CyberAnzen Arena...
      </div>
    );
  }

  const isAdmin = user && (
    ['super_admin', 'event_admin', 'challenge_author', 'admin'].includes(user.role?.toLowerCase())
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col">
          <Routes>
            {/* First-Run Setup Flow */}
            <Route
              path="/setup"
              element={
                isSetupNeeded ? (
                  <FirstRunSetup onSetupComplete={handleLoginSuccess} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Root Landing or Dashboard */}
            <Route
              path="/"
              element={
                isSetupNeeded ? (
                  <Navigate to="/setup" />
                ) : user ? (
                  <Dashboard user={user} />
                ) : (
                  <Landing />
                )
              }
            />

            <Route path="/landing" element={<Landing />} />
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />

            {/* Challenge Arena & Individual Workspaces */}
            <Route path="/arena" element={<ChallengeArena />} />
            <Route path="/ctf/:identifier" element={<CTFWorkspace />} />
            <Route path="/dsa/:identifier" element={<DSAWorkspace />} />
            <Route path="/mcq/:id" element={<MCQWorkspace />} />

            {/* Competitions / Events */}
            <Route path="/events" element={<EventsHub />} />
            <Route path="/events/:eventId" element={<EventWorkspace user={user} />} />
            <Route path="/events/:eventId/workspace" element={<EventWorkspace user={user} />} />

            {/* Squads & Leaderboards */}
            <Route
              path="/team"
              element={user ? <TeamWorkspace user={user} /> : <Navigate to="/login" />}
            />
            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* Admin Control Center */}
            <Route
              path="/admin"
              element={isAdmin ? <AdminStudio /> : <Navigate to="/login" />}
            />

            {/* Auth Routes */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />

            {/* Legacy Backward Compatibility Fallbacks */}
            <Route path="/challenges" element={<Navigate to="/arena" />} />
            <Route path="/archive" element={<Navigate to="/arena" />} />
            <Route path="/cases/:caseId" element={<Navigate to="/arena?tab=dsa" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
