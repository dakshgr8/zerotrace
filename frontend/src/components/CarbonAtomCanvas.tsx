import React, { useEffect, useRef } from 'react';

interface AtomParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  type: 'C' | 'CO2' | 'ELECTRON';
  label: string;
  orbitAngle: number;
  orbitSpeed: number;
  orbitRadius: number;
}

const ATOM_COLORS = [
  '#8B5CF6', // Vivid Violet
  '#F472B6', // Hot Pink
  '#FBBF24', // Sunshine Yellow
  '#34D399', // Fresh Mint
];

export const CarbonAtomCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      updateScrollOpacity();
    };

    // Scroll-based dynamic opacity (vibrant on page 1, faint on page 2)
    const updateScrollOpacity = () => {
      if (!canvas) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const threshold = window.innerHeight * 0.65;
      const progress = Math.min(1, Math.max(0, scrollY / threshold));
      // Opacity starts at 0.95 and drops to 0.15 as user scrolls down
      const currentOpacity = 0.95 - progress * 0.80;
      canvas.style.opacity = currentOpacity.toFixed(3);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateScrollOpacity, { passive: true });
    updateScrollOpacity();

    // Generate balanced floating Carbon atoms
    const atomCount = Math.min(26, Math.max(14, Math.floor(width / 65)));
    const atoms: AtomParticle[] = [];

    for (let i = 0; i < atomCount; i++) {
      const isCO2 = i % 3 === 0;
      const color = ATOM_COLORS[i % ATOM_COLORS.length];
      const baseRadius = isCO2 ? 24 : 20;

      atoms.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        baseRadius,
        color,
        type: isCO2 ? 'CO2' : 'C',
        label: isCO2 ? 'CO₂' : 'C',
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() * 0.03 + 0.015) * (Math.random() > 0.5 ? 1 : -1),
        orbitRadius: baseRadius + 15,
      });
    }

    // Animation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby carbon atoms with chemical bond lines
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].x - atoms[j].x;
          const dy = atoms[i].y - atoms[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.4;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(atoms[i].x, atoms[i].y);
            ctx.lineTo(atoms[j].x, atoms[j].y);
            ctx.strokeStyle = `rgba(30, 41, 59, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Update and Draw Each Carbon Atom Molecule
      for (let i = 0; i < atoms.length; i++) {
        const atom = atoms[i];

        // 1. Natural floating drift
        atom.x += atom.vx;
        atom.y += atom.vy;
        atom.orbitAngle += atom.orbitSpeed;

        // Wrap around screen boundaries with margin
        const margin = 60;
        if (atom.x < -margin) atom.x = width + margin;
        if (atom.x > width + margin) atom.x = -margin;
        if (atom.y < -margin) atom.y = height + margin;
        if (atom.y > height + margin) atom.y = -margin;

        // 2. Interactive Cursor Reaction (Smooth Repulsion + Elastic Spring)
        const dx = atom.x - mouse.x;
        const dy = atom.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius && distance > 0) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          const pushDistance = force * 6;
          atom.x += Math.cos(angle) * pushDistance;
          atom.y += Math.sin(angle) * pushDistance;
        }

        ctx.save();

        // 3. Draw Orbiting Oxygen/Electron Satellites for CO2 molecules
        if (atom.type === 'CO2') {
          const ox1 = atom.x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
          const oy1 = atom.y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
          
          const ox2 = atom.x + Math.cos(atom.orbitAngle + Math.PI) * atom.orbitRadius;
          const oy2 = atom.y + Math.sin(atom.orbitAngle + Math.PI) * atom.orbitRadius;

          // Double bond lines to O1
          ctx.beginPath();
          ctx.moveTo(atom.x, atom.y);
          ctx.lineTo(ox1, oy1);
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Double bond lines to O2
          ctx.beginPath();
          ctx.moveTo(atom.x, atom.y);
          ctx.lineTo(ox2, oy2);
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Oxygen 1 node
          drawStickerNode(ctx, ox1, oy1, 11, '#F472B6', 'O');
          // Oxygen 2 node
          drawStickerNode(ctx, ox2, oy2, 11, '#F472B6', 'O');
        } else {
          // Single Carbon Valence Electron Orbit ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(atom.x, atom.y, atom.orbitRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.restore();

          // Orbiting valence electron
          const ex = atom.x + Math.cos(atom.orbitAngle) * atom.orbitRadius;
          const ey = atom.y + Math.sin(atom.orbitAngle) * atom.orbitRadius;
          ctx.beginPath();
          ctx.arc(ex, ey, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#FBBF24';
          ctx.fill();
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 4. Draw Central Carbon Atom Node
        drawStickerNode(ctx, atom.x, atom.y, atom.baseRadius, atom.color, atom.label);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Helper: Draw Playful Sticker Node with Hard Pop Shadow & 2px Border
    function drawStickerNode(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      fillColor: string,
      text: string
    ) {
      // Hard offset pop shadow (3px 3px solid #1E293B)
      context.beginPath();
      context.arc(x + 3, y + 3, radius, 0, Math.PI * 2);
      context.fillStyle = '#1E293B';
      context.fill();

      // Main Circle Node
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = fillColor;
      context.fill();
      context.strokeStyle = '#1E293B';
      context.lineWidth = 2;
      context.stroke();

      // Inner Text (e.g. 'C', 'CO₂', 'O')
      context.fillStyle = '#1E293B';
      context.font = `800 ${radius > 18 ? 13 : 10}px Outfit, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, x, y + 0.5);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateScrollOpacity);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300 ease-out"
      style={{ width: '100%', height: '100%', opacity: 0.95 }}
    />
  );
};
