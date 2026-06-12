"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Screen from "@/components/Screen";

/**
 * Toàn bộ portfolio sống bên trong chiếc MacBook này.
 * Trình tự intro: nắp máy mở ra (3D) → màn hình boot → site xuất hiện.
 * Di chuột quanh trang để thấy máy nghiêng theo (parallax tilt).
 */
export default function Macbook() {
  const [opened, setOpened] = useState(false);
  const [booted, setBooted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setOpened(true), 500);
    const t2 = setTimeout(() => setBooted(true), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Màn nhỏ: bỏ khung MacBook, site hiển thị toàn màn hình
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Parallax tilt theo chuột
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [2.6, -2.6]), { stiffness: 110, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-3.4, 3.4]), { stiffness: 110, damping: 20 });

  const onMove = (e: React.MouseEvent) => {
    mx.set(e.clientX / window.innerWidth);
    my.set(e.clientY / window.innerHeight);
  };

  if (isMobile) {
    return (
      <div className="h-dvh w-full overflow-hidden">
        <Screen booted={booted} />
      </div>
    );
  }

  return (
    <div
      className="grid h-dvh w-full place-items-center overflow-hidden [perspective:2200px]"
      onMouseMove={onMove}
    >
      {/* Hào quang phía sau máy — đủ sáng để tách máy khỏi nền đen */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[84vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(124,128,210,0.26),rgba(90,94,170,0.1)_55%,transparent_75%)] blur-3xl" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[min(92vw,1240px,124dvh)]"
      >
        {/* ── Nắp máy / Màn hình — viền nhôm 2px kiểu MacBook Pro ── */}
        <motion.div
          className="relative origin-bottom rounded-[clamp(14px,1.8vw,26px)] bg-gradient-to-b from-[#f4f5f8] via-[#c4c7cf] to-[#8e919c] p-[2px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.95),0_0_100px_-16px_rgba(130,134,215,0.3)]"
          initial={{ rotateX: -89 }}
          animate={{ rotateX: opened ? 0 : -89 }}
          transition={{ duration: 1.7, ease: [0.32, 0.9, 0.25, 1] }}
        >
          {/* Bezel đen: mỏng 3 cạnh, cạnh dưới là "cằm" đen dày như MacBook Pro thật */}
          <div className="relative rounded-[clamp(13px,1.7vw,24px)] bg-[#050507] p-[clamp(4px,0.5vw,8px)] pb-[clamp(18px,2.3vw,34px)]">
            {/* Notch — tai thỏ giữa cạnh trên */}
            <div className="absolute left-1/2 top-[clamp(4px,0.5vw,8px)] z-40 flex h-[clamp(10px,1.2vw,18px)] w-[11%] -translate-x-1/2 items-end justify-center rounded-b-[10px] bg-black">
              <span className="mb-[3px] block h-[5px] w-[5px] rounded-full bg-[#161c2c] ring-1 ring-[#2a3148]" />
            </div>

            {/* Màn hình */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[clamp(6px,0.8vw,12px)] bg-black">
              <Screen booted={booted} />
              {/* Ánh phản chiếu mặt kính */}
              <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.02)_28%,transparent_42%)]" />
            </div>
          </div>
        </motion.div>

        {/* ── Đế máy — nhôm bạc, rộng và dày như MacBook Pro ── */}
        <div className="relative z-10 mx-[-4.5%] mt-[2px]">
          {/* Thân đế */}
          <div className="relative h-[clamp(20px,2.7vw,38px)] w-full rounded-[12px_12px_26px_26px] bg-gradient-to-b from-[#fafbfd] via-[#d3d5dc] to-[#8b8e99] shadow-[0_34px_70px_-14px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.95)]">
            {/* Rãnh mở máy (lõm giữa) */}
            <div className="absolute left-1/2 top-0 h-[42%] w-[12%] -translate-x-1/2 rounded-b-[14px] bg-gradient-to-b from-[#7d808b] via-[#a7aab4] to-[#cfd1d8] shadow-[inset_0_2px_3px_rgba(0,0,0,0.35)]" />
            {/* Đường gân tối phía dưới đế */}
            <div className="absolute inset-x-0 bottom-0 h-[34%] rounded-b-[26px] bg-gradient-to-b from-transparent to-[rgba(40,42,52,0.6)]" />
            {/* Chân đế hai bên */}
            <div className="absolute bottom-[-4px] left-[6%] h-[5px] w-[7%] rounded-b-[4px] bg-[#3c3e48]" />
            <div className="absolute bottom-[-4px] right-[6%] h-[5px] w-[7%] rounded-b-[4px] bg-[#3c3e48]" />
          </div>
          {/* Bóng phản chiếu dưới máy */}
          <div className="mx-auto mt-3.5 h-7 w-[90%] rounded-[100%] bg-black/75 blur-xl" />
        </div>
      </motion.div>

    </div>
  );
}
