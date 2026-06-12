"use client";

import { useEffect, useRef, useState } from "react";
import {
  CANVAS_CLS,
  CHIP_CLS,
  FullScreen,
  Overlay,
  TopBar,
  burst,
  commitBest,
  floatText,
  drawParticles,
  shakeOffset,
  stepParticles,
  useBest,
  useCanvasFit,
  useRaf,
  type Particle,
} from "./arcade";

/**
 * Neon Snake — lái bằng ←↑↓→ / WASD, Space tạm dừng, vuốt trên mobile.
 * Power-up: ✦ mồi vàng (+5, biến mất nhanh) · 🛡 khiên (xuyên thân 1 lần) · 🐢 slow-mo 4s.
 */

const COLS = 24;
const ROWS = 16;
const BASE_TICK = 150;
const MIN_TICK = 65;
const POWER_TTL = 7000;

type Pt = { x: number; y: number };
type Phase = "idle" | "playing" | "over";
type PowerType = "gold" | "shield" | "slow";
type Power = { type: PowerType; x: number; y: number; bornAt: number };

const POWER_COLOR: Record<PowerType, string> = {
  gold: "#ffd28a",
  shield: "#8fd2ff",
  slow: "#c4a8ff",
};

const KEY_DIRS: Record<string, Pt> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function randCell(occupied: Pt[]): Pt {
  while (true) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!occupied.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

export default function Snake({ onClose }: { onClose: () => void }) {
  const { areaRef, frameRef, canvasRef } = useCanvasFit(COLS / ROWS);
  const touchStart = useRef<Pt | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [fx, setFx] = useState("");
  const [best, saveBest] = useBest("dane-snake-best");

  const g = useRef({
    snake: [] as Pt[],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 14, y: 8 },
    power: null as Power | null,
    shield: false,
    invulnUntil: 0,
    slowUntil: 0,
    tick: BASE_TICK,
    acc: 0,
    score: 0,
    particles: [] as Particle[],
    shakeUntil: 0,
    now: 0,
  });
  const phaseRef = useRef<Phase>("idle");
  const pausedRef = useRef(false);
  phaseRef.current = phase;
  pausedRef.current = paused;

  // Đóng giữa chừng vẫn giữ kỷ lục
  useEffect(() => {
    const st = g.current;
    return () => commitBest("dane-snake-best", st.score);
  }, []);

  const start = () => {
    const st = g.current;
    const mid = Math.floor(ROWS / 2);
    st.snake = [
      { x: 8, y: mid },
      { x: 7, y: mid },
      { x: 6, y: mid },
    ];
    st.dir = { x: 1, y: 0 };
    st.next = { x: 1, y: 0 };
    st.food = randCell(st.snake);
    st.power = null;
    st.shield = false;
    st.invulnUntil = 0;
    st.slowUntil = 0;
    st.tick = BASE_TICK;
    st.acc = 0;
    st.score = 0;
    st.particles = [];
    setScore(0);
    setFx("");
    setPaused(false);
    setPhase("playing");
  };

  const gameOver = () => {
    g.current.shakeUntil = g.current.now + 380;
    setPhase("over");
    saveBest(g.current.score);
  };

  const steer = (d: Pt) => {
    const cur = g.current.dir;
    if (d.x === -cur.x && d.y === -cur.y) return; // không cho quay đầu 180°
    g.current.next = d;
  };

  const cellCenter = (p: Pt, cell: number): Pt => ({
    x: p.x * cell + cell / 2,
    y: p.y * cell + cell / 2,
  });

  const stepOnce = (cell: number) => {
    const st = g.current;
    const t = st.now;
    st.dir = st.next;
    const head = {
      x: (st.snake[0].x + st.dir.x + COLS) % COLS,
      y: (st.snake[0].y + st.dir.y + ROWS) % ROWS,
    };

    // Tự cắn — khiên cho 1.5s bất tử để thoát thân
    if (st.snake.some((s) => s.x === head.x && s.y === head.y) && t >= st.invulnUntil) {
      if (st.shield) {
        st.shield = false;
        st.invulnUntil = t + 1500;
        const c = cellCenter(head, cell);
        burst(st.particles, c.x, c.y, POWER_COLOR.shield, 12, 150);
        floatText(st.particles, c.x, c.y - 8, "KHIÊN!", POWER_COLOR.shield);
      } else {
        gameOver();
        return;
      }
    }

    st.snake.unshift(head);

    // Mồi thường
    if (head.x === st.food.x && head.y === st.food.y) {
      st.score += 1;
      setScore(st.score);
      st.tick = Math.max(MIN_TICK, BASE_TICK - st.score * 4);
      const c = cellCenter(head, cell);
      burst(st.particles, c.x, c.y, "#dfe3ff", 7, 110);
      floatText(st.particles, c.x, c.y - 6, "+1");
      st.food = randCell([...st.snake, ...(st.power ? [st.power] : [])]);
      // 30% nhả power-up nếu chưa có
      if (!st.power && Math.random() < 0.3) {
        const types: PowerType[] = ["gold", "shield", "slow"];
        st.power = {
          type: types[Math.floor(Math.random() * types.length)],
          ...randCell([...st.snake, st.food]),
          bornAt: t,
        };
      }
    } else {
      st.snake.pop();
    }

    // Power-up
    if (st.power && head.x === st.power.x && head.y === st.power.y) {
      const c = cellCenter(head, cell);
      const color = POWER_COLOR[st.power.type];
      burst(st.particles, c.x, c.y, color, 14, 170);
      if (st.power.type === "gold") {
        st.score += 5;
        setScore(st.score);
        floatText(st.particles, c.x, c.y - 8, "+5", color);
      } else if (st.power.type === "shield") {
        st.shield = true;
        floatText(st.particles, c.x, c.y - 8, "🛡 KHIÊN", color);
      } else {
        st.slowUntil = t + 4000;
        floatText(st.particles, c.x, c.y - 8, "🐢 SLOW", color);
      }
      st.power = null;
    }
  };

  useRaf((t, dt) => {
    const st = g.current;
    st.now = t;

    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.width / dpr;
    const h = cv.height / dpr;
    const cell = w / COLS;

    if (phaseRef.current === "playing" && !pausedRef.current) {
      // Power-up hết hạn
      if (st.power && t - st.power.bornAt > POWER_TTL) st.power = null;
      const eff = st.slowUntil > t ? st.tick * 1.6 : st.tick;
      st.acc += dt;
      while (st.acc >= eff && phaseRef.current === "playing") {
        st.acc -= eff;
        stepOnce(cell);
      }
      st.particles = stepParticles(st.particles, dt);
      // Chip hiệu ứng đang có
      const cur = `${st.shield ? "🛡 " : ""}${st.slowUntil > t ? "🐢 " : ""}`.trim();
      setFx((p) => (p === cur ? p : cur));
    } else {
      st.particles = stepParticles(st.particles, dt);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const [sx, sy] = shakeOffset(t, st.shakeUntil, 6);
    ctx.translate(sx, sy);

    // Chấm lưới mờ
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * cell + cell / 2 - 0.5, y * cell + cell / 2 - 0.5, 1, 1);
      }
    }

    // Mồi thường
    const pulse = 0.8 + 0.2 * Math.sin(t / 240);
    ctx.save();
    ctx.shadowColor = "rgba(207,212,255,0.95)";
    ctx.shadowBlur = 16 * pulse;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      st.food.x * cell + cell / 2,
      st.food.y * cell + cell / 2,
      cell * (0.16 + 0.1 * pulse),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    // Power-up — nhấp nháy gấp khi sắp biến mất
    if (st.power) {
      const left = POWER_TTL - (t - st.power.bornAt);
      const blink = left < 2200 ? (Math.sin(t / 90) > 0 ? 1 : 0.25) : 1;
      const color = POWER_COLOR[st.power.type];
      const cx = st.power.x * cell + cell / 2;
      const cy = st.power.y * cell + cell / 2;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = color;
      // Hình thoi cho khác mồi thường
      ctx.beginPath();
      const r = cell * 0.3 * pulse;
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Rắn — mờ dần về đuôi, đầu phát sáng (vàng nhạt khi có khiên / đang bất tử)
    const shieldGlow = st.shield || st.invulnUntil > t;
    st.snake.forEach((s, i) => {
      const alpha = 1 - (i / Math.max(st.snake.length - 1, 1)) * 0.68;
      const pad = cell * 0.12;
      const x = s.x * cell + pad;
      const y = s.y * cell + pad;
      const sz = cell - pad * 2;
      ctx.save();
      if (i === 0) {
        ctx.shadowColor = shieldGlow ? POWER_COLOR.shield : "rgba(180,188,255,0.85)";
        ctx.shadowBlur = shieldGlow ? 24 : 18;
      }
      ctx.fillStyle = `rgba(226,230,255,${alpha})`;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, sz, sz, cell * 0.24);
      else ctx.rect(x, y, sz, sz);
      ctx.fill();
      // Vòng khiên quanh đầu
      if (i === 0 && shieldGlow) {
        ctx.strokeStyle = POWER_COLOR.shield;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = st.invulnUntil > t ? (Math.sin(t / 70) > 0 ? 0.9 : 0.3) : 0.9;
        ctx.beginPath();
        ctx.arc(x + sz / 2, y + sz / 2, sz * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    drawParticles(ctx, st.particles);

    // Viền tím khi slow-mo
    if (st.slowUntil > t) {
      ctx.save();
      ctx.strokeStyle = POWER_COLOR.slow;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t / 180);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, w - 2, h - 2);
      ctx.restore();
    }
  });

  // Bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phaseRef.current !== "playing") {
        start();
        return;
      }
      if (e.key === " ") {
        if (phaseRef.current === "playing") {
          e.preventDefault();
          setPaused((p) => !p);
        }
        return;
      }
      const d = KEY_DIRS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!d) return;
      e.preventDefault();
      if (phaseRef.current !== "playing") start();
      else if (pausedRef.current) setPaused(false);
      steer(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mất focus cửa sổ → tự tạm dừng
  useEffect(() => {
    const onBlur = () => {
      if (phaseRef.current === "playing") setPaused(true);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (phaseRef.current !== "playing") {
      start();
      return;
    }
    const t0 = touchStart.current;
    if (!t0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - t0.x;
    const dy = t.clientY - t0.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    steer(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };

  return (
    <FullScreen>
      <TopBar
        title={
          <>
            🐍 Neon <span className="text-shine">Snake</span>
          </>
        }
        chips={
          <>
            {fx && <span className={CHIP_CLS}>{fx}</span>}
            <span className={CHIP_CLS}>
              Điểm <span className="font-display ml-1 font-semibold text-white">{score}</span>
            </span>
            <span className={CHIP_CLS}>
              Kỷ lục <span className="font-display ml-1 font-semibold text-glow">{best}</span>
            </span>
          </>
        }
        paused={paused}
        canPause={phase === "playing"}
        onPause={() => setPaused((p) => !p)}
        onClose={onClose}
      />

      <div ref={areaRef} className="flex min-h-0 flex-1 items-center justify-center px-5 py-4">
        <div ref={frameRef} className="relative">
          <canvas
            ref={canvasRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className={CANVAS_CLS}
          />

          {(phase !== "playing" || paused) && (
            <Overlay
              onAction={() => (paused && phase === "playing" ? setPaused(false) : start())}
              actionLabel={phase === "over" ? "Chơi lại" : paused ? "Tiếp tục" : "Bắt đầu"}
            >
              {phase === "over" ? (
                <>
                  <div className="font-display text-2xl font-bold">
                    {score > 0 && score >= best ? "Kỷ lục mới! 🏆" : "Game over"}
                  </div>
                  <div className="text-[14px] text-fog">
                    Bạn ghi được <span className="font-semibold text-white">{score}</span> điểm
                  </div>
                </>
              ) : paused ? (
                <div className="font-display text-2xl font-bold">Tạm dừng</div>
              ) : (
                <>
                  <div className="font-display text-2xl font-bold">
                    Neon <span className="text-shine">Snake</span>
                  </div>
                  <div className="max-w-[28rem] text-[13px] leading-relaxed text-fog">
                    <span className="text-white">←↑↓→</span> / <span className="text-white">WASD</span>{" "}
                    để lái, vuốt trên mobile · <span className="text-white">Space</span> tạm dừng.
                    Săn viên kim cương đặc biệt:{" "}
                    <span style={{ color: POWER_COLOR.gold }}>✦ vàng +5 điểm</span> ·{" "}
                    <span style={{ color: POWER_COLOR.shield }}>🛡 khiên xuyên thân</span> ·{" "}
                    <span style={{ color: POWER_COLOR.slow }}>🐢 slow-mo</span> — nhanh lên kẻo
                    chúng biến mất!
                  </div>
                </>
              )}
            </Overlay>
          )}
        </div>
      </div>
    </FullScreen>
  );
}
