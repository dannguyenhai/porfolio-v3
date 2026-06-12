"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, X } from "lucide-react";

/** Đồ nghề dùng chung cho các game trong Neon Arcade. */

/** Canvas tự khớp vùng chơi: vừa bề rộng lẫn chiều cao, giữ nguyên tỉ lệ. */
export function useCanvasFit(aspect: number, maxW = 1280) {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const frame = frameRef.current;
    const cv = canvasRef.current;
    if (!area || !frame || !cv) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(220, Math.min(area.clientWidth, area.clientHeight * aspect, maxW));
      const h = w / aspect;
      const dpr = window.devicePixelRatio || 1;
      frame.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    });
    ro.observe(area);
    return () => ro.disconnect();
  }, [aspect, maxW]);

  return { areaRef, frameRef, canvasRef };
}

/** Vòng lặp requestAnimationFrame, tự huỷ khi unmount. cb nhận (t, dt) tính bằng ms. */
export function useRaf(cb: (t: number, dt: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(t - last, 200) : 0;
      last = t;
      cbRef.current(t, dt);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/** Kỷ lục lưu localStorage. */
export function useBest(key: string) {
  const [best, setBest] = useState(0);
  useEffect(() => {
    setBest(Number(localStorage.getItem(key) || 0));
  }, [key]);
  const save = (score: number) =>
    setBest((b) => {
      const nb = Math.max(b, score);
      localStorage.setItem(key, String(nb));
      return nb;
    });
  return [best, save] as const;
}

/** Ghi kỷ lục trực tiếp (dùng trong cleanup khi đóng game giữa chừng). */
export function commitBest(key: string, score: number) {
  const cur = Number(localStorage.getItem(key) || 0);
  if (score > cur) localStorage.setItem(key, String(score));
}

/** Context 2D đã scale sẵn theo hệ toạ độ ảo (vw×vh). */
export function ctx2d(cv: HTMLCanvasElement | null, vw: number, vh: number) {
  const ctx = cv?.getContext("2d");
  if (!cv || !ctx || !cv.width) return null;
  ctx.setTransform(cv.width / vw, 0, 0, cv.height / vh, 0, 0);
  ctx.clearRect(0, 0, vw, vh);
  return ctx;
}

/* ── Particles ─────────────────────────────────────────────── */

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  text?: string;
};

/** Bắn một chùm hạt toé ra từ (x, y). */
export function burst(
  arr: Particle[],
  x: number,
  y: number,
  color: string,
  n = 8,
  speed = 130,
  size = 2.2,
) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    arr.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 500 + Math.random() * 350,
      max: 850,
      color,
      size: size * (0.7 + Math.random() * 0.7),
    });
  }
}

/** Chữ bay lên (kiểu "+5"). */
export function floatText(arr: Particle[], x: number, y: number, text: string, color = "#fff") {
  arr.push({ x, y, vx: 0, vy: -46, life: 900, max: 900, color, size: 13, text });
}

export function stepParticles(arr: Particle[], dt: number): Particle[] {
  const s = dt / 1000;
  for (const p of arr) {
    p.x += p.vx * s;
    p.y += p.vy * s;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;
  }
  return arr.filter((p) => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, arr: Particle[]) {
  for (const p of arr) {
    const a = Math.max(0, Math.min(1, p.life / p.max));
    ctx.save();
    ctx.globalAlpha = a;
    if (p.text) {
      ctx.font = `700 ${p.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}

/** Độ lệch rung màn hình — gọi trong draw, trả về [dx, dy]. */
export function shakeOffset(t: number, until: number, power = 5): [number, number] {
  if (t >= until) return [0, 0];
  const k = Math.min(1, (until - t) / 300) * power;
  return [(Math.random() - 0.5) * 2 * k, (Math.random() - 0.5) * 2 * k];
}

/* ── UI chrome ─────────────────────────────────────────────── */

export const CHIP_CLS =
  "rounded-full border border-line bg-black/45 px-3.5 py-1.5 backdrop-blur-sm";
export const CANVAS_CLS =
  "block w-full rounded-2xl border border-line-soft bg-black/40 touch-none";

/**
 * Lớp phủ toàn màn hình (portal vào #screen-root) — game phủ kín cả nav,
 * vẫn nằm gọn bên trong màn hình MacBook.
 */
export function FullScreen({ children }: { children: React.ReactNode }) {
  // Lấy target đồng bộ để canvas tồn tại ngay từ commit đầu (ResizeObserver cần ref thật).
  // FullScreen chỉ được mở từ tương tác phía client nên document luôn sẵn sàng.
  const [target] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.getElementById("screen-root"),
  );
  if (!target) return null;
  return createPortal(
    <div className="absolute inset-0 z-40 flex flex-col bg-[radial-gradient(120%_90%_at_70%_10%,#13122a_0%,#0a0a16_45%,#060610_100%)]">
      {children}
    </div>,
    target,
  );
}

const ICON_BTN =
  "grid h-9 w-9 place-items-center rounded-full border border-line bg-white/[0.04] text-white/75 transition-colors hover:border-white/35 hover:text-white";

/** Thanh điều khiển trên cùng: tên game, chips điểm, nút tạm dừng + đóng (Esc). */
export function TopBar({
  title,
  chips,
  paused,
  canPause,
  onPause,
  onClose,
}: {
  title: React.ReactNode;
  chips: React.ReactNode;
  paused: boolean;
  canPause: boolean;
  onPause: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
      <div className="font-display text-[15px] font-semibold tracking-tight">{title}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 text-[12.5px] text-white/70">
        {chips}
        <button
          onClick={onPause}
          disabled={!canPause}
          className={`${ICON_BTN} ${canPause ? "" : "pointer-events-none opacity-30"}`}
          title={paused ? "Tiếp tục (Space)" : "Tạm dừng (Space)"}
          aria-label="Tạm dừng"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button onClick={onClose} className={ICON_BTN} title="Đóng (Esc)" aria-label="Đóng game">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Overlay bắt đầu / tạm dừng / game over — chạm vào bất kỳ đâu để kích hoạt. */
export function Overlay({
  onAction,
  actionLabel,
  children,
}: {
  onAction: () => void;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-10 grid cursor-pointer place-items-center rounded-2xl bg-black/55 backdrop-blur-[3px]"
      onClick={onAction}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        {children}
        <button className="rounded-full bg-white px-6 py-2.5 text-[13.5px] font-medium text-black transition-transform hover:scale-105 active:scale-95">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
