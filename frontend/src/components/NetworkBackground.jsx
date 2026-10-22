import React, { useEffect, useRef } from 'react';

export default function NetworkBackground({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes count (reduced on small screens)
    const nodeCount = Math.floor(Math.min(width, 1440) / (width < 768 ? 32 : 18));
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.8,
        color: Math.random() > 0.85 ? '#FF2448' : Math.random() > 0.3 ? '#00CFFF' : '#087FFF'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting lines
      const maxDist = width < 768 ? 90 : 130;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            ctx.strokeStyle = `rgba(0, 207, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}>
      {/* Base Dark Gradient */}
      <div className="absolute inset-0 bg-[#030A16]" />

      {/* Atmospheric Radial Illumination */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#087FFF]/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#00CFFF]/5 rounded-full blur-[120px]" />

      {/* Subtle Digital Circuit Grid */}
      <div 
        className="absolute inset-0 opacity-[0.07]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #00CFFF 1px, transparent 1px),
            linear-gradient(to bottom, #00CFFF 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Canvas Particle & Connection Lines */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}
