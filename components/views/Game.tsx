"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { rise, stagger } from "@/lib/views";

/**
 * Neon Snake — rắn săn mồi phong cách neon, chơi ngay trong màn hình MacBook.
 * Điều khiển: ←↑↓→ / WASD, Space tạm dừng, Enter bắt đầu. Mobile: vuốt trên canvas.
 * Tường wrap-around (xuyên tường qua cạnh đối diện), tốc độ tăng dần theo điểm.
 */

const COLS = 24;
const ROWS = 16;
const BASE_TICK = 150; // ms mỗi bước lúc đầu
const MIN_TICK = 70;
const BEST_KEY = "dane-snake-best";

type Pt = { x: number; y: number };
type Phase = "idle" | "playing" | "over";

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

function randFood(snake: Pt[]): Pt {
  while (true) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

export default function Game() {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStart = useRef<Pt | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  // Trạng thái game nằm trong ref để vòng lặp raf không bị stale/re-render mỗi tick
  const g = useRef({
    snake: [] as Pt[],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 14, y: 8 },
    tick: BASE_TICK,
    acc: 0,
    last: 0,
    score: 0,
  });
  const phaseRef = useRef<Phase>("idle");
  const pausedRef = useRef(false);
  phaseRef.current = phase;
  pausedRef.current = paused;

  useEffect(() => {
    setBest(Number(localStorage.getItem(BEST_KEY) || 0));
  }, []);

  const start = () => {
    const mid = Math.floor(ROWS / 2);
    g.current.snake = [
      { x: 8, y: mid },
      { x: 7, y: mid },
      { x: 6, y: mid },
    ];
    g.current.dir = { x: 1, y: 0 };
    g.current.next = { x: 1, y: 0 };
    g.current.food = randFood(g.current.snake);
    g.current.tick = BASE_TICK;
    g.current.acc = 0;
    g.current.score = 0;
    setScore(0);
    setPaused(false);
    setPhase("playing");
  };

  const gameOver = () => {
    setPhase("over");
    setBest((b) => {
      const nb = Math.max(b, g.current.score);
      localStorage.setItem(BEST_KEY, String(nb));
      return nb;
    });
  };

  const steer = (d: Pt) => {
    const cur = g.current.dir;
    if (d.x === -cur.x && d.y === -cur.y) return; // không cho quay đầu 180°
    g.current.next = d;
  };

  const stepOnce = () => {
    const st = g.current;
    st.dir = st.next;
    const head = {
      x: (st.snake[0].x + st.dir.x + COLS) % COLS,
      y: (st.snake[0].y + st.dir.y + ROWS) % ROWS,
    };
    if (st.snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }
    st.snake.unshift(head);
    if (head.x === st.food.x && head.y === st.food.y) {
      st.score += 1;
      setScore(st.score);
      st.tick = Math.max(MIN_TICK, BASE_TICK - st.score * 4);
      st.food = randFood(st.snake);
    } else {
      st.snake.pop();
    }
  };

  // Canvas tự khớp kích thước: vừa bề rộng lẫn chiều cao vùng chơi, giữ tỉ lệ lưới
  useEffect(() => {
    const area = areaRef.current!;
    const frame = frameRef.current!;
    const cv = canvasRef.current!;
    const ro = new ResizeObserver(() => {
      const w = Math.max(220, Math.min(area.clientWidth, area.clientHeight * (COLS / ROWS), 680));
      const h = (w * ROWS) / COLS;
      const dpr = window.devicePixelRatio || 1;
      frame.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    });
    ro.observe(area);
    return () => ro.disconnect();
  }, []);

  // Vòng lặp game + vẽ
  useEffect(() => {
    let raf = 0;
    const draw = (t: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = cv.width / dpr;
      const h = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cell = w / COLS;
      const st = g.current;

      // Chấm lưới mờ
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          ctx.fillRect(x * cell + cell / 2 - 0.5, y * cell + cell / 2 - 0.5, 1, 1);
        }
      }

      // Mồi — chấm sáng đập nhịp
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

      // Rắn — mờ dần về đuôi, đầu phát sáng
      st.snake.forEach((s, i) => {
        const alpha = 1 - (i / Math.max(st.snake.length - 1, 1)) * 0.68;
        const pad = cell * 0.12;
        const x = s.x * cell + pad;
        const y = s.y * cell + pad;
        const sz = cell - pad * 2;
        ctx.save();
        if (i === 0) {
          ctx.shadowColor = "rgba(180,188,255,0.85)";
          ctx.shadowBlur = 18;
        }
        ctx.fillStyle = `rgba(226,230,255,${alpha})`;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, sz, sz, cell * 0.24);
        else ctx.rect(x, y, sz, sz);
        ctx.fill();
        ctx.restore();
      });
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const st = g.current;
      const dt = st.last ? Math.min(t - st.last, 200) : 0;
      st.last = t;
      if (phaseRef.current === "playing" && !pausedRef.current) {
        st.acc += dt;
        while (st.acc >= st.tick && phaseRef.current === "playing") {
          st.acc -= st.tick;
          stepOnce();
        }
      }
      draw(t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return; // chạm nhẹ, không phải vuốt
    steer(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  };

  const chip = "rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5";

  return (
    <div className="flex h-full flex-col px-8 py-7 md:px-14">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="enter"
        className="flex min-h-0 flex-1 flex-col"
      >
        <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
          Playground
        </motion.p>

        <motion.div variants={rise} className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(1.3rem,3.2cqw,2.25rem)] font-bold tracking-tight">
            Neon <span className="text-shine">Snake</span>
          </h2>
          <div className="flex gap-2.5 text-[12.5px] text-white/70">
            <span className={chip}>
              Điểm <span className="font-display ml-1 font-semibold text-white">{score}</span>
            </span>
            <span className={chip}>
              Kỷ lục <span className="font-display ml-1 font-semibold text-glow">{best}</span>
            </span>
          </div>
        </motion.div>

        {/* Vùng chơi — canvas tự co theo không gian còn lại */}
        <motion.div
          variants={rise}
          ref={areaRef}
          className="mt-4 flex min-h-0 flex-1 items-center justify-center"
        >
          <div ref={frameRef} className="relative">
            <canvas
              ref={canvasRef}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className="block w-full rounded-2xl border border-line-soft bg-black/40 [touch-action:none]"
            />

            {/* Overlay: bắt đầu / tạm dừng / game over */}
            {(phase !== "playing" || paused) && (
              <div
                className="absolute inset-0 z-10 grid cursor-pointer place-items-center rounded-2xl bg-black/55 backdrop-blur-[3px]"
                onClick={() => (paused && phase === "playing" ? setPaused(false) : start())}
              >
                <div className="flex flex-col items-center gap-4 px-6 text-center">
                  {phase === "over" ? (
                    <>
                      <div className="font-display text-2xl font-bold">
                        {score > 0 && score >= best ? "Kỷ lục mới! 🏆" : "Game over"}
                      </div>
                      <div className="text-[14px] text-fog">
                        Bạn ăn được{" "}
                        <span className="font-semibold text-white">{score}</span> mồi
                      </div>
                    </>
                  ) : paused ? (
                    <div className="font-display text-2xl font-bold">Tạm dừng</div>
                  ) : (
                    <>
                      <div className="font-display text-2xl font-bold">
                        Neon <span className="text-shine">Snake</span>
                      </div>
                      <div className="max-w-[26rem] text-[13px] leading-relaxed text-fog">
                        Dùng <span className="text-white">←↑↓→</span> hoặc{" "}
                        <span className="text-white">WASD</span> để lái ·{" "}
                        <span className="text-white">Space</span> tạm dừng · trên mobile thì
                        vuốt theo hướng muốn đi. Rắn xuyên tường được, nhưng đừng tự cắn mình!
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => (paused && phase === "playing" ? setPaused(false) : start())}
                    className="rounded-full bg-white px-6 py-2.5 text-[13.5px] font-medium text-black transition-transform hover:scale-105 active:scale-95"
                  >
                    {phase === "over" ? "Chơi lại" : paused ? "Tiếp tục" : "Bắt đầu"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
