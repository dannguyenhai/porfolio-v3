"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; base: number; phase: number; speed: number };
type Shooter = { x: number; y: number; vx: number; vy: number; life: number };

export default function Stars({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let shooter: Shooter | null = null;
    let raf = 0;
    let w = 0;
    let h = 0;

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((w * h) / 6500) * density;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.25,
        base: Math.random() * 0.55 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.25,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.globalAlpha = s.base * tw;
        ctx.fillStyle = "#dfe3ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sao băng thỉnh thoảng xuất hiện
      if (!reduced) {
        if (!shooter && Math.random() < 0.0022) {
          shooter = {
            x: Math.random() * w * 0.7 + w * 0.25,
            y: Math.random() * h * 0.3,
            vx: -(Math.random() * 4 + 5),
            vy: Math.random() * 2 + 2,
            life: 1,
          };
        }
        if (shooter) {
          shooter.x += shooter.vx;
          shooter.y += shooter.vy;
          shooter.life -= 0.018;
          const grad = ctx.createLinearGradient(
            shooter.x, shooter.y,
            shooter.x - shooter.vx * 9, shooter.y - shooter.vy * 9
          );
          grad.addColorStop(0, `rgba(230,235,255,${0.85 * shooter.life})`);
          grad.addColorStop(1, "rgba(230,235,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(shooter.x, shooter.y);
          ctx.lineTo(shooter.x - shooter.vx * 9, shooter.y - shooter.vy * 9);
          ctx.stroke();
          if (shooter.life <= 0) shooter = null;
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    seed();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(seed);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
