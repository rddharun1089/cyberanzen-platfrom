import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ArrowRight, ExternalLink, Github, Linkedin, 
  Instagram, Youtube, Facebook, CheckCircle2, Award, BarChart2, Users,
  Sparkles, Lock, Cpu
} from 'lucide-react';
import { contentService } from '../services/api';

export default function Landing({ user }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await contentService.getPublicContent();
      setContent(data);
    } catch (err) {
      console.warn('Using default content');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#061329] text-[#F2F7FF] selection:bg-[#00CFFF]/30 selection:text-[#00CFFF] font-sans">
      
      {/* =========================================================================
          HERO SECTION (EXACT SCREENSHOT LAYOUT 1)
          ========================================================================= */}
      <section id="home" className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-[#18385E]">
        {/* Subtle cyber background grid & glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#087FFF]/15 via-[#061329] to-[#061329] -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18385E20_1px,transparent_1px),linear-gradient(to_bottom,#18385E20_1px,transparent_1px)] bg-[size:4rem_4rem] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="text-xs font-mono font-semibold tracking-widest text-[#00CFFF] uppercase">
                SECURE · LEARN · COMPETE
              </div>

              {/* Bold 4-Line Headline */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-mono leading-[1.08] select-none">
                <span className="text-white block">THINK.</span>
                <span className="text-white block">EXPLORE.</span>
                <span className="text-[#00CFFF] block drop-shadow-[0_0_25px_rgba(0,207,255,0.4)]">SOLVE.</span>
                <span className="text-[#00CFFF] block drop-shadow-[0_0_25px_rgba(0,207,255,0.4)]">PROVE.</span>
              </h1>

              {/* Description Paragraph */}
              <p className="text-sm sm:text-base text-[#A9BCD6] leading-relaxed max-w-xl font-sans">
                Build practical cybersecurity skills, solve real-world challenges, and grow together with a community of learners through events hosted by CyberAnzen.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/events"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold font-mono text-xs sm:text-sm text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_25px_rgba(0,207,255,0.45)] hover:shadow-[0_0_35px_rgba(0,207,255,0.7)] transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <span>Explore Events</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <Link
                  to={user ? "/events" : "/register"}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium font-mono text-xs sm:text-sm text-[#F2F7FF] bg-[#0B1D38] hover:bg-[#102746] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200"
                >
                  <span>{user ? "Enter Competitions" : "Get Started"}</span>
                </Link>
              </div>
            </div>

            {/* Right Hero Hologram Shield */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              <div className="relative w-72 sm:w-80 md:w-96 aspect-square flex items-center justify-center">
                {/* Neon Ambient Aura */}
                <div className="absolute inset-0 bg-[#00CFFF]/20 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
                <img 
                  src="/ui-assets/hero-shield.png" 
                  alt="CyberAnzen Holographic Shield"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(0,207,255,0.6)]"
                  onError={(e) => {
                    e.target.src = "/logo.png";
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3 FEATURE HIGHLIGHT CARDS
          ========================================================================= */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Real Challenges */}
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/40 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-4 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">Real Challenges</h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Gain hands-on experience with practical and engaging tasks.
            </p>
          </div>

          {/* Card 2: Learn & Grow */}
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/40 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-4 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">Learn &amp; Grow</h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Develop skills, explore new domains, and push your limits.
            </p>
          </div>

          {/* Card 3: Strong Community */}
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/40 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center mb-4 text-[#00CFFF] group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,207,255,0.2)]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">Strong Community</h3>
            <p className="text-xs text-[#A9BCD6] leading-relaxed">
              Be part of a like-minded community and make an impact together.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          ABOUT CYBERANZEN SECTION (WITH MODERN BUILDING IMAGE)
          ========================================================================= */}
      <section id="about" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1D38] border border-[#18385E] shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Narrative */}
            <div className="md:col-span-7 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F2F7FF] font-mono">
                About CyberAnzen
              </h2>
              <p className="text-xs sm:text-sm text-[#A9BCD6] leading-relaxed font-sans">
                CyberAnzen is a student-driven technical council focused on cybersecurity, learning, and hands-on competitions. We organize events, workshops, and challenges to help students and professionals build real-world skills and contribute to a safer digital future.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => scrollToSection('creator')}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold text-[#00CFFF] bg-[#087FFF]/20 border border-[#087FFF]/40 hover:bg-[#087FFF]/30 transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Building Image */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <div className="rounded-2xl overflow-hidden border border-[#18385E] shadow-2xl max-w-sm w-full h-44 sm:h-52 bg-[#061329] relative">
                <img 
                  src="/ui-assets/about-building.png" 
                  alt="CyberAnzen Center" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/logo.png";
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          CREATOR SECTION (WITH DHARUN KUMAR S PROFILE & QUOTE)
          ========================================================================= */}
      <section id="creator" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1D38] border border-[#18385E] shadow-xl relative overflow-hidden">
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
                    className="p-2 rounded-lg bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    title="YouTube"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Quote */}
            <div className="md:col-span-6 md:border-l md:border-[#18385E] md:pl-8 flex flex-col justify-center text-center md:text-left">
              <blockquote className="text-base sm:text-lg italic font-sans text-white leading-relaxed">
                “Building a safer digital future through learning and competition.”
              </blockquote>
              <span className="text-xs font-mono text-[#00CFFF] mt-2 block">
                — Dharun Kumar S
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          LANDING PAGE FOOTER
          ========================================================================= */}
      <footer className="mt-auto py-8 border-t border-[#18385E] bg-[#061329]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left Brand & Copyright */}
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <div className="w-8 h-8 rounded-lg bg-[#0B1D38] border border-[#18385E] p-1 flex items-center justify-center">
                <img src="/logo.png" alt="CyberAnzen" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-mono font-bold text-sm text-[#F2F7FF] tracking-wider block">
                  CYBER<span className="text-[#00CFFF]">ANZEN</span>
                </span>
                <span className="text-[10px] text-[#A9BCD6] font-mono tracking-widest block uppercase">
                  SECURE · LEARN · COMPETE
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  © 2026 CyberAnzen. All rights reserved.
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <div className="flex items-center space-x-6 text-xs font-mono text-[#A9BCD6]">
              <Link to="/" className="hover:text-[#00CFFF] transition-colors">Home</Link>
              <button onClick={() => scrollToSection('about')} className="hover:text-[#00CFFF] transition-colors">About</button>
              <button onClick={() => scrollToSection('creator')} className="hover:text-[#00CFFF] transition-colors">Creator</button>
              <Link to="/events" className="hover:text-[#00CFFF] transition-colors">Events</Link>
            </div>

            {/* Right Socials & Initiative Note */}
            <div className="text-center md:text-right space-y-1.5">
              <div className="flex items-center justify-center md:justify-end space-x-3 text-[#A9BCD6]">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00CFFF] transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
              <span className="text-[11px] text-[#A9BCD6] font-sans block">
                A student initiative for a safer tomorrow.
              </span>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
