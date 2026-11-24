import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

export default defineConfig({
  // GitHub Pages: CI đặt SITE_URL và BASE_PATH (ví dụ https://ngthotuan.github.io + /hoc-sql).
  // Chạy local thì để trống: trang nằm ở gốc '/'.
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  integrations: [
    // Mọi bài học là MDX, nên cấu hình xử lý nội dung đặt ở đây
    mdx({
      // Code block dùng chung bảng màu với playground (biến CSS trong global.css)
      shikiConfig: { theme: 'css-variables' },
    }),
    preact(),
  ],
  // Chỉ tải trước HTML của trang kế tiếp khi rê chuột vào link
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    // PGlite tự quản lý file wasm/data, không cho Vite pre-bundle
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
    worker: { format: 'es' },
  },
});
