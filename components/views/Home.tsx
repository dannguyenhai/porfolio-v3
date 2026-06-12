"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import HeroVisual from "@/components/HeroVisual";
import { rise, stagger, type ViewId } from "@/lib/views";

export default function Home({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  return (
    <div className="relative grid h-full grid-cols-1 items-center gap-6 px-8 md:grid-cols-[1.05fr_1fr] md:px-14">
      {/* Text glow phía sau headline */}
      <div className="text-glow pointer-events-none absolute left-[6%] top-[34%] h-[40%] w-[34%]" />

      <motion.div variants={stagger} initial="initial" animate="enter" className="relative z-10">
        {/* Badge */}
        <motion.div
          variants={rise}
          className="mb-[clamp(12px,1.9cqw,24px)] inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] py-1.5 pl-1.5 pr-4 text-[12.5px] text-white/75"
        >
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-black">
            OPEN
          </span>
          Đang nhận dự án freelance mới
        </motion.div>

        {/* Headline — bố cục 2 dòng với chữ gradient như "Workflow" */}
        <motion.h1
          variants={rise}
          className="font-display text-[clamp(1.5rem,4.7cqw,4rem)] font-bold leading-[1.08] tracking-tight"
        >
          Biến Ý Tưởng Thành
          <br />
          <span className="text-shine">Sản Phẩm</span> Sống Động
        </motion.h1>

        <motion.p variants={rise} className="mt-[clamp(10px,1.6cqw,20px)] max-w-[30rem] text-[clamp(12.5px,1.25cqw,15px)] leading-relaxed text-fog">
          Mình là Minh — frontend engineer tập trung vào motion design và trải nghiệm
          tương tác. Mỗi pixel đều có lý do, mỗi chuyển động đều kể một câu chuyện.
        </motion.p>

        <motion.div variants={rise} className="mt-[clamp(16px,2.6cqw,32px)] flex items-center gap-4">
          <motion.button
            onClick={() => onNavigate("work")}
            className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Xem dự án
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
          <button
            onClick={() => onNavigate("about")}
            className="rounded-full border border-line px-6 py-3 text-[14px] text-white/80 transition-colors hover:border-white/35"
          >
            Về mình
          </button>
        </motion.div>

        {/* Số liệu nhỏ */}
        <motion.div variants={rise} className="mt-[clamp(18px,3.2cqw,40px)] flex gap-10 text-[13px] text-white/45">
          {[
            ["5+", "năm kinh nghiệm"],
            ["30+", "dự án hoàn thành"],
            ["12", "khách hàng dài hạn"],
          ].map(([n, label]) => (
            <div key={label}>
              <div className="font-display text-xl font-semibold text-white">{n}</div>
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="relative hidden h-full md:block">
        <HeroVisual />
      </div>
    </div>
  );
}
