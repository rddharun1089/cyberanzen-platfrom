import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ArrowRight, ExternalLink, Github, Linkedin, 
  Globe, Terminal, CheckCircle2, Lock, Cpu, Sparkles 
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
      console.warn('Could not fetch dynamic site content; fallback defaults will be used.');
    } finally {
      setLoading(false);
    }
  };

  const hero = content?.hero || {
    eyebrow: "CYBERANZEN · SECURE · LEARN · COMPETE",
    headline: "Think. Explore. Solve. Prove.",
    description: "Build practical cybersecurity skills, solve technical challenges, and compete with a community of learners through events hosted by CyberAnzen."
  };

  const about = content?.about || {
    title: "About CyberAnzen Arena",
    description: "CyberAnzen is an advanced cybersecurity competition and algorithmic practice platform engineered to bridge practical defensive forensics, ethical exploitation, and competitive programming.",
    principles: [
      {
        title: "Hands-on Cybersecurity Learning",
        description: "Practical challenges in web security, cryptography, digital forensics, reverse engineering, binary exploitation, and network packet analysis."
      },
      {
        title: "Competitive Programming & Problem Solving",
        description: "Algorithmic challenges evaluated against kernel-level resource sandboxes supporting C, C++, and Python 3."
      },
      {
        title: "Knowledge-Based Quizzes",
        description: "Comprehensive technical assessments covering Linux internals, protocols, and defensive security architectures."
      },
      {
        title: "Individual & Squad Operations",
        description: "Dynamic participation models supporting both solo operatives and coordinated team operations with strict capacity controls."
      },
      {
        title: "Responsible Security Research",
        description: "A secure environment promoting ethical investigation, vulnerability analysis, and community knowledge sharing."
      }
    ]
  };

  const creator = content?.creator || {
    name: "CyberAnzen Core Security Team",
    role: "Security Engineering & Systems Architecture",
    bio: "Platform maintained by the CyberAnzen team. Dedicated to hands-on cybersecurity research, competitive programming, and responsible vulnerability education.",
    avatar_url: "/logo.png",
    links: {
      github: "https://github.com/rddharun1089/cyberanzen-platfrom",
      linkedin: "",
      website: ""
    }
  };

  const footer = content?.footer || {
    description: "CyberAnzen Arena — Digital Forensics, Cybersecurity CTF & Competitive Programming Platform.",
    copyright: "© 2026 CyberAnzen Organization. All rights reserved."
  };

  return (
    <div className="flex-1 flex flex-col bg-[#061329] text-[#F2F7FF] selection:bg-[#00CFFF]/30 selection:text-[#00CFFF] font-sans">
      
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section id="home" className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-36 border-b border-[#18385E]">
        {/* Ambient Glow & Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00CFFF]/10 via-[#061329] to-[#061329] -z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18385E30_1px,transparent_1px),linear-gradient(to_bottom,#18385E30_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0B1D38] border border-[#18385E] text-[#00CFFF] text-xs font-mono font-medium tracking-wide mb-8 shadow-[0_0_20px_rgba(0,207,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse" />
            <span>{hero.eyebrow}</span>
          </div>

          {/* Official Logo Symbol Display */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-[#0B1D38] border border-[#18385E] p-2 flex items-center justify-center shadow-[0_0_30px_rgba(0,207,255,0.25)]">
            <img 
              src="/logo.png" 
              alt="CyberAnzen Official Brand" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <Shield className="w-12 h-12 text-[#00CFFF] hidden" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F2F7FF] mb-6 font-mono leading-tight">
            {hero.headline}
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#A9BCD6] mb-10 font-normal leading-relaxed">
            {hero.description}
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/events"
              className="flex items-center space-x-2 px-7 py-3.5 rounded-xl font-bold font-mono text-sm text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_25px_rgba(0,207,255,0.4)] hover:shadow-[0_0_35px_rgba(0,207,255,0.6)] transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={user ? "/events" : "/register"}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-medium font-mono text-sm text-[#F2F7FF] bg-[#0B1D38] hover:bg-[#102746] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200"
            >
              <span>{user ? "Enter Competitions" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4 text-[#00CFFF]" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ABOUT SECTION
          ========================================================================= */}
      <section id="about" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#18385E]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono text-[#00CFFF] uppercase tracking-widest font-semibold block mb-2">
            MISSION &amp; FOUNDATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F2F7FF] font-mono">
            {about.title}
          </h2>
          <p className="mt-4 text-[#A9BCD6] text-sm sm:text-base leading-relaxed">
            {about.description}
          </p>
        </div>

        {/* Pillars / Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {about.principles?.map((p, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] hover:border-[#00CFFF]/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#087FFF]/20 border border-[#087FFF]/40 flex items-center justify-center text-[#00CFFF] font-mono font-bold text-xs mb-4">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-[#F2F7FF] font-mono mb-2">
                  {p.title}
                </h3>
                <p className="text-xs text-[#A9BCD6] leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          CREATOR SECTION
          ========================================================================= */}
      <section id="creator" className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono text-[#00CFFF] uppercase tracking-widest font-semibold block mb-2">
            MAINTAINED &amp; ENGINEERED
          </span>
          <h2 className="text-3xl font-extrabold text-[#F2F7FF] font-mono">
            Platform Leadership
          </h2>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B1D38] border border-[#18385E] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar / Brand Icon */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#061329] border border-[#18385E] p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={creator.avatar_url || "/logo.png"} 
                alt={creator.name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = "/logo.png";
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-block px-2.5 py-0.5 rounded bg-[#087FFF]/20 border border-[#087FFF]/40 text-[#00CFFF] font-mono text-xs font-bold mb-2">
                {creator.role || "Lead Architect"}
              </div>
              <h3 className="text-2xl font-bold text-[#F2F7FF] font-mono">
                {creator.name || "CyberAnzen Core Team"}
              </h3>
              <p className="text-sm text-[#A9BCD6] mt-3 leading-relaxed max-w-2xl">
                {creator.bio || "Platform maintained by the CyberAnzen team."}
              </p>

              {/* External Links */}
              {creator.links && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                  {creator.links.github && (
                    <a
                      href={creator.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {creator.links.linkedin && (
                    <a
                      href={creator.links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {creator.links.website && (
                    <a
                      href={creator.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#061329] hover:bg-[#102746] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Official Site</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PUBLIC FOOTER
          ========================================================================= */}
      <footer className="mt-auto py-12 border-t border-[#18385E] bg-[#061329]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#18385E]/60">
            {/* Brand in Footer */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B1D38] border border-[#18385E] p-1 flex items-center justify-center">
                <img src="/logo.png" alt="CyberAnzen" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-mono font-bold text-sm text-[#F2F7FF] tracking-wider">
                  CYBER<span className="text-[#00CFFF]">ANZEN</span>
                </span>
                <p className="text-[11px] text-[#A9BCD6] mt-0.5">
                  {footer.description}
                </p>
              </div>
            </div>

            {/* Navigation in Footer */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#A9BCD6]">
              <Link to="/" className="hover:text-[#00CFFF] transition-colors">Home</Link>
              <a href="#about" className="hover:text-[#00CFFF] transition-colors">About</a>
              <a href="#creator" className="hover:text-[#00CFFF] transition-colors">Creator</a>
              <Link to="/events" className="hover:text-[#00CFFF] transition-colors">Events</Link>
              {!user && (
                <>
                  <Link to="/login" className="hover:text-[#00CFFF] transition-colors">Sign In</Link>
                  <Link to="/register" className="hover:text-[#00CFFF] transition-colors">Sign Up</Link>
                </>
              )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A9BCD6]/70 font-mono gap-2">
            <div>{footer.copyright}</div>
            <div className="text-[10px]">Security, Forensics &amp; Algorithmic Excellence</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
