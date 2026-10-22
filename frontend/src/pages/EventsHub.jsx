import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Trophy, Users, Shield, ArrowRight, CheckCircle2, 
  Clock, Search, Filter, Radio, RefreshCw, AlertCircle, Sparkles, Code2, Award, Terminal
} from 'lucide-react';
import { eventService } from '../services/api';

export default function EventsHub({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'ctf' | 'dsa' | 'mcq' | 'combined'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'live' | 'open' | 'upcoming' | 'completed'
  const [selectedMode, setSelectedMode] = useState('all'); // 'all' | 'individual' | 'team' | 'mixed'
  const [sortBy, setSortBy] = useState('upcoming'); // 'upcoming' | 'recent'

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.listEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Unable to reach the tournament registry. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events
  const filteredEvents = events.filter(ev => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchDesc = (ev.short_description || ev.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Type match
    if (selectedType !== 'all') {
      const evType = (ev.event_type || '').toLowerCase();
      if (selectedType === 'dsa') {
        if (!evType.includes('dsa') && evType !== 'combined') return false;
      } else if (selectedType === 'ctf') {
        if (!evType.includes('ctf') && evType !== 'combined') return false;
      } else if (selectedType === 'mcq') {
        if (!evType.includes('mcq') && evType !== 'combined') return false;
      } else if (selectedType === 'combined') {
        if (!['ctf_dsa', 'dsa_mcq', 'ctf_mcq', 'combined'].includes(evType)) return false;
      }
    }

    // Status match
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'live' && !['live', 'active'].includes(ev.status)) return false;
      if (selectedStatus === 'open' && ev.status !== 'registration_open') return false;
      if (selectedStatus === 'upcoming' && !['upcoming', 'published', 'draft'].includes(ev.status)) return false;
      if (selectedStatus === 'completed' && !['ended', 'completed'].includes(ev.status)) return false;
    }

    // Participation Mode match
    if (selectedMode !== 'all') {
      if (selectedMode === 'individual' && ev.participation_mode !== 'individual') return false;
      if (selectedMode === 'team' && ev.participation_mode !== 'team') return false;
      if (selectedMode === 'mixed' && !['both', 'mixed'].includes(ev.participation_mode)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return (b.id || 0) - (a.id || 0);
    }
    // Default upcoming
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return timeA - timeB;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedMode('all');
    setSortBy('upcoming');
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { 
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'ctf_dsa': return 'CTF + DSA HYBRID';
      case 'dsa_mcq': return 'DSA + MCQ';
      case 'ctf_mcq': return 'CTF + MCQ';
      case 'combined': return 'ALL-IN-ONE ARENA';
      case 'dsa': return 'DSA / COMPETITIVE';
      case 'mcq': return 'MCQ QUIZ';
      default: return 'CTF ARENA';
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#F2F7FF]">
      
      {/* Header Introduction */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#18385E] gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#08172B] border border-[#18385E] text-[#00CFFF] text-xs font-mono font-medium mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#00CFFF]" />
            <span>SANCTIONED COMPETITIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F2F7FF] font-mono tracking-tight">
            Events &amp; Tournaments
          </h1>
          <p className="text-sm text-[#A9BCD6] mt-1 max-w-2xl font-normal leading-relaxed">
            Discover scheduled battles, explore tournament objectives, and enroll solo or with your squad.
          </p>
        </div>

        {/* Total Events Counter */}
        <div className="font-mono text-xs text-[#A9BCD6] bg-[#08172B] px-4 py-2 rounded-xl border border-[#18385E] self-start md:self-auto">
          AVAILABLE TOURNAMENTS: <span className="text-[#00CFFF] font-bold">{events.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A9BCD6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament name, keywords, or narrative..."
              className="w-full pl-10 pr-4 py-2 bg-[#061329] border border-[#18385E] rounded-xl text-xs text-[#F2F7FF] placeholder-[#A9BCD6]/60 focus:outline-none focus:border-[#00CFFF] font-mono"
            />
          </div>

          {/* Paradigm Type Filters */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
            {[
              { id: 'all', label: 'All Arenas' },
              { id: 'ctf', label: 'CTF' },
              { id: 'dsa', label: 'DSA' },
              { id: 'mcq', label: 'MCQ' },
              { id: 'combined', label: 'Combined' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap text-xs ${
                  selectedType === t.id
                    ? 'bg-[#00CFFF] text-slate-950 font-bold shadow-[0_0_15px_rgba(0,207,255,0.3)]'
                    : 'bg-[#061329] text-[#A9BCD6] hover:text-[#F2F7FF] border border-[#18385E]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#18385E] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#A9BCD6] font-mono text-[11px]">Mode:</span>
            {['all', 'individual', 'team', 'mixed'].map(m => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-colors ${
                  selectedMode === m
                    ? 'bg-[#087FFF]/20 text-[#00CFFF] border border-[#087FFF]/50 font-bold'
                    : 'text-[#A9BCD6] hover:bg-[#102746]'
                }`}
              >
                {m === 'individual' ? 'Solo' : m === 'team' ? 'Squad' : m}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#A9BCD6] font-mono text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#061329] border border-[#18385E] px-2.5 py-1 rounded-lg text-xs text-[#F2F7FF] focus:outline-none font-mono"
              >
                <option value="upcoming">Upcoming Date</option>
                <option value="recent">Recently Published</option>
              </select>
            </div>

            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedMode !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#00CFFF] hover:underline font-mono"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="p-6 rounded-2xl bg-[#0B1D38]/60 border border-[#18385E] animate-pulse space-y-4">
              <div className="h-4 bg-[#18385E] rounded w-1/3" />
              <div className="h-6 bg-[#18385E] rounded w-3/4" />
              <div className="h-12 bg-[#18385E] rounded" />
              <div className="h-10 bg-[#18385E] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="py-16 text-center rounded-2xl bg-[#0B1D38] border border-red-500/40 p-8 font-mono">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#F2F7FF]">Error Loading Competitions</h3>
          <p className="text-xs text-[#A9BCD6] mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Empty / No Results State */
        <div className="py-16 text-center rounded-2xl bg-[#0B1D38]/60 border border-[#18385E] p-8 font-mono">
          <Trophy className="w-12 h-12 text-[#A9BCD6]/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F2F7FF]">
            {events.length === 0 ? "No Active Competitions Scheduled" : "No Tournaments Match Your Search"}
          </h3>
          <p className="text-xs text-[#A9BCD6] mt-1 max-w-sm mx-auto font-sans">
            {events.length === 0
              ? "Authorized administrators can create and publish new CTF tournaments, DSA contests, and knowledge quizzes."
              : "Try clearing your filters or search keywords to view all scheduled tournaments."}
          </p>
          {events.length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#00CFFF] bg-[#00CFFF]/10 border border-[#00CFFF]/30 hover:bg-[#00CFFF]/20"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Real Event Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(ev => {
            const isLive = ['live', 'active'].includes(ev.status);
            const isEnded = ['ended', 'completed'].includes(ev.status);
            const isRegOpen = ev.status === 'registration_open';
            const isRegistered = ev.is_registered;

            return (
              <div
                key={ev.id}
                className={`p-6 rounded-2xl bg-[#0B1D38] border transition-all duration-200 flex flex-col justify-between group overflow-hidden ${
                  isRegistered
                    ? 'border-[#00CFFF]/50 shadow-[0_0_20px_rgba(0,207,255,0.15)]'
                    : 'border-[#18385E] hover:border-[#087FFF]'
                }`}
              >
                <div>
                  {/* Card Banner Image (Custom or Subtle Themed Header) */}
                  {ev.banner_url ? (
                    <div className="h-32 -mx-6 -mt-6 mb-4 overflow-hidden relative border-b border-[#18385E]">
                      <img 
                        src={ev.banner_url} 
                        alt={ev.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D38] via-transparent to-transparent" />
                    </div>
                  ) : null}

                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold border ${
                      ev.event_type?.includes('dsa')
                        ? 'bg-[#087FFF]/20 text-[#00CFFF] border-[#087FFF]/40'
                        : ev.event_type?.includes('mcq')
                        ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {getEventTypeLabel(ev.event_type)}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isLive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse' :
                        isRegOpen ? 'bg-[#087FFF]/20 text-[#00CFFF] border border-[#087FFF]/40' :
                        isEnded ? 'bg-[#102746] text-[#A9BCD6]' :
                        'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}>
                        {ev.status}
                      </span>

                      {isRegistered && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ENLISTED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#F2F7FF] font-mono mb-2 group-hover:text-[#00CFFF] transition-colors line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#A9BCD6] line-clamp-2 mb-4 leading-relaxed font-sans">
                    {ev.short_description || ev.description || 'No mission briefing provided.'}
                  </p>

                  {/* Metadata Specs Box */}
                  <div className="space-y-2 text-[11px] font-mono text-[#A9BCD6] mb-5 bg-[#061329] p-3 rounded-xl border border-[#18385E]">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-[#00CFFF]" />
                        <span>PARTICIPATION:</span>
                      </span>
                      <span className="text-[#F2F7FF] capitalize font-medium">
                        {ev.participation_mode === 'individual' ? 'Solo Operative' :
                         ev.participation_mode === 'team' ? `Squad (Max ${ev.team_size_max || 4})` :
                         'Solo / Squad'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#00CFFF]" />
                        <span>STARTS:</span>
                      </span>
                      <span className="text-[#F2F7FF] font-medium">
                        {formatEventDate(ev.start_time)}
                      </span>
                    </div>

                    {ev.capacity && (
                      <div className="flex justify-between items-center">
                        <span>CAPACITY:</span>
                        <span className="text-[#F2F7FF] font-medium">
                          {ev.registration_count || 0} / {ev.capacity} CADETS
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA Action */}
                <div className="pt-3 border-t border-[#18385E]">
                  <Link
                    to={`/events/${ev.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                      isRegistered
                        ? 'bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 shadow-[0_0_15px_rgba(0,207,255,0.3)]'
                        : isEnded
                        ? 'bg-[#061329] hover:bg-[#102746] text-[#A9BCD6] border border-[#18385E]'
                        : 'bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] border border-[#00CFFF]/40 hover:border-[#00CFFF]'
                    }`}
                  >
                    <span>
                      {isRegistered ? 'ENTER WORKSPACE' : isEnded ? 'VIEW TOURNAMENT RESULTS' : 'VIEW DETAILS & ENROLL'}
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
  );
}
