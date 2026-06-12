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
 * Star Dodger — lái phi thuyền né thiên thạch. Điểm = giây sống sót + thưởng.
 * Pickup: 🛡 khiên chịu 1 va chạm · 🐢 slow-mo · 💣 bom dọn màn hình · ★ +5 điểm.
 */

const VW = 600;
const VH = 400;
const SHIP_Y = 364;
const SHIP_R = 10;

type Phase = "idle" | "playing" | "over";
type Rock = { x: number; y: number; r: number; vy: number; vx: number; spin: number };
type Star = { x: number; y: number; s: number; v: number };
type PickType = "shield" | "slow" | "bomb" | "star";
type Pick = { x: number; y: number; vy: number; type: PickType };

const PICK_STYLE: Record<PickType, { color: string; icon: string }> = {
  shield: { color: "#8fd2ff", icon: "🛡" },
  slow: { color: "#c4a8ff", icon: "🐢" },
  bomb: { color: "#ffb27a", icon: "💣" },
  star: { color: "#ffd28a", icon: "★" },
};

const makeStars = (): Star[] =>
  Array.from({ length: 46 }, () => ({
    x: Math.random() * VW,
    y: Math.random() * VH,
    s: 0.6 + Math.random() * 1.4,
    v: 14 + Math.random() * 30,
  }));

