"use client";

import { motion } from "motion/react";
import { NAV_ITEMS, type ViewId } from "@/lib/views";

export default function Nav({
  active,
  onNavigate,
}: {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
}) {
  return (
    <motion.header
      className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-b border-line px-5 py-3 md:h-[64px] md:flex-nowrap md:px-8 md:py-0"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      {/* Logo — chấm cầu sáng như design */}
      <button
        onClick={() => onNavigate("home")}
        className="group flex items-center gap-3"
        aria-label="Về trang chủ"
      >
        <span className="relative block h-4 w-4 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#9aa0c8_55%,#3c3f5e)] transition-transform duration-500 group-hover:scale-110" />
        <span className="font-display text-sm font-semibold tracking-wide text-white/90">
          Dane.dev
        </span>
      </button>

      {/* Pill nav */}
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-white/[0.02] px-2 py-1.5 backdrop-blur-md md:flex">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative rounded-full px-4 py-1.5 text-[13.5px] transition-colors duration-300 ${
                isActive ? "text-white" : "text-white/55 hover:text-white/90"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full border border-white/20 bg-white/[0.07] shadow-[0_0_18px_rgba(207,212,255,0.18)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CTA */}
      <motion.button
        onClick={() => onNavigate("contact")}
        className="rounded-full border border-line bg-black/60 px-5 py-2 text-[13.5px] text-white/90 transition-colors hover:border-white/35 hover:bg-white/5"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        Hire me
      </motion.button>

      {/* Nav mobile rút gọn — xuống hàng riêng, không đè logo/CTA */}
      <nav className="order-last flex w-full items-center justify-center gap-5 md:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`text-xs ${active === item.id ? "text-white" : "text-white/50"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </motion.header>
  );
}
