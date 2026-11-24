// Mọi đường dẫn nội bộ đi qua đây để trang chạy đúng khi deploy dưới một thư mục con
// (GitHub Pages: https://<user>.github.io/<repo>/). Base lấy từ `base` trong astro.config.mjs.
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** withBase('/basics/') → '/hoc-sql/basics/' (hoặc '/basics/' khi chạy local) */
export const withBase = (path: string) => `${BASE}/${path.replace(/^\/+/, '')}`;
