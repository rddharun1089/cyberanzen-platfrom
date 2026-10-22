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
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'ctf' | 'dsa' | 'mcq'
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
      if (ev.event_type !== selectedType) return false;
    }

    // Status match
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'live' && !['live', 'active'].includes(ev.status)) return false;
      if (selectedStatus === 'open' && ev.status !== 'registration_open') return false;
      if (selectedStatus === 'upcoming' && !['upcoming', 'published'].includes(ev.status)) return false;
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

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header Introduction */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#123746] gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#071B28] border border-[#123746] text-[#00E5F0] text-xs font-mono font-medium mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#00E5F0]" />
            <span>SANCTIONED COMPETITIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F2FAFF] font-mono tracking-tight">
            Events
          </h1>
          <p className="text-sm text-[#9BB3C2] mt-1 max-w-2xl font-normal leading-relaxed">
            Discover events, explore the rules, and join competitions hosted by CyberAnzen.
          </p>
        </div>

        {/* Total Events Counter */}
        <div className="font-mono text-xs text-[#9BB3C2] bg-[#071B28] px-4 py-2 rounded-xl border border-[#123746] self-start md:self-auto">
          AVAILABLE TOURNAMENTS: <span className="text-[#00E5F0] font-bold">{events.length}</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#071B28] border border-[#123746] shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#9BB3C2] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#030B12] border border-[#123746] text-xs text-[#F2FAFF] placeholder-[#9BB3C2]/60 focus:outline-none focus:border-[#00E5F0] transition-colors font-mono"
            />
          </div>

          {/* Event Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#030B12] border border-[#123746] text-xs text-[#F2FAFF] focus:outline-none focus:border-[#00E5F0] font-mono"
            >
              <option value="all">All Arena Types</option>
              <option value="ctf">Cybersecurity CTF</option>
              <option value="dsa">DSA / Coding Contest</option>
              <option value="mcq">Knowledge Quiz</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#030B12] border border-[#123746] text-xs text-[#F2FAFF] focus:outline-none focus:border-[#00E5F0] font-mono"
            >
              <option value="all">All Lifecycles</option>
              <option value="live">Live Now</option>
              <option value="open">Registration Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Pills & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#123746]/60 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#9BB3C2] flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3 text-[#00E5F0]" />
              <span>Participation:</span>
            </span>
            <button
              onClick={() => setSelectedMode('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedMode === 'all'
                  ? 'bg-[#00E5F0]/20 text-[#00E5F0] border border-[#00E5F0]/40 font-bold'
                  : 'text-[#9BB3C2] hover:bg-[#030B12]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedMode('individual')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedMode === 'individual'
                  ? 'bg-[#00E5F0]/20 text-[#00E5F0] border border-[#00E5F0]/40 font-bold'
                  : 'text-[#9BB3C2] hover:bg-[#030B12]'
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => setSelectedMode('team')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedMode === 'team'
                  ? 'bg-[#00E5F0]/20 text-[#00E5F0] border border-[#00E5F0]/40 font-bold'
                  : 'text-[#9BB3C2] hover:bg-[#030B12]'
              }`}
            >
              Squad
            </button>
            <button
              onClick={() => setSelectedMode('mixed')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedMode === 'mixed'
                  ? 'bg-[#00E5F0]/20 text-[#00E5F0] border border-[#00E5F0]/40 font-bold'
                  : 'text-[#9BB3C2] hover:bg-[#030B12]'
              }`}
            >
              Mixed
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#9BB3C2]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#030B12] border border-[#123746] px-2.5 py-1 rounded-lg text-xs text-[#F2FAFF] focus:outline-none font-mono"
              >
                <option value="upcoming">Upcoming Date</option>
                <option value="recent">Recently Published</option>
              </select>
            </div>

            {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedMode !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#00E5F0] hover:underline"
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
            <div key={n} className="p-6 rounded-2xl bg-[#071B28]/60 border border-[#123746] animate-pulse space-y-4">
              <div className="h-4 bg-[#123746] rounded w-1/3" />
              <div className="h-6 bg-[#123746] rounded w-3/4" />
              <div className="h-12 bg-[#123746] rounded" />
              <div className="h-10 bg-[#123746] rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="py-16 text-center rounded-2xl bg-[#071B28] border border-[#FF5263]/40 p-8 font-mono">
          <AlertCircle className="w-10 h-10 text-[#FF5263] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#F2FAFF]">Error Loading Competitions</h3>
          <p className="text-xs text-[#9BB3C2] mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#030B12] bg-[#00E5F0] hover:bg-[#00BFCB] inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Empty / No Results State */
        <div className="py-16 text-center rounded-2xl bg-[#071B28]/40 border border-[#123746] p-8 font-mono">
          <Trophy className="w-12 h-12 text-[#9BB3C2]/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F2FAFF]">
            {events.length === 0 ? "No Active Competitions Scheduled" : "No Tournaments Match Your Search"}
          </h3>
          <p className="text-xs text-[#9BB3C2] mt-1 max-w-sm mx-auto font-sans">
            {events.length === 0
              ? "Authorized administrators can create and publish new CTF tournaments, DSA contests, and knowledge quizzes."
              : "Try clearing your filters or search keywords to view all scheduled tournaments."}
          </p>
          {events.length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#00E5F0] bg-[#00E5F0]/10 border border-[#00E5F0]/30 hover:bg-[#00E5F0]/20"
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
                className={`p-6 rounded-2xl bg-[#071B28] border transition-all duration-200 flex flex-col justify-between group ${
                  isRegistered
                    ? 'border-[#00E5F0]/50 shadow-[0_0_20px_rgba(0,229,240,0.12)]'
                    : 'border-[#123746] hover:border-[#00E5F0]/40'
                }`}
              >
                <div>
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold border ${
                      ev.event_type === 'dsa'
                        ? 'bg-[#20D49A]/10 text-[#20D49A] border-[#20D49A]/30'
                        : ev.event_type === 'mcq'
                        ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                        : 'bg-[#00E5F0]/10 text-[#00E5F0] border-[#00E5F0]/30'
                    }`}>
                      {ev.event_type?.toUpperCase() || 'CTF'} ARENA
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isLive ? 'bg-emerald-950 text-[#20D49A] border border-emerald-800 animate-pulse' :
                        isRegOpen ? 'bg-[#00E5F0]/10 text-[#00E5F0] border border-[#00E5F0]/30' :
                        isEnded ? 'bg-slate-800 text-[#9BB3C2]' :
                        'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}>
                        {ev.status}
                      </span>

                      {isRegistered && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-[#20D49A] border border-emerald-800 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ENLISTED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-[#F2FAFF] font-mono mb-2 group-hover:text-[#00E5F0] transition-colors">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[#9BB3C2] line-clamp-3 mb-5 leading-relaxed font-sans">
                    {ev.short_description || ev.description || 'No description provided.'}
                  </p>

                  {/* Metadata Specs Box */}
                  <div className="space-y-2 text-[11px] font-mono text-[#9BB3C2] mb-5 bg-[#030B12]/80 p-3.5 rounded-xl border border-[#123746]/80">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-[#00E5F0]" />
                        <span>PARTICIPATION:</span>
                      </span>
                      <span className="text-[#F2FAFF] capitalize font-medium">
                        {ev.participation_mode === 'individual' ? 'Solo Operative' :
                         ev.participation_mode === 'team' ? `Squad (Max ${ev.team_size_max || 4})` :
                         'Solo / Squad'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#00E5F0]" />
                        <span>STARTS:</span>
                      </span>
                      <span className="text-[#F2FAFF] font-medium">
                        {formatEventDate(ev.start_time)}
                      </span>
                    </div>

                    {ev.capacity && (
                      <div className="flex justify-between items-center">
                        <span>CAPACITY:</span>
                        <span className="text-[#F2FAFF] font-medium">
                          {ev.registration_count || 0} / {ev.capacity} CADETS
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA Action */}
                <div className="pt-3 border-t border-[#123746]">
                  <Link
                    to={`/events/${ev.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all ${
                      isRegistered
                        ? 'bg-[#00E5F0] hover:bg-[#00BFCB] text-[#030B12] shadow-[0_0_15px_rgba(0,229,240,0.3)]'
                        : isEnded
                        ? 'bg-[#030B12] hover:bg-[#061521] text-[#9BB3C2] border border-[#123746]'
                        : 'bg-[#061521] hover:bg-[#071B28] text-[#00E5F0] border border-[#00E5F0]/50 hover:border-[#00E5F0]'
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
