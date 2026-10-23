import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ArrowRight, Github, Linkedin, 
  Instagram, Youtube, Target, BarChart2, Users,
  ShieldCheck, ChevronRight, Trophy, Calendar, Code2
} from 'lucide-react';
import { contentService, eventService } from '../services/api';
import AnimatedCyberShield from '../components/AnimatedCyberShield';
import NetworkBackground from '../components/NetworkBackground';
import CyberAnzenBrand from '../components/CyberAnzenBrand';

export default function Landing({ user }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadContent();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.listEvents();
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load events on landing:", err);
    }
  };

  const loadContent = async () => {
    try {
      const data = await contentService.getPublicContent();
      setContent(data);
    } catch (err) {
      // Use fallback static content
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#030A16] text-[#F2F7FF] selection:bg-[#00CFFF]/30 selection:text-[#00CFFF] font-sans relative overflow-x-hidden">
      
      {/* Background Animated Cyber Environment */}
      <NetworkBackground />

      {/* =========================================================================
          HERO SECTION (EXACT REFERENCE HORROR-CYBERSECURITY HERO)
          ========================================================================= */}
      <section id="home" className="relative pt-10 pb-14 md:pt-16 md:pb-20 border-b border-[#18385E]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Eyebrow */}
              <div className="text-xs font-mono font-bold tracking-widest text-[#00CFFF] uppercase select-none">
                SECURE · LEARN · COMPETE
              </div>

              {/* Horror Distressed Headline */}
              <div className="space-y-1 select-none">
                <h1 className="font-horror text-4xl sm:text-6xl md:text-7xl font-bold tracking-wider text-[#F2F7FF] drop-shadow-[0_0_25px_rgba(0,207,255,0.4)] leading-tight">
                  ENTER THE UNKNOWN.
                </h1>
                <h2 className="font-horror text-4xl sm:text-6xl md:text-7xl font-bold tracking-wider text-[#FF2448] drop-shadow-[0_0_30px_rgba(255,36,72,0.65)] leading-tight">
                  HUNT THE VULNERABILITY.
                </h2>
              </div>

              {/* Supporting Line */}
              <p className="text-xs sm:text-sm font-mono text-[#00CFFF] tracking-widest uppercase font-semibold">
                SKILLS TODAY. A SAFER TOMORROW.
              </p>

              {/* Description Paragraph */}
              <p className="text-xs sm:text-sm text-[#A9BCD6] leading-relaxed max-w-xl font-sans">
                Build practical cybersecurity skills, solve real-world challenges, and grow with the CyberAnzen community.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  to={user ? "/events" : "/register"}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full font-bold font-mono text-xs sm:text-sm text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_25px_rgba(0,207,255,0.45)] hover:shadow-[0_0_35px_rgba(0,207,255,0.7)] transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <Link
                  to={user ? "/events" : "/login"}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-full font-medium font-mono text-xs sm:text-sm text-[#F2F7FF] bg-[#07182B] hover:bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200"
                >
                  <span>Sign In</span>
                </Link>
              </div>

              {/* Community Badge Capsule */}
              <div className="pt-2">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#07182B]/90 border border-[#18385E] text-xs font-mono text-[#A9BCD6] shadow-inner">
                  <span className="text-[#00CFFF] font-bold">&gt;_</span>
                  <span>Join a growing community of cybersecurity learners.</span>
                </div>
              </div>
            </div>

            {/* Right Column: Animated Shield & Hooded Hacker */}
            <div className="lg:col-span-5 flex justify-center items-center pt-4 lg:pt-0">
              <AnimatedCyberShield className="w-full" />
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          FOUR FEATURE HIGHLIGHT CARDS (DESKTOP GRID + MOBILE ACCORDION LIST)
          ========================================================================= */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]/50">
        
        {/* Desktop 4-Card Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          
          {/* Card 1: Real Challenges */}
          <div className="p-5 rounded-2xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-3 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-rajdhani uppercase tracking-wider text-white mb-1.5 group-hover:text-[#00CFFF] transition-colors">
              Real Challenges
            </h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Gain hands-on experience with practical and engaging tasks.
            </p>
          </div>

          {/* Card 2: Learn & Grow */}
          <div className="p-5 rounded-2xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-3 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-rajdhani uppercase tracking-wider text-white mb-1.5 group-hover:text-[#00CFFF] transition-colors">
              Learn &amp; Grow
            </h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Develop skills, explore new domains, and push your limits.
            </p>
          </div>

          {/* Card 3: Strong Community */}
          <div className="p-5 rounded-2xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-3 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-rajdhani uppercase tracking-wider text-white mb-1.5 group-hover:text-[#00CFFF] transition-colors">
              Strong Community
            </h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Be part of a like-minded community and make an impact together.
            </p>
          </div>

          {/* Card 4: Secure Competition */}
          <div className="p-5 rounded-2xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 group shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-3 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-rajdhani uppercase tracking-wider text-white mb-1.5 group-hover:text-[#00CFFF] transition-colors">
              Secure Competition
            </h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Compete in a safe and fair environment with real-world relevance.
            </p>
          </div>

        </div>

        {/* Mobile Stacked List Matching Exact Phone Mockup */}
        <div className="md:hidden space-y-2.5">
          {[
            {
              icon: Target,
              title: 'REAL CHALLENGES',
              desc: 'Gain hands-on experience with practical and engaging tasks.'
            },
            {
              icon: BarChart2,
              title: 'LEARN & GROW',
              desc: 'Develop skills, explore new domains, and push your limits.'
            },
            {
              icon: Users,
              title: 'STRONG COMMUNITY',
              desc: 'Be part of a like-minded community and make an impact together.'
            },
            {
              icon: ShieldCheck,
              title: 'SECURE COMPETITION',
              desc: 'Compete in a safe and fair environment with real-world relevance.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#07182B] border border-[#18385E] flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-rajdhani uppercase tracking-wider text-white">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[#A9BCD6] leading-tight line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A9BCD6] shrink-0" />
              </div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          LIVE COMPETITIONS & TOURNAMENT ARENA (DEMO 1 FEATURED)
          ========================================================================= */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-[#00CFFF] uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-[#F5B942]" />
              <span>LIVE COMPETITIVE ARENA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-orbitron text-white tracking-wider">
              FEATURED TOURNAMENTS
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#00CFFF] bg-[#07182B] hover:bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all"
          >
            <span>View All Competitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#07182B] border border-[#18385E] text-center text-[#A9BCD6] text-xs font-mono">
            Loading active competitions...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-6 rounded-2xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/60 shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/30">
                      {ev.event_type?.toUpperCase() || 'DSA'} TOURNAMENT
                    </span>
                    <span className="flex items-center space-x-1 text-[11px] font-mono text-[#20C997] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#20C997] animate-pulse" />
                      <span>LIVE NOW</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-mono text-white group-hover:text-[#00CFFF] transition-colors">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-[#A9BCD6] line-clamp-3 leading-relaxed font-sans">
                    {ev.short_description || ev.description || 'Compete in high-intensity algorithmic problem solving and secure code implementation.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono border-t border-[#18385E]/50">
                    <div className="text-slate-400">
                      Category: <strong className="text-white block">{ev.category || 'DSA'}</strong>
                    </div>
                    <div className="text-slate-400">
                      Mode: <strong className="text-white block">{ev.participation_mode === 'individual' ? 'Solo' : 'Squad'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-[#18385E]/50">
                  <Link
                    to={user ? `/events/${ev.id}` : `/events`}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold font-mono text-xs text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,207,255,0.35)] transition-all"
                  >
                    <span>Enter {ev.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          ABOUT CYBERANZEN SECTION (HOODED HACKER & MORE THAN A CHALLENGE)
          ========================================================================= */}
      <section id="about" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]/50">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07182B] border border-[#18385E] shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Narrative */}
            <div className="md:col-span-7 space-y-4">
              <h2 className="select-none flex items-center space-x-2">
                <span className="font-horror text-3xl sm:text-4xl text-white tracking-wider">
                  ABOUT
                </span>
                <span className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#00CFFF] tracking-wider">
                  CYBERANZEN
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#A9BCD6] leading-relaxed font-sans">
                CyberAnzen is a student-driven technical council focused on cybersecurity, learning, and hands-on competitions. We organize events, workshops, and challenges to help students and professionals build real-world skills and contribute to a safer digital future.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => scrollToSection('creator')}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-semibold text-[#00CFFF] bg-[#030A16] border border-[#00CFFF]/40 hover:bg-[#00CFFF] hover:text-slate-950 transition-all duration-200 shadow-[0_0_15px_rgba(0,207,255,0.2)]"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Atmospheric Hacker Card with Script Overlay */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="rounded-2xl overflow-hidden border border-[#18385E] shadow-2xl max-w-md w-full h-48 sm:h-56 bg-[#030A16] relative group">
                <img 
                  src="/ui-assets/about-hacker.png" 
                  alt="CyberAnzen Digital Operations" 
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.target.src = "/ui-assets/hero-hacker-scene.png";
                  }}
                />

                {/* Subtle Radial Blue Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030A16] via-transparent to-transparent pointer-events-none" />

                {/* Script Overlay: More Than A Challenge */}
                <div className="absolute bottom-4 right-5 text-right pointer-events-none select-none">
                  <span className="font-handwriting text-2xl sm:text-3xl text-white font-bold tracking-wide drop-shadow-[0_0_15px_rgba(0,207,255,0.9)]">
                    More Than A Challenge
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          CREATOR SECTION (DHARUN KUMAR S PROFILE & HANDWRITTEN QUOTE)
          ========================================================================= */}
      <section id="creator" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#07182B] border border-[#18385E] shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Profile Info */}
            <div className="md:col-span-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Avatar with Cyan Glow */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#087FFF] to-[#00CFFF] shadow-[0_0_20px_rgba(0,207,255,0.4)] flex-shrink-0">
                <img 
                  src="/ui-assets/creator-dharun.png" 
                  alt="Dharun Kumar S" 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.src = "/logo.png";
                  }}
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00CFFF] font-bold block">
                  CREATOR
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
                  Dharun Kumar S
                </h3>
                <span className="text-xs text-[#00CFFF] font-mono block">
                  Founder &amp; Developer
                </span>
                <p className="text-xs text-[#A9BCD6] leading-relaxed pt-1 max-w-sm">
                  Designed and developed the CyberAnzen platform to create a space for learning and competition in cybersecurity.
                </p>

                {/* Social Icons */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                  <a
                    href="https://github.com/rddharun1089"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#030A16] hover:bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://linkedin.com/in/dharun-kumar-s-3a5518288"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#030A16] hover:bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://instagram.com/cyberanzen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#030A16] hover:bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://youtube.com/@cyberanzen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#030A16] hover:bg-[#0B1D38] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Quote with Handwriting Script */}
            <div className="md:col-span-6 md:border-l md:border-[#18385E] md:pl-8 flex flex-col justify-center text-center md:text-left relative">
              <span className="text-4xl text-[#00CFFF] font-serif leading-none select-none">“</span>
              <blockquote className="font-handwriting text-xl sm:text-2xl text-white leading-relaxed pt-1">
                Building a safer digital future through learning and competition.
              </blockquote>
              <span className="text-xs font-mono text-[#00CFFF] mt-3 block">
                — Dharun Kumar S
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          LANDING PAGE FOOTER (EXACT MATCH REFERENCE COMPOSITION)
          ========================================================================= */}
      <footer className="mt-auto py-8 border-t border-[#18385E]/50 bg-[#030A16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left Brand */}
            <CyberAnzenBrand to="/" size="sm" />

            {/* Middle Nav Links */}
            <div className="flex items-center space-x-6 text-xs font-mono text-[#A9BCD6]">
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#00CFFF] transition-colors">Home</Link>
              <button onClick={() => scrollToSection('about')} className="hover:text-[#00CFFF] transition-colors">About</button>
              <button onClick={() => scrollToSection('creator')} className="hover:text-[#00CFFF] transition-colors">Creator</button>
            </div>

            {/* Right Socials & Copyright */}
            <div className="text-center md:text-right space-y-1.5">
              <div className="flex items-center justify-center md:justify-end space-x-3 text-[#A9BCD6]">
                <a href="https://github.com/rddharun1089" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Github className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://instagram.com/cyberanzen" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://youtube.com/@cyberanzen" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                © 2025 CyberAnzen. All rights reserved.
              </span>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
