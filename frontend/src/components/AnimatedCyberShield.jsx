import React from 'react';

export default function AnimatedCyberShield({ className = '' }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      
      {/* Outer Cyan Atmospheric Glow */}
      <div className="absolute inset-0 bg-[#00CFFF]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-[#087FFF]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Hooded Hacker Workstation Background */}
      <div className="relative w-full max-w-[420px] sm:max-w-[460px] aspect-[460/430] flex items-center justify-center rounded-2xl overflow-hidden border border-[#18385E]/50 bg-[#030A16]/60 backdrop-blur-sm shadow-[0_0_50px_rgba(0,207,255,0.15)] group">
        
        {/* Layer 1: Ambient hacker background */}
        <img
          src="/ui-assets/hero-hacker-scene.png"
          alt="CyberAnzen Operative"
          className="absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-screen scale-105 transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Layer 2: Rotating Cyber Ring (SVG) */}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite] pointer-events-none opacity-40"
        >
          <circle
            cx="200"
            cy="200"
            r="160"
            fill="none"
            stroke="#00CFFF"
            strokeWidth="1.5"
            strokeDasharray="8 12"
          />
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="#087FFF"
            strokeWidth="1"
            strokeDasharray="4 20"
          />
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke="#00CFFF"
            strokeWidth="0.8"
            strokeDasharray="16 16"
          />
        </svg>

        {/* Layer 3: The 3D High-Res Official Glowing Shield */}
        <div className="relative z-10 w-44 sm:w-56 md:w-64 aspect-square flex items-center justify-center animate-[float_4s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-[#00CFFF]/25 rounded-full blur-xl pointer-events-none" />
          <img
            src="/ui-assets/hero-shield.png"
            alt="CyberAnzen Shield"
            className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(0,207,255,0.85)] drop-shadow-[0_0_15px_rgba(8,127,255,0.9)]"
            onError={(e) => {
              e.target.src = "/logo.png";
            }}
          />
        </div>

        {/* Layer 4: Vertical Tech Track Labels (Desktop only) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center space-y-4 z-20 pointer-events-none font-mono text-[9px] tracking-widest text-[#00CFFF]/80">
          <span className="[writing-mode:vertical-rl] hover:text-white transition-colors">LEARN</span>
          <div className="w-1 h-1 rounded-full bg-[#00CFFF]" />
          <span className="[writing-mode:vertical-rl] hover:text-white transition-colors">PRACTICE</span>
          <div className="w-1 h-1 rounded-full bg-[#00CFFF]" />
          <span className="[writing-mode:vertical-rl] hover:text-white transition-colors">COMPETE</span>
          <div className="w-1 h-1 rounded-full bg-[#00CFFF]" />
          <span className="[writing-mode:vertical-rl] hover:text-white transition-colors">GROW</span>
        </div>

        {/* Layer 5: Bottom Cyan Ambient Fog Blend */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#030A16] via-[#030A16]/70 to-transparent pointer-events-none z-10" />
      </div>

    </div>
  );
}
