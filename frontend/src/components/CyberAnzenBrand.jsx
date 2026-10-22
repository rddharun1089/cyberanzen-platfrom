import React from 'react';
import { Link } from 'react-router-dom';

export default function CyberAnzenBrand({ to, className = '', size = 'md' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const logoSize = isSm ? 'w-8 h-8' : isLg ? 'w-12 h-12' : 'w-10 h-10';
  const titleSize = isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-lg';
  const tagSize = isSm ? 'text-[8px]' : isLg ? 'text-[10px]' : 'text-[9px]';

  const content = (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div className={`${logoSize} rounded-xl bg-[#07182B] border border-[#18385E] flex items-center justify-center group-hover:border-[#00CFFF] group-hover:shadow-[0_0_25px_rgba(0,207,255,0.4)] transition-all duration-300 p-1 shrink-0`}>
        <img 
          src="/logo.png" 
          alt="CyberAnzen Shield" 
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,207,255,0.5)]"
        />
      </div>
      <div className="flex flex-col">
        <span className={`font-orbitron font-black tracking-wider ${titleSize} leading-none text-white select-none`}>
          CYBER<span className="text-[#00CFFF]">ANZEN</span>
        </span>
        <span className={`font-mono ${tagSize} text-[#A9BCD6] tracking-widest uppercase mt-1 select-none`}>
          SECURE · LEARN · COMPETE
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block transition-transform hover:scale-[1.02]">
        {content}
      </Link>
    );
  }

  return content;
}