export default function Dodger({ onClose }: { onClose: () => void }) {
  const { areaRef, frameRef, canvasRef } = useCanvasFit(VW / VH);

  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [secs, setSecs] = useState(0);
  const [fx, setFx] = useState("");
  const [best, saveBest] = useBest("dane-dodger-best");

  const g = useRef({
    shipX: VW / 2,
    targetX: VW / 2,
    rocks: [] as Rock[],
    picks: [] as Pick[],
    stars: makeStars(),
    shield: false,
    slowUntil: 0,
    elapsed: 0,
    bonus: 0,
    spawnIn: 0,
    pickIn: 5000,
    keys: { l: false, r: false },
    particles: [] as Particle[],
    shakeUntil: 0,
    now: 0,
  });
  const phaseRef = useRef<Phase>("idle");
  const pausedRef = useRef(false);
  phaseRef.current = phase;
  pausedRef.current = paused;

  const totalScore = () => Math.floor(g.current.elapsed) + g.current.bonus;

  useEffect(() => {
    const st = g.current;
    return () => commitBest("dane-dodger-best", Math.floor(st.elapsed) + st.bonus);
  }, []);

  const start = () => {
    const st = g.current;
    st.shipX = VW / 2;
    st.targetX = VW / 2;
    st.rocks = [];
    st.picks = [];
    st.shield = false;
    st.slowUntil = 0;
    st.elapsed = 0;
    st.bonus = 0;
    st.spawnIn = 500;
    st.pickIn = 5000;
    st.particles = [];
    setScore(0);
    setSecs(0);
    setFx("");
    setPaused(false);
    setPhase("playing");
  };

  const explodeShip = () => {
    const st = g.current;
    burst(st.particles, st.shipX, SHIP_Y, "#ffc896", 26, 240, 2.8);
    burst(st.particles, st.shipX, SHIP_Y, "#eef0ff", 16, 170);
    st.shakeUntil = st.now + 500;
    setPhase("over");
    saveBest(totalScore());
  };

  const destroyRock = (rock: Rock, reward: number) => {
    const st = g.current;
    burst(st.particles, rock.x, rock.y, "#9aa0c8", 10, 160, 2.4);
    if (reward) {
      st.bonus += reward;
      floatText(st.particles, rock.x, rock.y, `+${reward}`, "#ffd28a");
    }
  };

  const applyPick = (p: Pick) => {
    const st = g.current;
    const t = st.now;
    const { color, icon } = PICK_STYLE[p.type];
    burst(st.particles, p.x, p.y, color, 12, 150);
    if (p.type === "shield") {
      st.shield = true;
      floatText(st.particles, p.x, p.y - 10, `${icon} KHIÊN`, color);
    } else if (p.type === "slow") {
      st.slowUntil = t + 3500;
      floatText(st.particles, p.x, p.y - 10, `${icon} SLOW`, color);
    } else if (p.type === "star") {
      st.bonus += 5;
      floatText(st.particles, p.x, p.y - 10, "+5", color);
    } else {
      // Bom: dọn sạch màn hình, mỗi thiên thạch +1 điểm
      st.shakeUntil = t + 350;
      floatText(st.particles, p.x, p.y - 10, "💥 BOOM", color);
      for (const rock of st.rocks) destroyRock(rock, 1);
      st.rocks = [];
    }
  };

  const update = (dt: number) => {
    const st = g.current;
    const t = st.now;
    const s = dt / 1000;
    st.elapsed += s;
    const sec = Math.floor(st.elapsed);
    setSecs((p) => (p === sec ? p : sec));
    const total = totalScore();
    setScore((p) => (p === total ? p : total));

    // Lái: phím đẩy mục tiêu, phi thuyền bám mượt
    const dir = (st.keys.r ? 1 : 0) - (st.keys.l ? 1 : 0);
    if (dir) st.targetX += dir * 470 * s;
    st.targetX = Math.max(SHIP_R + 4, Math.min(VW - SHIP_R - 4, st.targetX));
    st.shipX += (st.targetX - st.shipX) * Math.min(1, s * 14);

    const slow = st.slowUntil > t ? 0.45 : 1;

    // Sinh thiên thạch — nhịp nhanh dần
    st.spawnIn -= dt;
    if (st.spawnIn <= 0) {
      st.spawnIn = Math.max(190, 700 - st.elapsed * 17);
      const r = 8 + Math.random() * 14;
      st.rocks.push({
        x: r + Math.random() * (VW - r * 2),
        y: -r - 6,
        r,
        vy: (125 + Math.random() * 115) * (1 + st.elapsed * 0.015),
        vx: (Math.random() - 0.5) * 44,
        spin: Math.random() * Math.PI * 2,
      });
    }

    // Sinh pickup mỗi 5–9s
    st.pickIn -= dt;
    if (st.pickIn <= 0) {
      st.pickIn = 5000 + Math.random() * 4000;
      const types: PickType[] = ["shield", "slow", "bomb", "star"];
      st.picks.push({
        x: 24 + Math.random() * (VW - 48),
        y: -16,
        vy: 105,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }

    // Thiên thạch: di chuyển + va chạm
    let dead = false;
    for (const rock of st.rocks) {
      rock.y += rock.vy * s * slow;
      rock.x += rock.vx * s * slow;
      if (Math.hypot(rock.x - st.shipX, rock.y - SHIP_Y) < rock.r + SHIP_R * 0.82) {
        if (st.shield) {
          st.shield = false;
          destroyRock(rock, 0);
          rock.y = VH + 999; // loại viên này
          st.shakeUntil = t + 250;
          floatText(st.particles, st.shipX, SHIP_Y - 22, "🛡 ĐỠ ĐƯỢC!", PICK_STYLE.shield.color);
        } else {
          dead = true;
          break;
        }
      }
    }
    if (dead) {
      explodeShip();
      return;
    }
    st.rocks = st.rocks.filter((rock) => rock.y < VH + rock.r + 30);

    // Pickup: rơi + nhặt
    for (const p of st.picks) p.y += p.vy * s;
    st.picks = st.picks.filter((p) => {
      if (Math.hypot(p.x - st.shipX, p.y - SHIP_Y) < 16 + SHIP_R) {
        applyPick(p);
        return false;
      }
      return p.y < VH + 20;
    });
  };

  useRaf((t, dt) => {
    const st = g.current;
    st.now = t;
    const playing = phaseRef.current === "playing" && !pausedRef.current;
    if (playing) {
      update(dt);
      const cur = `${st.shield ? "🛡 " : ""}${st.slowUntil > t ? "🐢 " : ""}`.trim();
      setFx((p) => (p === cur ? p : cur));
    }
    st.particles = stepParticles(st.particles, dt);

    const ctx = ctx2d(canvasRef.current, VW, VH);
    if (!ctx) return;
    const [sx, sy] = shakeOffset(t, st.shakeUntil, 7);
    ctx.translate(sx, sy);

    // Sao nền trôi chậm
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (const star of st.stars) {
      if (playing) {
        star.y += star.v * (dt / 1000);
        if (star.y > VH) {
          star.y = -2;
          star.x = Math.random() * VW;
        }
      }
      ctx.globalAlpha = 0.22 + 0.3 * Math.abs(Math.sin(t / 900 + star.x));
      ctx.fillRect(star.x, star.y, star.s, star.s);
    }
    ctx.globalAlpha = 1;

    // Thiên thạch
    for (const rock of st.rocks) {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.rotate(rock.spin + t / 1400);
      ctx.shadowColor = "rgba(150,156,215,0.5)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(122,127,168,0.92)";
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const rr = rock.r * (0.82 + 0.18 * Math.sin(i * 2.7 + rock.r));
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(40,42,64,0.55)";
      ctx.beginPath();
      ctx.arc(-rock.r * 0.25, rock.r * 0.15, rock.r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Pickup
    for (const p of st.picks) {
      const { color, icon } = PICK_STYLE[p.type];
      const bob = Math.sin(t / 180 + p.x) * 2;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(8,8,16,0.85)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, p.x, p.y + bob + 0.5);
      ctx.restore();
    }

    // Phi thuyền — tam giác neon + lửa đuôi + vòng khiên
    if (phaseRef.current !== "over") {
      const x = st.shipX;
      const flame = 7 + 4 * Math.sin(t / 70);
      ctx.save();
      ctx.shadowColor = "rgba(255,180,120,0.85)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(255,196,130,0.9)";
      ctx.beginPath();
      ctx.moveTo(x - 4, SHIP_Y + 9);
      ctx.lineTo(x + 4, SHIP_Y + 9);
      ctx.lineTo(x, SHIP_Y + 9 + flame);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(207,212,255,0.9)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#eef0ff";
      ctx.beginPath();
      ctx.moveTo(x, SHIP_Y - 13);
      ctx.lineTo(x - 9.5, SHIP_Y + 9);
      ctx.lineTo(x + 9.5, SHIP_Y + 9);
      ctx.closePath();
      ctx.fill();
      if (st.shield) {
        ctx.strokeStyle = PICK_STYLE.shield.color;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t / 160);
        ctx.beginPath();
        ctx.arc(x, SHIP_Y - 1, SHIP_R * 2.1, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawParticles(ctx, st.particles);

    // Viền tím khi slow-mo
    if (st.slowUntil > t) {
      ctx.save();
      ctx.strokeStyle = PICK_STYLE.slow.color;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t / 180);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, VW - 2, VH - 2);
      ctx.restore();
    }
  });

  // Chuột / chạm lái phi thuyền
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    g.current.targetX = ((e.clientX - rect.left) / rect.width) * VW;
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
            ☄️ Star <span className="text-shine">Dodger</span>
          </>
        }
        chips={
          <>
            {fx && <span className={CHIP_CLS}>{fx}</span>}
            <span className={CHIP_CLS}>
              Điểm <span className="font-display ml-1 font-semibold text-white">{score}</span>
            </span>
            <span className={CHIP_CLS}>
              Sống sót <span className="font-display ml-1 font-semibold text-white">{secs}s</span>
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
                    {score > 0 && score >= best ? "Kỷ lục mới! 🏆" : "Nổ tung! 💥"}
                  </div>
                  <div className="text-[14px] text-fog">
                    <span className="font-semibold text-white">{score}</span> điểm — sống sót{" "}
                    <span className="font-semibold text-white">{secs} giây</span>
                  </div>
                </>
              ) : paused ? (
                <div className="font-display text-2xl font-bold">Tạm dừng</div>
              ) : (
                <>
                  <div className="font-display text-2xl font-bold">
                    Star <span className="text-shine">Dodger</span>
                  </div>
                  <div className="max-w-[28rem] text-[13px] leading-relaxed text-fog">
                    Di <span className="text-white">chuột</span> / kéo ngón tay hoặc{" "}
                    <span className="text-white">←→</span> để lái · <span className="text-white">Space</span>{" "}
                    tạm dừng. Nhặt đồ tiếp tế:{" "}
                    <span style={{ color: PICK_STYLE.shield.color }}>🛡 khiên</span> ·{" "}
                    <span style={{ color: PICK_STYLE.slow.color }}>🐢 slow-mo</span> ·{" "}
                    <span style={{ color: PICK_STYLE.bomb.color }}>💣 bom dọn màn</span> ·{" "}
                    <span style={{ color: PICK_STYLE.star.color }}>★ +5 điểm</span>
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
