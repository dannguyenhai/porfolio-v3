"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/** Cuộn mượt bằng Lenis bên trong màn hình MacBook */
export default function SmoothScroll({
  children,
  contentClassName = "",
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;
    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      lerp: 0.09,
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="screen-scroll h-full overflow-y-auto">
      <div ref={contentRef} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
