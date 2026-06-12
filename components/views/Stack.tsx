"use client";

import { motion } from "motion/react";
import SmoothScroll from "@/components/SmoothScroll";
import { rise, stagger } from "@/lib/views";

const GROUPS: { title: string; items: string[] }[] = [
  { title: "Core", items: ["TypeScript", "React 19", "Next.js 15", "Node.js"] },
  { title: "Motion & 3D", items: ["Motion (Framer)", "GSAP", "Three.js / R3F", "Lenis"] },
  { title: "Styling", items: ["Tailwind CSS v4", "CSS Houdini", "Radix UI", "Storybook"] },
  { title: "Data & Infra", items: ["tRPC", "Prisma", "Vercel", "Cloudflare"] },
];

export default function Stack() {
  return (
    <SmoothScroll contentClassName="px-8 py-10 md:px-14">
      <motion.div variants={stagger} initial="initial" animate="enter">
        <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
          Toolbox
        </motion.p>
        <motion.h2 variants={rise} className="font-display mt-2 text-4xl font-bold tracking-tight">
          Công nghệ <span className="text-shine">mình tin dùng</span>
        </motion.h2>

        <div className="mt-8 grid grid-cols-1 gap-5 pb-10 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <motion.div
              key={g.title}
              variants={rise}
              className="rounded-2xl border border-line-soft bg-white/[0.025] p-6"
            >
              <div className="text-[12px] uppercase tracking-[0.2em] text-white/40">{g.title}</div>
              <ul className="mt-4 space-y-2.5">
                {g.items.map((item) => (
                  <li key={item} className="group flex items-center gap-3 text-[15px] text-white/80">
                    <span className="h-1 w-1 rounded-full bg-white/30 transition-all duration-300 group-hover:w-4 group-hover:bg-glow" />
                    <span className="transition-colors group-hover:text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SmoothScroll>
  );
}
