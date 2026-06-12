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
  ctx2d,
  drawParticles,
  floatText,
  shakeOffset,
  stepParticles,
  useBest,
  useCanvasFit,
  useRaf,
  type Particle,
} from "./arcade";

/**
 * Neon Breakout — phá gạch. Chuột / vuốt lái thanh đỡ, hoặc ←→.
 * Gạch hàng trên cứng hơn (2 máu). Gạch vỡ có thể rơi power-up:
 * ↔ thanh đỡ rộng · ● multi-ball · 🔥 bóng lửa xuyên gạch · ♥ +1 mạng.
 */

const VW = 600;
const VH = 400;
const BRICK_COLS = 9;
const BRICK_ROWS = 5;
const SIDE = 24;
const BRICK_TOP = 42;
const BRICK_H = 16;
const BRICK_GAP = 7;
const BRICK_W = (VW - SIDE * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
const PADDLE_H = 9;
const PADDLE_Y = 376;
const BALL_R = 6.5;
const BASE_SPEED = 250;
const MAX_BALLS = 6;

type Phase = "idle" | "playing" | "over";
type Ball = { x: number; y: number; vx: number; vy: number };
type DropType = "wide" | "multi" | "fire" | "life";
type Drop = { x: number; y: number; vy: number; type: DropType };

const DROP_STYLE: Record<DropType, { color: string; icon: string }> = {
  wide: { color: "#8fd2ff", icon: "↔" },
  multi: { color: "#c4a8ff", icon: "●●" },
  fire: { color: "#ffb27a", icon: "🔥" },
  life: { color: "#ff9bb0", icon: "♥" },
};

function rollDrop(): DropType | null {
  if (Math.random() > 0.24) return null;
  const r = Math.random();
  if (r < 0.34) return "wide";
  if (r < 0.64) return "multi";
  if (r < 0.9) return "fire";
  return "life";
}

export default function Breakout({ onClose }: { onClose: () => void }) {
  const { areaRef, frameRef, canvasRef } = useCanvasFit(VW / VH);

  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [fx, setFx] = useState("");
  const [best, saveBest] = useBest("dane-breakout-best");

  const g = useRef({
    px: VW / 2,
    balls: [] as Ball[],
    bricks: [] as number[], // máu từng viên, 0 = vỡ
    drops: [] as Drop[],
    wideUntil: 0,
    fireUntil: 0,
    score: 0,
    lives: 3,
    level: 1,
    keys: { l: false, r: false },
    particles: [] as Particle[],
    shakeUntil: 0,
    now: 0,
  });
  const phaseRef = useRef<Phase>("idle");
  const pausedRef = useRef(false);
  phaseRef.current = phase;
  pausedRef.current = paused;

  useEffect(() => {
    const st = g.current;
    return () => commitBest("dane-breakout-best", st.score);
  }, []);

  const paddleW = () => (g.current.wideUntil > g.current.now ? 142 : 92);

  const spawnBall = (): Ball => {
    const st = g.current;
    const speed = BASE_SPEED + (st.level - 1) * 26;
    const ang = (Math.random() * 50 - 25) * (Math.PI / 180);
    return {
      x: st.px,
      y: PADDLE_Y - BALL_R - 1,
      vx: speed * Math.sin(ang),
      vy: -speed * Math.cos(ang),
    };
  };

  const buildBricks = () => {
    const st = g.current;
    // Hàng trên cứng dần theo màn (tối đa 3 hàng 2 máu)
    const hard = Math.min(st.level, 3);
    st.bricks = Array.from({ length: BRICK_COLS * BRICK_ROWS }, (_, i) =>
      Math.floor(i / BRICK_COLS) < hard ? 2 : 1,
    );
  };

  const start = () => {
    const st = g.current;
    st.px = VW / 2;
    st.score = 0;
    st.lives = 3;
    st.level = 1;
    st.drops = [];
    st.wideUntil = 0;
    st.fireUntil = 0;
    st.particles = [];
    buildBricks();
    st.balls = [spawnBall()];
    setScore(0);
    setLives(3);
    setLevel(1);
    setFx("");
    setPaused(false);
    setPhase("playing");
  };

  const gameOver = () => {
    g.current.shakeUntil = g.current.now + 400;
    setPhase("over");
    saveBest(g.current.score);
  };

  const applyDrop = (type: DropType) => {
    const st = g.current;
    const t = st.now;
    const { color, icon } = DROP_STYLE[type];
    floatText(st.particles, st.px, PADDLE_Y - 16, icon, color);
    if (type === "wide") st.wideUntil = t + 8000;
    else if (type === "fire") st.fireUntil = t + 6000;
    else if (type === "life") {
      st.lives = Math.min(st.lives + 1, 5);
      setLives(st.lives);
    } else {
      const extra: Ball[] = [];
      for (const b of st.balls) {
        if (st.balls.length + extra.length >= MAX_BALLS) break;
        const speed = Math.hypot(b.vx, b.vy);
        for (const da of [-0.5, 0.5]) {
          if (st.balls.length + extra.length >= MAX_BALLS) break;
          const a = Math.atan2(b.vx, -b.vy) + da;
          extra.push({ x: b.x, y: b.y, vx: speed * Math.sin(a), vy: -speed * Math.cos(a) });
        }
      }
      st.balls.push(...extra);
    }
  };

  const update = (dt: number) => {
    const st = g.current;
    const t = st.now;
    const s = dt / 1000;
    const pw = paddleW();

    // Thanh đỡ theo phím
    const dir = (st.keys.r ? 1 : 0) - (st.keys.l ? 1 : 0);
    if (dir) st.px += dir * 440 * s;
    st.px = Math.max(pw / 2, Math.min(VW - pw / 2, st.px));

    const fire = st.fireUntil > t;

    for (const b of st.balls) {
      b.x += b.vx * s;
      b.y += b.vy * s;

      // Tường
      if (b.x < BALL_R) {
        b.x = BALL_R;
        b.vx = Math.abs(b.vx);
      } else if (b.x > VW - BALL_R) {
        b.x = VW - BALL_R;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < BALL_R) {
        b.y = BALL_R;
        b.vy = Math.abs(b.vy);
      }

      // Thanh đỡ — góc nảy phụ thuộc điểm chạm
      if (
        b.vy > 0 &&
        b.y + BALL_R >= PADDLE_Y &&
        b.y + BALL_R <= PADDLE_Y + PADDLE_H + 14 &&
        Math.abs(b.x - st.px) <= pw / 2 + BALL_R
      ) {
        const rel = Math.max(-1, Math.min(1, (b.x - st.px) / (pw / 2)));
        const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.02, 560);
        const ang = rel * (Math.PI / 3);
        b.vx = speed * Math.sin(ang);
        b.vy = -speed * Math.cos(ang);
        b.y = PADDLE_Y - BALL_R;
      }

      // Gạch
      const row = Math.floor((b.y - BRICK_TOP) / (BRICK_H + BRICK_GAP));
      const col = Math.floor((b.x - SIDE) / (BRICK_W + BRICK_GAP));
      if (row >= 0 && row < BRICK_ROWS && col >= 0 && col < BRICK_COLS) {
        const idx = row * BRICK_COLS + col;
        if (st.bricks[idx] > 0) {
          const bx = SIDE + col * (BRICK_W + BRICK_GAP);
          const by = BRICK_TOP + row * (BRICK_H + BRICK_GAP);
          if (
            b.x > bx - BALL_R &&
            b.x < bx + BRICK_W + BALL_R &&
            b.y > by - BALL_R &&
            b.y < by + BRICK_H + BALL_R
          ) {
            st.bricks[idx] -= fire ? st.bricks[idx] : 1;
            st.score += 10;
            setScore(st.score);
            const cx = bx + BRICK_W / 2;
            const cy = by + BRICK_H / 2;
            burst(st.particles, cx, cy, fire ? "#ffb27a" : "#aab2ff", 9, 150);

            if (st.bricks[idx] <= 0) {
              const drop = rollDrop();
              if (drop) st.drops.push({ x: cx, y: cy, vy: 135, type: drop });
            }

            if (!fire) {
              // Nảy theo cạnh gần nhất
              const m = Math.min(
                Math.abs(b.x - bx),
                Math.abs(b.x - (bx + BRICK_W)),
                Math.abs(b.y - by),
                Math.abs(b.y - (by + BRICK_H)),
              );
              if (m === Math.abs(b.y - by)) b.vy = -Math.abs(b.vy);
              else if (m === Math.abs(b.y - (by + BRICK_H))) b.vy = Math.abs(b.vy);
              else if (m === Math.abs(b.x - bx)) b.vx = -Math.abs(b.vx);
              else b.vx = Math.abs(b.vx);
            }

            if (st.bricks.every((hp) => hp <= 0)) {
              st.level += 1;
              setLevel(st.level);
              st.shakeUntil = t + 250;
              floatText(st.particles, VW / 2, VH / 2, `MÀN ${st.level}!`, "#cfd4ff");
              buildBricks();
              st.balls = [spawnBall()];
              st.drops = [];
              break;
            }
          }
        }
      }
    }

    // Bóng rơi xuống đáy
    const before = st.balls.length;
    st.balls = st.balls.filter((b) => b.y <= VH + BALL_R * 2);
    if (st.balls.length === 0 && before > 0) {
      st.lives -= 1;
      setLives(st.lives);
      st.shakeUntil = t + 300;
      if (st.lives <= 0) {
        gameOver();
        return;
      }
      st.balls = [spawnBall()];
    }

    // Power-up rơi
    for (const d of st.drops) d.y += d.vy * s;
    st.drops = st.drops.filter((d) => {
      if (
        d.y >= PADDLE_Y - 8 &&
        d.y <= PADDLE_Y + PADDLE_H + 16 &&
        Math.abs(d.x - st.px) <= paddleW() / 2 + 10
      ) {
        applyDrop(d.type);
        return false;
      }
      return d.y < VH + 20;
    });
  };

  useRaf((t, dt) => {
    const st = g.current;
    st.now = t;
    if (phaseRef.current === "playing" && !pausedRef.current) {
      update(dt);
      st.particles = stepParticles(st.particles, dt);
      const cur = `${st.wideUntil > t ? "↔ " : ""}${st.fireUntil > t ? "🔥 " : ""}`.trim();
      setFx((p) => (p === cur ? p : cur));
    } else {
      st.particles = stepParticles(st.particles, dt);
    }

    const ctx = ctx2d(canvasRef.current, VW, VH);
    if (!ctx) return;
    const [sx, sy] = shakeOffset(t, st.shakeUntil, 5);
    ctx.translate(sx, sy);

    // Gạch — 2 máu sáng đậm, 1 máu nhạt dần theo hàng
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const hp = st.bricks[r * BRICK_COLS + c];
        if (hp <= 0) continue;
        const x = SIDE + c * (BRICK_W + BRICK_GAP);
        const y = BRICK_TOP + r * (BRICK_H + BRICK_GAP);
        ctx.save();
        ctx.shadowColor = hp === 2 ? "rgba(255,210,138,0.55)" : "rgba(170,178,255,0.45)";
        ctx.shadowBlur = 8;
        ctx.fillStyle =
          hp === 2
            ? "rgba(255,216,160,0.92)"
            : `rgba(${200 - r * 14},${206 - r * 12},255,${0.85 - r * 0.12})`;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, BRICK_W, BRICK_H, 4);
        else ctx.rect(x, y, BRICK_W, BRICK_H);
        ctx.fill();
        ctx.restore();
      }
    }

    // Power-up rơi
    for (const d of st.drops) {
      const { color, icon } = DROP_STYLE[d.type];
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(8,8,16,0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, d.x, d.y + 0.5);
      ctx.restore();
    }

    // Thanh đỡ
    const pw = paddleW();
    ctx.save();
    ctx.shadowColor =
      st.wideUntil > t ? "rgba(143,210,255,0.9)" : "rgba(207,212,255,0.8)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#eef0ff";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function")
      ctx.roundRect(st.px - pw / 2, PADDLE_Y, pw, PADDLE_H, 5);
    else ctx.rect(st.px - pw / 2, PADDLE_Y, pw, PADDLE_H);
    ctx.fill();
    ctx.restore();

    // Bóng — cam rực khi fireball
    const fire = st.fireUntil > t;
    for (const b of st.balls) {
      ctx.save();
      ctx.shadowColor = fire ? "rgba(255,150,80,1)" : "rgba(255,255,255,0.9)";
      ctx.shadowBlur = fire ? 22 : 16;
      ctx.fillStyle = fire ? "#ffc896" : "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawParticles(ctx, st.particles);
  });

  // Chuột / chạm lái thanh đỡ
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VW;
    const pw = paddleW();
    g.current.px = Math.max(pw / 2, Math.min(VW - pw / 2, x));
  };

  // Bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown" && e.key === "Enter" && phaseRef.current !== "playing") {
        start();
        return;
      }
      if (e.type === "keydown" && e.key === " ") {
        if (phaseRef.current === "playing") {
          e.preventDefault();
          setPaused((p) => !p);
        }
        return;
      }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const down = e.type === "keydown";
      if (k === "ArrowLeft" || k === "a") {
        e.preventDefault();
        g.current.keys.l = down;
      } else if (k === "ArrowRight" || k === "d") {
        e.preventDefault();
        g.current.keys.r = down;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mất focus → tạm dừng
  useEffect(() => {
    const onBlur = () => {
      if (phaseRef.current === "playing") setPaused(true);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  return (
    <FullScreen>
      <TopBar
        title={
          <>
            🧱 Neon <span className="text-shine">Breakout</span>
          </>
        }
        chips={
          <>
            {fx && <span className={CHIP_CLS}>{fx}</span>}
            <span className={CHIP_CLS}>
              Màn <span className="font-display ml-1 font-semibold text-white">{level}</span>
            </span>
            <span className={CHIP_CLS}>
              Điểm <span className="font-display ml-1 font-semibold text-white">{score}</span>
            </span>
            <span className={CHIP_CLS}>
              Mạng <span className="ml-1 text-white">{"♥".repeat(Math.max(lives, 0)) || "—"}</span>
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
          <canvas ref={canvasRef} onPointerMove={onPointerMove} className={CANVAS_CLS} />

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
                    Bạn ghi được <span className="font-semibold text-white">{score}</span> điểm —
                    tới màn {level}
                  </div>
                </>
              ) : paused ? (
                <div className="font-display text-2xl font-bold">Tạm dừng</div>
              ) : (
                <>
                  <div className="font-display text-2xl font-bold">
                    Neon <span className="text-shine">Breakout</span>
                  </div>
                  <div className="max-w-[28rem] text-[13px] leading-relaxed text-fog">
                    Di <span className="text-white">chuột</span> hoặc <span className="text-white">←→</span>{" "}
                    lái thanh đỡ · <span className="text-white">Space</span> tạm dừng. Gạch vàng
                    cứng 2 máu. Hứng power-up rơi xuống:{" "}
                    <span style={{ color: DROP_STYLE.wide.color }}>↔ thanh rộng</span> ·{" "}
                    <span style={{ color: DROP_STYLE.multi.color }}>●● multi-ball</span> ·{" "}
                    <span style={{ color: DROP_STYLE.fire.color }}>🔥 bóng lửa xuyên gạch</span> ·{" "}
                    <span style={{ color: DROP_STYLE.life.color }}>♥ +1 mạng</span>
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
