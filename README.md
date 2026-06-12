# AI Portfolio — sống bên trong một chiếc MacBook 💻

Portfolio lấy cảm hứng từ **AI Website Landing Design** (Figma Community), với toàn bộ
trải nghiệm diễn ra bên trong một chiếc MacBook dựng bằng CSS thuần — nắp máy tự mở,
boot sequence, rồi site xuất hiện.

## Chạy dự án

```bash
npm install
npm run dev
# mở http://localhost:3000
```

## Tech stack

| Thư viện | Vai trò |
|---|---|
| Next.js 15 (App Router + Turbopack) | Framework |
| Motion v12 (Framer Motion mới) | Mọi animation: mở nắp máy, chuyển view, layoutId nav |
| Lenis | Cuộn mượt bên trong màn hình |
| Tailwind CSS v4 | Styling, design tokens trong `@theme` |
| lucide-react | Icons |

## Animation chính

1. **Intro 3D** — MacBook bay vào, nắp mở `rotateX -89° → 0°`, boot logo + progress bar, site fade-in.
2. **Parallax tilt** — máy nghiêng nhẹ theo vị trí chuột (spring physics).
3. **Chuyển view khi click nav** — `AnimatePresence mode="wait"` với blur + clip-path + scale; active pill trong nav dùng `layoutId` nên trượt mượt giữa các item.
4. **Starfield canvas** — sao nhấp nháy + sao băng ngẫu nhiên, tôn trọng `prefers-reduced-motion`.
5. **Hero visual** — glow + sóng ánh sáng + vòng quỹ đạo, tái hiện layer "Model Glow / Elements" trong Figma.

## Thêm ảnh AI model từ Figma

Export layer **AI Model** trong file Figma ra PNG (nền trong suốt) và lưu thành:

```
public/hero-model.png
```

Ảnh sẽ tự hiển thị trong hero. Chưa có ảnh thì hero dùng wireframe SVG fallback.

## Tuỳ biến nhanh

- Đổi tên/copy: `components/views/*.tsx`
- Đổi màu/token: `app/globals.css` (block `@theme`)
- Đổi tốc độ chuyển cảnh: `lib/views.ts`
