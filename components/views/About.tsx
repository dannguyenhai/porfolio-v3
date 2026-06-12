"use client";

import { motion } from "motion/react";
import SmoothScroll from "@/components/SmoothScroll";
import { rise, stagger } from "@/lib/views";

const TIMELINE = [
  { year: "2026", role: "Senior Frontend Engineer · Freelance", note: "Motion-first products cho startup AI & SaaS." },
  { year: "2023", role: "Frontend Lead · Studio X", note: "Dẫn team 5 người, ship 3 sản phẩm đạt giải Awwwards Honors." },
  { year: "2021", role: "UI Engineer · Fintech Y", note: "Xây design system đầu tiên, giảm 40% thời gian build UI." },
];

export default function About() {
  return (
    <SmoothScroll contentClassName="px-8 py-10 md:px-14">
      <motion.div
        variants={stagger}
        initial="initial"
        animate="enter"
        className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.2fr]"
      >
        <div>
          <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
            About
          </motion.p>
          <motion.h2 variants={rise} className="font-display mt-2 text-4xl font-bold tracking-tight">
            Code là <span className="text-shine">chất liệu</span>,
            <br />
            chuyển động là ngôn ngữ
          </motion.h2>
          <motion.p variants={rise} className="mt-5 text-[15px] leading-relaxed text-fog">
            Mình tin giao diện tốt không chỉ hiển thị thông tin — nó phản hồi, thở và dẫn
            dắt. 5 năm qua mình làm việc ở giao điểm giữa engineering và design: từ
            design system cho fintech đến trải nghiệm 3D cho thương hiệu.
          </motion.p>
          <motion.p variants={rise} className="mt-4 text-[15px] leading-relaxed text-fog">
            Ngoài code, mình viết về motion design trên blog và mentor cho các bạn
            frontend mới vào nghề.
          </motion.p>
        </div>

        <div className="relative pb-10">
          <div className="absolute bottom-10 left-[7px] top-1 w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
          <div className="space-y-8">
            {TIMELINE.map((t) => (
              <motion.div key={t.year} variants={rise} className="relative pl-8">
                <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border border-white/40 bg-space shadow-[0_0_12px_rgba(207,212,255,0.35)]" />
                <div className="text-[12px] tracking-widest text-white/40">{t.year}</div>
                <div className="font-display mt-1 text-lg font-semibold">{t.role}</div>
                <div className="mt-1 text-[14px] text-fog">{t.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SmoothScroll>
  );
}
