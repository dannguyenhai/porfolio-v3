import type { Variants } from "motion/react";

export type ViewId = "home" | "work" | "about" | "stack" | "game" | "contact";

export const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "game", label: "Game" },
  { id: "contact", label: "Contact" },
];

/** Chuyển cảnh giữa các view khi click nav — blur + clip-path + parallax nhẹ */
export const viewVariants: Variants = {
  initial: {
    opacity: 0,
    y: 48,
    scale: 0.985,
    filter: "blur(14px)",
    clipPath: "inset(10% 6% 10% 6% round 28px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    clipPath: "inset(0% 0% 0% 0% round 0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -36,
    scale: 0.99,
    filter: "blur(10px)",
    transition: { duration: 0.38, ease: [0.4, 0, 1, 1] },
  },
};

/** Stagger container cho nội dung bên trong mỗi view */
export const stagger: Variants = {
  enter: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export const rise: Variants = {
  initial: { opacity: 0, y: 26, filter: "blur(8px)" },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};
