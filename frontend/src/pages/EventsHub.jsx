import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, Shield, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { eventService } from '../services/api';

export default function EventsHub() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.listEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-mono flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-cyan-400" />
            <span>COMPETITIONS & TOURNAMENTS</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Scheduled cybersecurity capture-the-flag events, hacking tournaments, and coding competitions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-cyan-400 animate-pulse">
          Querying Tournament Registry...
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80 p-8">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-mono text-white">No active tournaments scheduled.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Authorized Event Administrators can schedule competitive events via the Admin Studio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(ev => (
            <div
              key={ev.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                    {ev.participation_mode} MODE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ev.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white font-mono mb-2">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-4 font-sans leading-relaxed">
                  {ev.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  {ev.team_size_max ? `Max Squad: ${ev.team_size_max}` : 'Solo'}
                </span>
                <Link
                  to={`/events/${ev.id}`}
                  className="flex items-center space-x-1.5 text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300"
                >
                  <span>Tournament Brief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
