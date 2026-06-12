"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info, RotateCcw, Shuffle } from "lucide-react";
import { CHIP_CLS, FullScreen, TopBar, commitBest, useBest } from "./arcade";

/**
 * Bird Sort — xếp những chú chim cùng màu về chung một cành.
 * Chim chỉ bay được sang cành trống hoặc cành có chim ngoài cùng CÙNG MÀU,
 * mỗi lần bay cả cụm cùng màu liền kề ở đầu cành sẽ bay theo (nếu đủ chỗ).
 * Mỗi cành đậu tối đa 4 con. Đủ 4 con cùng màu trên mọi cành là qua màn.
 */

const CAP = 4;
const LEVEL_KEY = "dane-birds-level";
const BEST_KEY = "dane-birds-best";

const COLORS = [
  { body: "#ff6b6b", wing: "#d94f4f", name: "đỏ" },
  { body: "#ffd93d", wing: "#dbb52a", name: "vàng" },
  { body: "#6bc5ff", wing: "#4d9fd6", name: "xanh dương" },
  { body: "#6bdb8a", wing: "#4cb86d", name: "xanh lá" },
  { body: "#c39bff", wing: "#9f76dd", name: "tím" },
  { body: "#ffa75e", wing: "#dd8743", name: "cam" },
  { body: "#ff9bd2", wing: "#dd77b1", name: "hồng" },
];

type Bird = { id: number; color: number };
type Branches = Bird[][];

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isSolved(branches: Branches): boolean {
  return branches.every(
    (b) => b.length === 0 || (b.length === CAP && b.every((x) => x.color === b[0].color)),
  );
}

function genLevel(level: number): Branches {
  const colorCount = Math.min(2 + level, COLORS.length);
  while (true) {
    let id = 0;
    const birds: Bird[] = [];
    for (let c = 0; c < colorCount; c++)
      for (let k = 0; k < CAP; k++) birds.push({ id: id++, color: c });
    shuffle(birds);
    const branches: Branches = [];
    for (let i = 0; i < colorCount; i++) branches.push(birds.slice(i * CAP, (i + 1) * CAP));
    branches.push([], []); // 2 cành trống
    if (!isSolved(branches)) return branches;
  }
}

/** Cụm chim cùng màu liền kề ở đầu (ngọn) cành — đây là cụm sẽ bay đi. */
function flockSize(branch: Bird[]): number {
  if (!branch.length) return 0;
  const color = branch[branch.length - 1].color;
  let n = 0;
  for (let i = branch.length - 1; i >= 0 && branch[i].color === color; i--) n++;
  return n;
}

