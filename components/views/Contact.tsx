"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Mail } from "lucide-react";
import { rise, stagger } from "@/lib/views";

const SOCIALS = ["GitHub", "LinkedIn", "X / Twitter", "Dribbble"];

export default function Contact() {
  return (
    <div className="relative grid h-full place-items-center px-8">
      <div className="text-glow pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[50%] -translate-x-1/2 -translate-y-1/2" />
      <motion.div
        variants={stagger}
        initial="initial"
        animate="enter"
        className="relative z-10 text-center"
      >
        <motion.p variants={rise} className="text-[12px] uppercase tracking-[0.25em] text-white/40">
          Contact
        </motion.p>
        <motion.h2
          variants={rise}
          className="font-display mt-3 text-[clamp(2rem,4.5vw,3.6rem)] font-bold leading-[1.1] tracking-tight"
        >
          Có ý tưởng? <span className="text-shine">Cùng làm</span> nó thật.
        </motion.h2>
        <motion.p variants={rise} className="mx-auto mt-4 max-w-md text-[15px] text-fog">
          Mình phản hồi trong 24 giờ. Cho mình biết bạn đang xây gì — kể cả khi nó mới
          chỉ là một dòng ghi chú.
        </motion.p>

        <motion.a
          variants={rise}
          href="mailto:hello@dane.dev"
          className="group mx-auto mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-black"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <Mail className="h-4 w-4" />
          hello@dane.dev
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </motion.a>

        <motion.div variants={rise} className="mt-10 flex justify-center gap-6 text-[13.5px]">
          {SOCIALS.map((s) => (
            <a
              key={s}
              href="#"
              className="text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {s}
            </a>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
