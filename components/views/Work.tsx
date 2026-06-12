"use client";

import { motion } from "motion/react";
import SmoothScroll from "@/components/SmoothScroll";
import { ArrowUpRight } from "lucide-react";
import { rise, stagger } from "@/lib/views";

const PROJECTS = [
  {
    name: "Nebula Analytics",
    desc: "Dashboard real-time cho SaaS — 40k events/giây, render 60fps.",
    tags: ["Next.js", "WebGL", "tRPC"],
    hue: "from-indigo-500/25",
  },
  {
    name: "Lumen Commerce",
    desc: "Headless storefront với chuyển trang shared-layout mượt như app native.",
    tags: ["Remix", "Shopify", "Motion"],
    hue: "from-violet-500/25",
  },
  {
    name: "Echo Voice AI",
    desc: "Giao diện hội thoại giọng nói — waveform canvas phản hồi theo âm lượng.",
    tags: ["React", "Web Audio", "Canvas"],
    hue: "from-sky-500/25",
  },
  {
    name: "Atlas Design System",
    desc: "Hệ thống 90+ components, token hoá toàn bộ, dùng bởi 6 product teams.",
    tags: ["Storybook", "Radix", "Tokens"],
    hue: "from-fuchsia-500/25",
  },
];

export default function Work() {
  return (
    <SmoothScroll contentClassName="px-8 py-10 md:px-14">
      <motion.div variants={stagger} initial="initial" animate="enter">
        <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
          Selected work
        </motion.p>
        <motion.h2 variants={rise} className="font-display mt-2 text-4xl font-bold tracking-tight">
          Dự án <span className="text-shine">tiêu biểu</span>
        </motion.h2>

        <div className="mt-8 grid grid-cols-1 gap-5 pb-10 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <motion.a
              key={p.name}
              variants={rise}
              href="#"
              className="group relative overflow-hidden rounded-2xl border border-line-soft bg-white/[0.025] p-6 transition-colors duration-500 hover:border-line"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${p.hue} to-transparent opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100`}
              />
              <div className="flex items-start justify-between">
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:border-white/40 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-fog">{p.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-line-soft px-3 py-1 text-[11.5px] text-white/55"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </SmoothScroll>
  );
}
