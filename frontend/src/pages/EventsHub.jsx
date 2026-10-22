import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Trophy, Users, Search, ChevronLeft, ChevronRight, 
  ArrowRight, CheckCircle2, Clock, AlertCircle, RefreshCw, ChevronDown
} from 'lucide-react';
import { eventService } from '../services/api';

export default function EventsHub({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'upcoming' | 'ongoing' | 'completed'
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 4;

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
      setError('Unable to reach the tournament registry.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on screenshot filter pills
  const filteredEvents = events.filter(ev => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchDesc = (ev.short_description || ev.description || '').toLowerCase().includes(q);
      const matchCategory = (ev.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }

    // Status filter
    if (selectedStatus === 'ongoing') {
      if (!['live', 'active'].includes(ev.status?.toLowerCase())) return false;
    } else if (selectedStatus === 'upcoming') {
      if (!['upcoming', 'published', 'registration_open', 'draft'].includes(ev.status?.toLowerCase())) return false;
    } else if (selectedStatus === 'completed') {
      if (!['ended', 'completed', 'archived'].includes(ev.status?.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'latest') {
      return (b.id || 0) - (a.id || 0);
    }
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return timeA - timeB;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const formatEventDate = (startDate, endDate) => {
    if (!startDate) return 'Jan 10, 2026 – Jan 12, 2026';
    try {
      const d1 = new Date(startDate);
      const m1 = d1.toLocaleString('en-US', { month: 'short' });
      const day1 = d1.getDate();
      const y1 = d1.getFullYear();
      if (!endDate) return `${m1} ${day1}, ${y1}`;
      const d2 = new Date(endDate);
      const m2 = d2.toLocaleString('en-US', { month: 'short' });
      const day2 = d2.getDate();
      const y2 = d2.getFullYear();
      return `${m1} ${day1}, ${y1} – ${m2} ${day2}, ${y2}`;
    } catch {
      return 'Jan 10, 2026 – Jan 12, 2026';
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'upcoming').toLowerCase();
    if (['live', 'active'].includes(s)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/40">Ongoing</span>;
    }
    if (s === 'registration_open') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/40">Registration Open</span>;
    }
    if (['ended', 'completed', 'archived'].includes(s)) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-[#A9BCD6] border border-slate-700">Completed</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/40">Upcoming</span>;
  };

  const getTypeBadge = (type) => {
    const t = (type || 'ctf').toLowerCase();
    if (t.includes('dsa') && !t.includes('ctf') && !t.includes('mcq')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/40">DSA</span>;
    }
    if (t.includes('mcq') && !t.includes('ctf') && !t.includes('dsa')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40">MCQ</span>;
    }
    if (t.includes('ctf_dsa')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-gradient-to-r from-red-500/20 to-[#00CFFF]/20 text-white border border-[#00CFFF]/40">CTF + DSA</span>;
    }
    if (t === 'combined') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#8B5CF6]/20 text-[#00CFFF] border border-[#8B5CF6]/40">ALL-IN-ONE</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FF5263]/20 text-[#FF5263] border border-[#FF5263]/40">CTF</span>;
  };

  const getEventThumbnail = (ev, index) => {
    if (ev.banner_url) return ev.banner_url;
    const type = (ev.event_type || 'ctf').toLowerCase();
    if (type.includes('dsa')) return '/ui-assets/event-algo.png';
    if (type.includes('mcq')) return '/ui-assets/event-mcq.png';
    if (index % 2 === 1) return '/ui-assets/event-web.png';
    return '/ui-assets/event-nightfall.png';
  };

  const getEventTags = (ev) => {
    const type = (ev.event_type || 'ctf').toLowerCase();
    if (type.includes('dsa')) return ['Algorithms', 'Data Structures', 'DP', '+2'];
    if (type.includes('mcq')) return ['Linux', 'Networking', 'Security', '+3'];
    if (type.includes('ctf_dsa')) return ['Web', 'Crypto', 'Algorithms', '+4'];
    return ['Web', 'Forensics', 'Crypto', '+3'];
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans text-[#F2F7FF]">
      
      {/* =========================================================================
          EVENTS HEADER (EXACT SCREENSHOT LAYOUT 2)
          ========================================================================= */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F2F7FF] font-mono tracking-tight">
          Events
        </h1>
        <p className="text-xs sm:text-sm text-[#A9BCD6] leading-relaxed max-w-2xl font-sans">
          Discover upcoming and ongoing competitions organized by CyberAnzen. Choose an event, read the details and be part of the community.
        </p>
      </div>

      {/* =========================================================================
          SEARCH & FILTER BAR (SCREENSHOT PILLS & SORT DROPDOWN)
          ========================================================================= */}
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A9BCD6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search events by name, tags or keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B1D38] border border-[#18385E] rounded-xl text-xs text-[#F2F7FF] placeholder-[#A9BCD6]/60 focus:outline-none focus:border-[#00CFFF] font-sans shadow-sm"
          />
        </div>

        {/* Filter Pills and Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'ongoing', label: 'Ongoing' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => {
              const isActive = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedStatus(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#00CFFF] text-slate-950 font-bold shadow-[0_0_15px_rgba(0,207,255,0.4)]'
                      : 'bg-[#0B1D38] text-[#A9BCD6] hover:text-white border border-[#18385E]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-[#0B1D38] border border-[#18385E] pl-3 pr-8 py-1.5 rounded-full text-xs text-[#F2F7FF] font-sans focus:outline-none focus:border-[#00CFFF] cursor-pointer"
            >
              <option value="latest">Sort: Latest</option>
              <option value="upcoming">Sort: Upcoming</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#A9BCD6] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL EVENT CARDS LIST (EXACT SCREENSHOT LAYOUT 2)
          ========================================================================= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="p-5 rounded-2xl bg-[#0B1D38]/60 border border-[#18385E] animate-pulse flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-44 h-32 bg-[#18385E] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-[#18385E] rounded w-1/4" />
                <div className="h-6 bg-[#18385E] rounded w-2/3" />
                <div className="h-3 bg-[#18385E] rounded w-full" />
                <div className="h-3 bg-[#18385E] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center rounded-2xl bg-[#0B1D38] border border-red-500/40 p-6">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">{error}</h3>
          <button
            onClick={loadEvents}
            className="mt-3 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-950 bg-[#00CFFF] inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : currentEvents.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0B1D38]/60 border border-[#18385E] p-8">
          <Trophy className="w-10 h-10 text-[#A9BCD6]/40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white font-mono">No Competitions Found</h3>
          <p className="text-xs text-[#A9BCD6] mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter selection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentEvents.map((ev, idx) => {
            const thumbnail = getEventThumbnail(ev, idx);
            const tags = getEventTags(ev);
            const isRegistered = ev.is_registered;

            return (
              <div
                key={ev.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-5 group"
              >
                {/* Left Thumbnail (Poster Image) */}
                <div className="w-full md:w-44 h-36 md:h-32 rounded-xl overflow-hidden bg-[#061329] border border-[#18385E] flex-shrink-0 relative group-hover:border-[#00CFFF]/40 transition-colors">
                  <img 
                    src={thumbnail} 
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "/ui-assets/event-nightfall.png";
                    }}
                  />
                  {isRegistered && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-[#20C997] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-[#20C997]" />
                      <span>ENLISTED</span>
                    </div>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-1 space-y-2">
                  {/* Badges Row */}
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(ev.status)}
                    {getTypeBadge(ev.event_type)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold font-mono text-white group-hover:text-[#00CFFF] transition-colors line-clamp-1">
                    {ev.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#A9BCD6] line-clamp-2 leading-relaxed">
                    {ev.short_description || ev.description || 'Investigate vulnerabilities, solve challenges and capture flags in a high-intensity event.'}
                  </p>

                  {/* Metadata Row: Calendar Date, Points, Participation Mode */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#A9BCD6] font-sans pt-1">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00CFFF]" />
                      <span>{formatEventDate(ev.start_time, ev.end_time)}</span>
                    </span>

                    <span className="flex items-center space-x-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#F5B942]" />
                      <span className="font-semibold text-white">2,500 Points</span>
                    </span>

                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00CFFF]" />
                      <span>
                        {ev.participation_mode === 'individual'
                          ? 'Solo Event (Individual)'
                          : `Team Event (2 – ${ev.team_size_max || 4} members)`}
                      </span>
                    </span>
                  </div>

                  {/* Tags Pill Row */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#061329] border border-[#18385E] text-[#A9BCD6]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex md:flex-col justify-end items-center md:items-end flex-shrink-0 pt-2 md:pt-0">
                  <Link
                    to={`/events/${ev.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#00CFFF] bg-[#00CFFF]/10 border border-[#00CFFF]/40 hover:bg-[#00CFFF] hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(0,207,255,0.2)]"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          PAGINATION BAR (EXACT SCREENSHOT LAYOUT 2)
          ========================================================================= */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                currentPage === pageNum
                  ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_15px_rgba(0,207,255,0.4)]'
                  : 'bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
