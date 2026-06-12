"use client";

import { useState } from "react";
import { motion } from "motion/react";

/**
 * Khối visual bên phải hero — tái hiện "AI Model + Model Glow + Elements" trong Figma.
 * Nếu bạn export ảnh AI model từ Figma và lưu vào /public/hero-model.webp,
 * ảnh sẽ tự hiển thị đè lên lớp glow. Không có ảnh thì glow + sóng vẫn đứng được một mình.
 */
export default function HeroVisual() {
  const [hasImage, setHasImage] = useState(true);

  return (
    <div className="relative h-full w-full">
      {/* Model Glow */}
      <motion.div
        className="model-glow absolute left-1/2 top-1/2 aspect-[0.79] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sóng ánh sáng chạy ngang (Figma "Elements") */}
      <div className="absolute left-[8%] top-[46%] h-[26%] w-[84%] overflow-hidden opacity-70 [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]">
        <svg
          className="wave-drift h-full w-[200%]"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          fill="none"
        >
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M0 ${100 + i * 9} C 150 ${30 + i * 14}, 300 ${170 - i * 12}, 450 ${95 + i * 7} S 750 ${40 + i * 16}, 900 ${110 - i * 8} S 1150 ${150 - i * 10}, 1200 ${100 + i * 9}`}
              stroke={`rgba(214,219,255,${0.34 - i * 0.07})`}
              strokeWidth={1.1 - i * 0.15}
            />
          ))}
        </svg>
      </div>

      {/* Vòng quỹ đạo hạt quay chậm */}
      <div className="spin-slow absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="0 0 400 400" className="h-full w-full" fill="none">
          <circle cx="200" cy="200" r="186" stroke="rgba(255,255,255,0.07)" strokeDasharray="2 9" />
          <circle cx="200" cy="14" r="2.4" fill="#dfe3ff" />
          <circle cx="386" cy="200" r="1.6" fill="rgba(223,227,255,0.7)" />
          <circle cx="64" cy="330" r="1.8" fill="rgba(223,227,255,0.5)" />
        </svg>
      </div>

      {/* Ảnh AI model export từ Figma (tuỳ chọn) */}
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          src="/hero-model.webp"
          alt="AI model"
          onError={() => setHasImage(false)}
          className="absolute left-1/2 top-[53%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none [mask-image:radial-gradient(closest-side,#000_58%,transparent_96%)]"
          initial={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          draggable={false}
        />
      )}

      {/* Fallback: chân dung wireframe vẽ bằng SVG khi chưa có ảnh */}
      {!hasImage && (
        <motion.svg
          viewBox="0 0 300 380"
          className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2"
          fill="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.path
              key={i}
              d={`M${60 + i * 13} 30 C ${40 + i * 14} 110, ${70 + i * 12} 200, ${50 + i * 14} 290 S ${80 + i * 12} 360, ${70 + i * 13} 380`}
              stroke={`rgba(223,227,255,${0.5 - Math.abs(i - 7) * 0.055})`}
              strokeWidth="0.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.4 + i * 0.07, ease: "easeInOut" }}
            />
          ))}
        </motion.svg>
      )}
    </div>
  );
}
