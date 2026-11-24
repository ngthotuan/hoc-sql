# Học SQL

Trang tự học SQL tiếng Việt: SQL cơ bản → PostgreSQL → MySQL. Full frontend (Astro 7 + MDX + Preact island), SQL chạy trong trình duyệt bằng WebAssembly.

## Lệnh

- `npm run dev`: chạy dev server
- `npm run build` / `npm run preview`: build tĩnh và xem bản build
- `npm run validate`: kiểm tra mọi bài học (chạy thật mọi playground, từ khóa chưa dạy, thuật ngữ, cấu trúc) và sinh `curriculum/PROGRESS.md`
- `npm run check:contrast`: kiểm tra độ tương phản màu (WCAG) ở cả giao diện sáng và tối
- `npx astro check`: kiểm tra type

## Viết bài

Mọi việc viết/sửa nội dung bài học đi qua skill **`/viet-bai`** và tuân theo `curriculum/`:
`syllabus.json` (lộ trình + tiến độ + recap), `style-guide.md` (đặc biệt mục 8: lỗi reviewer hay bắt), `glossary.md`, `datasets.md`, `log.md`. Đọc `curriculum/README.md` trước.
Viết và duyệt **tự động**: bài chỉ `done` khi `npm run validate` 0 lỗi và agent `lesson-reviewer` (`.claude/agents/`) trả về PASS. Không chờ người dùng duyệt từng bài.
Tra cứu dữ liệu nhanh: `node scripts/sql.mjs [--pg] "SQL"`.

## Kiến trúc

- `src/content/lessons/<track>/<NN-slug>.mdx`: bài học. `title`/`order` phải khớp `curriculum/syllabus.json`.
- `src/components/Playground.astro` → `Playground.tsx` (island `client:visible`) → `src/engines/client.ts` tạo Web Worker (`sqlite.worker.ts` dùng sql.js, `postgres.worker.ts` dùng PGlite) ở lần bấm Chạy đầu tiên. Mỗi playground có database riêng.
- SQL trong playground viết bằng khối ` ```sql ` bên trong `<Playground>`. **Không** dùng `code={...}`: MDX xóa thụt lề.
- Datasets: `public/datasets/<name>.sql`, tải bằng fetch khi worker khởi động. Không sửa dữ liệu đã có của `shop`.
- Astro 7 dùng processor Markdown mới: cấu hình MDX (Shiki…) đặt trong `mdx({...})`; `markdown.rehypePlugins` không dùng được nếu không cài `@astrojs/markdown-remark`. Thẻ HTML trong MDX được thay bằng component qua `components={{ table: TableWrap }}`.

## Deploy

- GitHub Pages qua `.github/workflows/deploy.yml`: mỗi lần push lên `main`, CI chạy `astro check`, `npm run validate` (0 lỗi mới build), rồi build và deploy.
- Trang nằm dưới thư mục con (`https://ngthotuan.github.io/hoc-sql/`). CI đặt `SITE_URL`/`BASE_PATH`; local để trống nên vẫn chạy ở `/`.
- **Mọi đường dẫn nội bộ phải đi qua `withBase()`** (`src/lib/url.ts`), kể cả `fetch` trong worker. Link bài học dùng `urlOf()` (đã gọi `withBase`). Không viết `href="/…"` trực tiếp.
- Commit: tiếng Anh, Conventional Commits, **không** thêm dòng `Co-Authored-By`.

## Giao diện

- Mọi màu là token trong `src/styles/global.css`, khai báo một lần dạng `light-dark(<sáng>, <tối>)`. Giao diện do `color-scheme` quyết định; nút chuyển đặt `data-theme` trên `<html>` và lưu `localStorage.theme`.
- Thêm/đổi màu chữ hoặc nền thì thêm cặp tương ứng vào `scripts/check-contrast.mjs` và chạy `npm run check:contrast`.
- Font: Be Vietnam Pro (400/500/600/700, đã tải đủ, không dùng weight khác) cho chữ, JetBrains Mono chỉ cho code.
- Khung trang: `.wrap` (max 76rem, gutter chung) cho header và mọi trang để mép trái thẳng hàng.