/** Chú chim hoạt hình nhỏ — thân tròn, cánh, mỏ, mắt. */
function BirdSvg({ color, flip }: { color: number; flip?: boolean }) {
  const c = COLORS[color];
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      {/* đuôi */}
      <path d="M9 26 L1 20 L7 30 Z" fill={c.wing} />
      {/* thân */}
      <ellipse cx="21" cy="24" rx="13" ry="11.5" fill={c.body} />
      {/* bụng sáng */}
      <ellipse cx="23" cy="28" rx="8" ry="6" fill="rgba(255,255,255,0.28)" />
      {/* cánh */}
      <path d="M12 22 q6 -4 12 0 q-5 8 -12 4 Z" fill={c.wing} />
      {/* mắt */}
      <circle cx="28" cy="18" r="3.4" fill="#fff" />
      <circle cx="29" cy="18.4" r="1.7" fill="#1b1b28" />
      {/* mỏ */}
      <path d="M33 21 L39 23 L33 25 Z" fill="#ffb13d" />
      {/* chân */}
      <path d="M18 35 v4 M24 35 v4" stroke="#b07a2e" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Birds({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState(1);
  const [branches, setBranches] = useState<Branches>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [ready, setReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [best, saveBest] = useBest(BEST_KEY);
  const history = useRef<Branches[]>([]);
  const levelRef = useRef(1);
  levelRef.current = level;

  const setup = (lv: number) => {
    setBranches(genLevel(lv));
    setSelected(null);
    setMoves(0);
    setWon(false);
    history.current = [];
  };

  // Mở game: chơi tiếp màn đang dở từ lần trước
  useEffect(() => {
    const saved = Math.max(1, Number(localStorage.getItem(LEVEL_KEY) || 1));
    setLevel(saved);
    setup(saved);
    setReady(true);
  }, []);

  // Đóng giữa chừng vẫn giữ kỷ lục màn cao nhất đã hoàn thành
  useEffect(() => {
    return () => commitBest(BEST_KEY, levelRef.current - 1);
  }, []);

  const clickBranch = (i: number) => {
    if (won) return;
    setShowHelp(false);
    const cur = branches;
    if (selected === null) {
      if (cur[i].length) setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }

    const from = cur[selected];
    const to = cur[i];
    const flock = flockSize(from);
    const color = from[from.length - 1]?.color;
    const canLand = to.length === 0 || to[to.length - 1].color === color;
    const space = CAP - to.length;

    if (!from.length || !canLand || space <= 0) {
      // Không đậu được — coi như chọn lại cành khác
      setSelected(cur[i].length ? i : null);
      return;
    }

    const k = Math.min(flock, space);
    history.current.push(cur.map((b) => [...b]));
    const next = cur.map((b) => [...b]);
    const flying = next[selected].splice(next[selected].length - k, k);
    next[i].push(...flying.reverse());
    setBranches(next);
    setSelected(null);
    setMoves((m) => m + 1);

    if (isSolved(next)) {
      setWon(true);
      saveBest(level);
      localStorage.setItem(LEVEL_KEY, String(level + 1));
    }
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setBranches(prev);
    setSelected(null);
    setMoves((m) => m + 1);
  };

  const nextLevel = () => {
    const lv = level + 1;
    setLevel(lv);
    setup(lv);
  };

  // Chia cành 2 bên: trái / phải xen kẽ
  const left: number[] = [];
  const right: number[] = [];
  branches.forEach((_, i) => (i % 2 === 0 ? left : right).push(i));

  // Cành bám vào thân cây phía ngoài, ngọn (có lá) hướng vào giữa màn
  const renderBranch = (i: number, side: "left" | "right") => {
    const branch = branches[i];
    const isSel = selected === i;
    const flock = isSel ? flockSize(branch) : 0;
    const full = branch.length === CAP && branch.every((b) => b.color === branch[0].color);
    return (
      <button
        key={i}
        onClick={() => clickBranch(i)}
        aria-label={`Cành ${i + 1}`}
        data-colors={branch.map((b) => b.color).join(",")}
        className="group relative h-[clamp(46px,7dvh,64px)] w-full outline-none"
      >
        {/* Thanh cành cây */}
        <div
          className={`absolute bottom-0 h-[7px] w-full bg-gradient-to-b from-[#8a5a36] to-[#54341d] shadow-[0_3px_6px_rgba(0,0,0,0.5)] transition-all duration-300 ${
            side === "left" ? "rounded-r-full" : "rounded-l-full"
          } ${isSel ? "ring-1 ring-white/40" : ""} ${full ? "ring-1 ring-[#6bdb8a]/70" : ""}`}
        />
        {/* Lá ở ngọn cành (đầu hướng vào giữa) */}
        <div
          className={`absolute bottom-[2px] h-3 w-5 rounded-full bg-[#3f7d4e] ${
            side === "left" ? "right-[-4px] rotate-[20deg]" : "left-[-4px] -rotate-[20deg]"
          }`}
        />
        {/* Chim đậu trên cành — phần tử 0 sát gốc (phía thân), ngọn hướng vào giữa */}
        <div
          className={`absolute bottom-[5px] flex w-full items-end gap-[2%] px-1 ${
            side === "left" ? "flex-row justify-start" : "flex-row-reverse justify-start"
          }`}
        >
          {branch.map((bird, j) => {
            const lifted = isSel && j >= branch.length - flock;
            return (
              <motion.div
                key={bird.id}
                layoutId={`bird-${bird.id}`}
                layout
                animate={{ y: lifted ? -9 : 0, scale: lifted ? 1.08 : 1 }}
                transition={{
                  // Bay giữa các cành: chậm rãi, có chút lượn cho tự nhiên
                  layout: { type: "spring", stiffness: 130, damping: 17, mass: 1.05 },
                  // Nhún lên khi được chọn: vẫn nhạy
                  default: { type: "spring", stiffness: 480, damping: 26 },
                }}
                className="aspect-square w-[22%] max-w-[52px]"
              >
                {/* Chim quay mặt vào thân cây — hướng nó sẽ bay khi chuyển cành */}
                <BirdSvg color={bird.color} flip={side === "right"} />
              </motion.div>
            );
          })}
        </div>
      </button>
    );
  };

  return (
    <FullScreen>
      <TopBar
        title={
          <>
            🐦 Bird <span className="text-shine">Sort</span>
          </>
        }
        chips={
          <>
            <span className={CHIP_CLS}>
              Màn <span className="font-display ml-1 font-semibold text-white">{level}</span>
            </span>
            <span className={CHIP_CLS}>
              Bước <span className="font-display ml-1 font-semibold text-white">{moves}</span>
            </span>
            <span className={CHIP_CLS}>
              Kỷ lục <span className="font-display ml-1 font-semibold text-glow">màn {best}</span>
            </span>
          </>
        }
        paused={false}
        canPause={false}
        onPause={() => {}}
        onClose={onClose}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Hai cây hai bên, cành chĩa vào giữa — khoảng giữa thu hẹp */}
        <div className="relative mx-auto flex min-h-0 flex-1 items-stretch justify-center gap-[clamp(24px,3.5vw,52px)] px-4 py-4">
          {/* Cây trái: thân ngoài + cành */}
          <div className="flex items-center gap-[2px]">
            <div className="relative my-[6%] w-[clamp(12px,1.6vw,18px)] self-stretch rounded-full bg-gradient-to-r from-[#54341d] via-[#8a5a36] to-[#54341d] shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
              <div className="absolute -top-4 left-1/2 h-8 w-12 -translate-x-1/2 rounded-full bg-[#3f7d4e] shadow-[0_4px_14px_rgba(0,0,0,0.4)]" />
              <div className="absolute -top-1 left-[calc(50%+8px)] h-5 w-8 -translate-x-1/2 rounded-full bg-[#4d9560]" />
            </div>
            <div className="z-10 flex w-[clamp(168px,34vw,250px)] flex-col justify-center gap-[clamp(10px,2.2dvh,22px)]">
              {ready && left.map((i) => renderBranch(i, "left"))}
            </div>
          </div>
          {/* Cây phải: cành + thân ngoài */}
          <div className="flex items-center gap-[2px]">
            <div className="z-10 flex w-[clamp(168px,34vw,250px)] flex-col justify-center gap-[clamp(10px,2.2dvh,22px)]">
              {ready && right.map((i) => renderBranch(i, "right"))}
            </div>
            <div className="relative my-[6%] w-[clamp(12px,1.6vw,18px)] self-stretch rounded-full bg-gradient-to-r from-[#54341d] via-[#8a5a36] to-[#54341d] shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
              <div className="absolute -top-4 left-1/2 h-8 w-12 -translate-x-1/2 rounded-full bg-[#3f7d4e] shadow-[0_4px_14px_rgba(0,0,0,0.4)]" />
              <div className="absolute -top-1 left-[calc(50%-8px)] h-5 w-8 -translate-x-1/2 rounded-full bg-[#4d9560]" />
            </div>
          </div>
        </div>

        {/* Nút hoàn tác / xếp lại */}
        <div className="flex shrink-0 items-center justify-center gap-3 pb-4">
          <button
            onClick={undo}
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[12.5px] text-white/75 transition-colors hover:border-white/35 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Hoàn tác
          </button>
          <button
            onClick={() => setup(level)}
            className="flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[12.5px] text-white/75 transition-colors hover:border-white/35 hover:text-white"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Xếp lại màn
          </button>
        </div>

        {/* Nút (i) cách chơi — góc trên trái */}
        <div className="absolute left-4 top-3 z-20">
          <button
            onClick={() => setShowHelp((s) => !s)}
            aria-label="Cách chơi"
            className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
              showHelp
                ? "border-white/40 bg-white/10 text-white"
                : "border-line bg-black/45 text-white/65 hover:border-white/35 hover:text-white"
            }`}
          >
            <Info className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute left-0 top-11 w-[min(290px,72vw)] rounded-2xl border border-line bg-[#0c0c1a]/95 p-4 text-left shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md"
              >
                <div className="font-display text-[13.5px] font-semibold text-white">Cách chơi</div>
                <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-fog">
                  <li>🐦 Chạm một cành để chọn — cụm chim cùng màu ở ngọn sẽ nhún lên.</li>
                  <li>🌿 Chạm cành khác để đàn bay sang. Chỉ đậu được cạnh chim <span className="text-white">cùng màu</span> hoặc xuống cành trống.</li>
                  <li>🪺 Mỗi cành đậu tối đa 4 con. Gom đủ 4 con cùng màu trên mọi cành là qua màn!</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Thắng màn */}
        {won && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/55 backdrop-blur-[3px]">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="flex flex-col items-center gap-4 px-6 text-center"
            >
              <motion.div
                className="text-5xl"
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
              >
                🐦🎉
              </motion.div>
              <div className="font-display text-2xl font-bold">Hoàn thành màn {level}!</div>
              <div className="text-[14px] text-fog">
                Cả đàn về đúng tổ sau{" "}
                <span className="font-semibold text-white">{moves}</span> bước
              </div>
              <button
                onClick={nextLevel}
                className="rounded-full bg-white px-6 py-2.5 text-[13.5px] font-medium text-black transition-transform hover:scale-105 active:scale-95"
              >
                Màn {level + 1} →
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </FullScreen>
  );
}
