// Lấy lại mã nguồn gốc từ HTML của một khối code đã được Shiki tô màu.
// Dùng cho <Playground> và <Exercise>: SQL được viết trong khối ```sql để MDX giữ nguyên thụt lề.
const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

export function codeFromHtml(html: string): string {
  const inner = html.match(/<code[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? html;
  return inner
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
      e[0] === '#'
        ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
        : (ENTITIES[e] ?? m),
    )
    .trim();
}

/** Tách phần đề bài và khối code cuối cùng (lời giải) trong HTML của một component */
export function splitLastCode(html: string): { before: string; code: string } {
  const start = html.lastIndexOf('<pre');
  if (start < 0) return { before: html, code: '' };
  const end = html.indexOf('</pre>', start);
  return { before: html.slice(0, start) + html.slice(end + 6), code: codeFromHtml(html.slice(start, end + 6)) };
}
