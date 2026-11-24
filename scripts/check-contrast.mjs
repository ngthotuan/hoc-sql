// Kiểm tra độ tương phản WCAG 2.x của các cặp màu chữ/nền trong global.css,
// ở cả giao diện sáng và tối. Chạy: npm run check:contrast
// Chuẩn: chữ thường ≥ 4.5:1, thành phần giao diện (viền nút, vạch nhấn, focus) ≥ 3:1.
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const tokens = { light: {}, dark: {} };
for (const m of css.matchAll(/--([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)) {
  tokens.light[m[1]] = m[2];
  tokens.dark[m[1]] = m[3];
}
for (const m of css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)) {
  tokens.light[m[1]] ??= m[2];
  tokens.dark[m[1]] ??= m[2];
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [chữ/thành phần, nền, ngưỡng, mô tả]
const TEXT = 4.5, UI = 3;
const pairs = [
  ['ink', 'paper', TEXT, 'chữ chính trên nền trang'],
  ['ink', 'surface', TEXT, 'chữ chính trên thẻ/ô'],
  ['ink-soft', 'paper', TEXT, 'chữ phụ trên nền trang'],
  ['ink-soft', 'surface', TEXT, 'chữ phụ trên thẻ/ô'],
  ['ink-faint', 'paper', TEXT, 'chữ mờ (số dòng, NULL) trên nền trang'],
  ['ink-faint', 'surface', TEXT, 'chữ mờ trên thẻ/ô'],
  ['ink', 'surface-sunken', TEXT, 'code inline'],
  ['mark-ink', 'mark', TEXT, 'chữ trên nền dạ quang (mục đang chọn)'],
  ['go-ink', 'go', TEXT, 'chữ nút Chạy'],
  ['go-ink', 'go-hover', TEXT, 'chữ nút Chạy khi rê chuột'],
  ['ink', 'warn-bg', TEXT, 'chữ trong hộp lỗi'],
  ['warn', 'warn-bg', TEXT, 'tiêu đề hộp lỗi/cẩn thận'],
  ['info', 'info-bg', TEXT, 'tiêu đề hộp ghi chú'],
  ['ink', 'info-bg', TEXT, 'chữ trong hộp ghi chú'],
  ['ink', 'tip-bg', TEXT, 'chữ trong hộp thử ngay / gợi ý'],
  ['pass', 'pass-bg', TEXT, 'tiêu đề kết quả đúng'],
  ['ink', 'pass-bg', TEXT, 'chữ trong hộp kết quả đúng'],
  ['ink', 'paper', TEXT, 'lời giải mẫu'],
  ['ink', 'row-hover', TEXT, 'chữ trên hàng kết quả khi rê chuột'],
  ['ink', 'selection', TEXT, 'chữ được bôi đen'],
  ['ink', 'line-active', TEXT, 'chữ trên dòng đang sửa'],
  ['code-keyword', 'surface', TEXT, 'từ khóa SQL'],
  ['code-string', 'surface', TEXT, 'chuỗi trong SQL'],
  ['code-number', 'surface', TEXT, 'số trong SQL'],
  ['code-type', 'surface', TEXT, 'kiểu dữ liệu trong SQL'],
  ['code-keyword', 'line-active', TEXT, 'từ khóa trên dòng đang sửa'],
  ['ink-faint', 'line-active', TEXT, 'chữ mờ trên dòng đang sửa'],
  ['paper', 'ink', TEXT, 'nút giao diện đang chọn'],
  ['focus', 'paper', UI, 'viền focus trên nền trang'],
  ['focus', 'surface', UI, 'viền focus trên thẻ/ô'],
  ['rule-strong', 'surface', UI, 'viền nút'],
  ['rule-strong', 'paper', UI, 'viền nút trên nền trang'],
];

let failed = 0;
for (const mode of ['light', 'dark']) {
  console.log(`\n${mode === 'light' ? 'SÁNG' : 'TỐI'}`);
  for (const [fg, bg, min, label] of pairs) {
    const a = tokens[mode][fg], b = tokens[mode][bg];
    if (!a || !b) { console.log(`  ??   thiếu token --${!a ? fg : bg}`); failed++; continue; }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${r.toFixed(2).padStart(5)}:1 (≥${min})  ${label}  [--${fg} ${a} / --${bg} ${b}]`);
  }
}
console.log(failed ? `\n${failed} cặp chưa đạt.` : '\nTất cả đều đạt.');
process.exit(failed ? 1 : 0);
