"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Nav from "@/components/Nav";
import Stars from "@/components/Stars";
import Home from "@/components/views/Home";
import Work from "@/components/views/Work";
import About from "@/components/views/About";
import Stack from "@/components/views/Stack";
import Game from "@/components/views/Game";
import Contact from "@/components/views/Contact";
import { viewVariants, type ViewId } from "@/lib/views";

export default function Screen({ booted }: { booted: boolean }) {
  const [view, setView] = useState<ViewId>("home");

  const VIEWS: Record<ViewId, React.ReactNode> = {
    home: <Home onNavigate={setView} />,
    work: <Work />,
    about: <About />,
    stack: <Stack />,
    game: <Game />,
    contact: <Contact />,
  };

  return (
    <div className="@container relative flex h-full w-full flex-col overflow-hidden bg-space">
      {/* Khí quyển: gradient navy + tím như "Gradient" layer trong Figma */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_70%_20%,#181736_0%,#0a0a16_45%,#06060e_100%)]" />
      <div className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[80%] w-[120%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgba(120,118,200,0.16),transparent_70%)] blur-2xl" />
      <Stars />

      {/* Nội dung site — chỉ hiện sau khi boot xong */}
      <AnimatePresence>
        {booted && (
          <motion.div
            key="os"
            className="relative z-10 flex h-full flex-col"
            initial={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <Nav active={view} onNavigate={setView} />
            <main className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  className="screen-scroll absolute inset-0 overflow-y-auto"
                  variants={viewVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                >
                  {VIEWS[view]}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Màn hình boot */}
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="boot"
            className="absolute inset-0 z-20 grid place-items-center bg-black"
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeOut" } }}
          >
            <div className="flex flex-col items-center gap-8">
              <motion.span
                className="block h-12 w-12 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#9aa0c8_55%,#2c2f4a)]"
                animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-white/85"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.1, ease: [0.3, 0.6, 0.4, 1] }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lớp kính phản chiếu của màn hình */}
      <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,rgba(255,255,255,0.05)_0%,transparent_28%)]" />
    </div>
  );
}
