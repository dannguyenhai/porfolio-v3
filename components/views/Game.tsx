"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { rise, stagger } from "@/lib/views";
import SmoothScroll from "@/components/SmoothScroll";
import Snake from "@/components/games/Snake";
import Breakout from "@/components/games/Breakout";
import Dodger from "@/components/games/Dodger";
import Birds from "@/components/games/Birds";

/**
 * Neon Arcade — chọn game từ menu card, game mở full màn hình MacBook
 * (có nút tạm dừng + đóng ở thanh trên).
 */

const GAMES = [
  {
    id: "snake",
    icon: "🐍",
    name: "Neon Snake",
    desc: "Rắn săn mồi tốc độ tăng dần. Săn kim cương vàng +5, khiên xuyên thân và slow-mo trước khi chúng biến mất.",
    bestKey: "dane-snake-best",
    bestUnit: "điểm",
  },
  {
    id: "breakout",
    icon: "🧱",
    name: "Neon Breakout",
    desc: "Phá gạch lên màn vô tận. Hứng power-up rơi: thanh đỡ rộng, multi-ball, bóng lửa xuyên gạch và +1 mạng.",
    bestKey: "dane-breakout-best",
    bestUnit: "điểm",
  },
  {
    id: "dodger",
    icon: "☄️",
    name: "Star Dodger",
    desc: "Lái phi thuyền né bão thiên thạch ngày càng dày. Nhặt khiên, slow-mo, bom dọn màn hình và sao điểm thưởng.",
    bestKey: "dane-dodger-best",
    bestUnit: "điểm",
  },
  {
    id: "birds",
    icon: "🐦",
    name: "Bird Sort",
    desc: "Giải đố xếp đàn chim cùng màu về chung một cành. Chim chỉ đậu cạnh bạn cùng màu hoặc cành trống — càng lên màn càng nhiều màu.",
    bestKey: "dane-birds-best",
    bestUnit: "màn",
  },
] as const;

type GameId = (typeof GAMES)[number]["id"];

export default function Game() {
  const [active, setActive] = useState<GameId | null>(null);
  const [bests, setBests] = useState<Record<string, number>>({});

  // Đọc lại kỷ lục mỗi khi quay về menu
  useEffect(() => {
    if (active !== null) return;
    const next: Record<string, number> = {};
    for (const game of GAMES) next[game.id] = Number(localStorage.getItem(game.bestKey) || 0);
    setBests(next);
  }, [active]);

  const close = () => setActive(null);

  return (
    <>
      <SmoothScroll contentClassName="px-8 py-10 md:px-14">
        <motion.div variants={stagger} initial="initial" animate="enter">
          <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
            Playground
          </motion.p>
          <motion.h2
            variants={rise}
            className="font-display mt-2 text-4xl font-bold tracking-tight"
          >
            Neon <span className="text-shine">Arcade</span>
          </motion.h2>
          <motion.p variants={rise} className="mt-3 max-w-[34rem] text-[14px] leading-relaxed text-fog">
            Giải lao một chút — 3 game mini mình code bằng canvas, chơi full màn hình ngay
            trong chiếc MacBook này. Có power-up, kỷ lục và đủ kịch tính đấy!
          </motion.p>

          <div className="mt-8 grid grid-cols-1 gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-4">
            {GAMES.map((game) => (
              <motion.button
                key={game.id}
                variants={rise}
                onClick={() => setActive(game.id)}
                className="group flex flex-col rounded-2xl border border-line-soft bg-white/[0.025] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05] hover:shadow-[0_18px_50px_-18px_rgba(150,156,255,0.35)]"
              >
                <div className="text-4xl transition-transform duration-300 group-hover:scale-110">
                  {game.icon}
                </div>
                <div className="font-display mt-4 text-lg font-semibold">{game.name}</div>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-fog">{game.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[12px] text-white/45">
                    Kỷ lục:{" "}
                    <span className="font-display font-semibold text-glow">
                      {bests[game.id] ?? 0}
                    </span>{" "}
                    {game.bestUnit}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-medium text-black transition-transform duration-300 group-hover:scale-105">
                    <Play className="h-3.5 w-3.5" />
                    Chơi
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </SmoothScroll>

      {/* Game đang mở — full màn hình MacBook qua portal */}
      {active === "snake" && <Snake onClose={close} />}
      {active === "breakout" && <Breakout onClose={close} />}
      {active === "dodger" && <Dodger onClose={close} />}
      {active === "birds" && <Birds onClose={close} />}
    </>
  );
}
