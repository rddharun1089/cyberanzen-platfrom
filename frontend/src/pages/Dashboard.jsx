import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Terminal, Trophy, Users, Award, 
  ArrowRight, Code2, Cpu, CheckCircle2, AlertOctagon,
  Calendar, Clock, Flame, Play, ChevronRight, Lock, Radio
} from 'lucide-react';
import { authService, teamService, leaderboardService, eventService } from '../services/api';

export default function Dashboard({ user }) {
  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'live' | 'upcoming' | 'all'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamData, statsData, eventsData] = await Promise.all([
        teamService.getMyTeam().catch(() => ({ has_team: false })),
        leaderboardService.getStats().catch(() => null),
        eventService.listEvents().catch(() => [])
      ]);
      if (teamData.has_team) {
        setTeam(teamData.team);
      }
      setStats(statsData);
      setEvents(eventsData || []);

      // If user has registered events, default to 'registered'; otherwise if live events exist, 'live'; else 'upcoming'
      const registeredCount = (eventsData || []).filter(e => e.is_registered).length;
      const liveCount = (eventsData || []).filter(e => ['live', 'active'].includes(e.status)).length;
      if (registeredCount > 0) {
        setActiveTab('registered');
      } else if (liveCount > 0) {
        setActiveTab('live');
      } else {
        setActiveTab('all');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const registeredEvents = events.filter(e => e.is_registered);
  const liveEvents = events.filter(e => ['live', 'active'].includes(e.status));
  const upcomingEvents = events.filter(e => ['published', 'registration_open', 'upcoming'].includes(e.status) && !['live', 'active', 'ended', 'completed'].includes(e.status));

  const filteredEvents = activeTab === 'registered'
    ? registeredEvents
    : activeTab === 'live'
    ? liveEvents
    : activeTab === 'upcoming'
    ? upcomingEvents
    : events;

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_right,_rgba(6,182,212,0.15),_transparent_70%)] pointer-events-none" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 text-xs font-mono font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>CLEARANCE: {user?.role?.toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-mono tracking-tight">
            GREETINGS, CADET {user?.username?.toUpperCase()}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            The CyberAnzen Arena is live. Advance your ranking, exploit target environments, and lead your squad through sanctioned tournaments.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/events"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Explore Tournaments</span>
            </Link>
            <Link
              to="/arena"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Practice Arena</span>
            </Link>
            <Link
              to="/team"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Squad Operations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">SCORE ACCUMULATED</span>
          <span className="text-2xl font-bold text-cyan-400">{user?.points || 0} PTS</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">ENLISTED SQUAD</span>
          <span className="text-2xl font-bold text-white truncate block">
            {team ? team.name : 'SOLO OPERATIVE'}
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">ENLISTED EVENTS</span>
          <span className="text-2xl font-bold text-emerald-400">
            {registeredEvents.length} ACTIVE
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">GLOBAL SOLVES</span>
          <span className="text-2xl font-bold text-purple-400">
            {stats ? stats.total_solves : 0} CAPTURED
          </span>
        </div>
      </div>

      {/* Primary Section: Sanctioned Tournaments & Events */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <span>COMPETITIONS & TOURNAMENT WORKSPACES</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Event-driven arenas configured with custom rules, live sandboxes, and dedicated leaderboards.
            </p>
          </div>

          {/* Tournament Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab('registered')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'registered'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>My Enlistments</span>
              {registeredEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/30 text-cyan-200">
                  {registeredEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live Now</span>
              {liveEvents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200">
                  {liveEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Upcoming</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All ({events.length})</span>
            </button>
          </div>
        </div>

        {/* Tournament Cards Grid */}
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 p-8 font-mono">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">
              {activeTab === 'registered' ? 'No Enlisted Competitions' : 'No Tournaments in this Category'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-sans">
              {activeTab === 'registered'
                ? 'You have not registered for any active tournaments. Check the Upcoming tab or explore all events to join.'
                : 'Check back soon as tournament organizers publish scheduled cybersecurity competitions.'}
            </p>
            {activeTab === 'registered' && (
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900/40"
              >
                Browse All Tournaments
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(ev => {
              const isLive = ['live', 'active'].includes(ev.status);
              const isEnded = ['ended', 'completed'].includes(ev.status);
              const isRegistered = ev.is_registered;

              return (
                <div
                  key={ev.id}
                  className={`p-6 rounded-2xl bg-slate-900/70 border transition-all flex flex-col justify-between group ${
                    isRegistered
                      ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                        {ev.event_type?.toUpperCase() || 'CTF'} ARENA
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isLive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
                          isEnded ? 'bg-slate-800 text-slate-400' :
                          'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                        }`}>
                          {ev.status}
                        </span>

                        {isRegistered && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ENLISTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white font-mono mb-2 group-hover:text-cyan-400 transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-sans leading-relaxed">
                      {ev.short_description || ev.description || 'No description provided.'}
                    </p>

                    <div className="space-y-1.5 text-[11px] font-mono text-slate-400 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                      <div className="flex justify-between">
                        <span>MODE:</span>
                        <span className="text-slate-200 capitalize font-medium">{ev.participation_mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SQUAD SIZE:</span>
                        <span className="text-slate-200 font-medium">
                          {ev.team_size_max ? `Max ${ev.team_size_max}` : 'Solo Operative'}
                        </span>
                      </div>
                      {ev.capacity && (
                        <div className="flex justify-between">
                          <span>CAPACITY:</span>
                          <span className="text-slate-200 font-medium">
                            {ev.registration_count || 0} / {ev.capacity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <Link
                      to={`/events/${ev.id}`}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                        isRegistered
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : isEnded
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/60 hover:border-cyan-500'
                      }`}
                    >
                      <span>
                        {isRegistered ? 'ENTER WORKSPACE' : isEnded ? 'VIEW STANDINGS' : 'VIEW BRIEF & ENROLL'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Launch Open Arena Cards */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>OPEN PRACTICE ARENAS</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Self-paced training labs and continuous challenge banks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/arena?tab=ctf"
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">CTF Challenges</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Exploit vulnerabilities, decode encrypted communications, and capture cryptographic flags.
            </p>
          </Link>

          <Link
            to="/arena?tab=dsa"
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">DSA Judge</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Write high-performance algorithms in C, C++, or Python 3 against strict kernel sandboxes.
            </p>
          </Link>

          <Link
            to="/arena?tab=mcq"
            className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono mb-2">Knowledge Quizzes</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Test knowledge in network analysis, operating systems, Linux internals, and web defense.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
