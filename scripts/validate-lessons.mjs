// Kiểm tra toàn bộ bài học so với lộ trình (curriculum/syllabus.json) và quy chuẩn (curriculum/style-guide.md).
//
//   npm run validate                          kiểm tra tất cả, cập nhật PROGRESS.md và snapshots.json
//   npm run validate -- basics/04-where       chỉ kiểm tra một bài
//   npm run validate -- --update-snapshots    chấp nhận kết quả mới của playground
//
// LỖI (exit 1, phải sửa):
//   bài không có trong lộ trình, sai title/order, playground/lời giải chạy lỗi,
//   expect="error" mà không lỗi, dùng code={`...`}, bài "done" thiếu tiêu chí bắt buộc.
// CẢNH BÁO (nên sửa): từ khóa chưa dạy, thuật ngữ cần tránh, kết quả playground thay đổi,
//   bài đang viết chưa đủ tiêu chí, từ khóa bài tuyên bố dạy nhưng không xuất hiện.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const LESSON_DIR = path.join(ROOT, 'src/content/lessons');
const SYLLABUS = path.join(ROOT, 'curriculum/syllabus.json');
const GLOSSARY = path.join(ROOT, 'curriculum/glossary.md');
const SNAPSHOTS = path.join(ROOT, 'curriculum/snapshots.json');
const PROGRESS = path.join(ROOT, 'curriculum/PROGRESS.md');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update-snapshots');
const ONLY = args.find((a) => !a.startsWith('--'));

const syllabus = JSON.parse(fs.readFileSync(SYLLABUS, 'utf8'));
const snapshots = fs.existsSync(SNAPSHOTS) ? JSON.parse(fs.readFileSync(SNAPSHOTS, 'utf8')) : {};
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const STATUSES = ['planned', 'drafting', 'done', 'rewrite'];
const trackOf = (id) => id.split('/')[0];

// Tiêu chí cho một bài "done" (xem style-guide.md mục 3 và 7)
const RULES = {
  lesson: { minPlaygrounds: 4, minExercises: 3, minWords: 1200, hardMinWords: 900 },
  project: { minPlaygrounds: 1, minExercises: 8, minWords: 600, hardMinWords: 400 },
};

// ---------------------------------------------------------------------------
// Đọc bài
// ---------------------------------------------------------------------------
function listMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? listMdx(path.join(dir, d.name)) : d.name.endsWith('.mdx') ? [path.join(dir, d.name)] : [],
  );
}

const attrsOf = (s) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));

function parseLesson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const id = path.relative(LESSON_DIR, file).replace(/\.mdx$/, '').split(path.sep).join('/');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const front = {};
  for (const line of (fm?.[1] ?? '').split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) front[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  const body = fm ? raw.slice(fm[0].length) : raw;
  const bodyStart = fm ? fm[0].split('\n').length - 1 : 0;
  const lineAt = (idx) => bodyStart + body.slice(0, idx).split('\n').length;

  const playgrounds = [];
  for (const m of body.matchAll(/<Playground([^>]*)>\s*\n```sql\n([\s\S]*?)\n```\s*\n<\/Playground>/g)) {
    playgrounds.push({ attrs: attrsOf(m[1]), sql: m[2], line: lineAt(m.index), end: m.index + m[0].length });
  }
  const exercises = [];
  for (const m of body.matchAll(/<Exercise([^>]*)>([\s\S]*?)<\/Exercise>/g)) {
    const blocks = [...m[2].matchAll(/```sql\n([\s\S]*?)\n```/g)];
    const prompt = m[2].replace(/```sql\n[\s\S]*?\n```/g, '').trim();
    exercises.push({ attrs: attrsOf(m[1]), sql: blocks.at(-1)?.[1] ?? '', prompt, line: lineAt(m.index) });
  }
  return { id, file, raw, body, bodyStart, front, playgrounds, exercises };
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
const datasetCache = new Map();
function dataset(name) {
  if (!datasetCache.has(name)) {
    const f = path.join(ROOT, 'public/datasets', `${name}.sql`);
    if (!fs.existsSync(f)) throw new Error(`không có dataset "${name}" (public/datasets/${name}.sql)`);
    datasetCache.set(name, fs.readFileSync(f, 'utf8'));
  }
  return datasetCache.get(name);
}


// Chạy nhiều câu lệnh; câu nào có cột thì luôn có bảng kết quả, kể cả 0 hàng
// (db.exec() của sql.js bỏ qua kết quả rỗng). Giống hệt src/engines/sqlite.worker.ts.
function sqliteRun(db, sql) {
  const out = [];
  for (const stmt of db.iterateStatements(sql)) {
    const columns = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    if (columns.length > 0) out.push({ columns, rows });
  }
  return out;
}

let SQL = null;
async function runSqlite(ds, sql) {
  SQL ??= await require('sql.js')();
  const db = new SQL.Database();
  try {
    db.run('PRAGMA foreign_keys = ON;');
    db.exec(dataset(ds));
    return sqliteRun(db, sql);
  } finally {
    db.close();
  }
}

// PostgreSQL: một instance cho mỗi dataset; mỗi câu chạy trong BEGIN … ROLLBACK
// (PostgreSQL hỗ trợ DDL trong transaction). Câu tự quản lý transaction thì dùng instance riêng.
let PGlite = null;
const pgCache = new Map();
const toRows = (out) =>
  out.filter((r) => r.fields.length > 0).map((r) => ({ columns: r.fields.map((f) => f.name), rows: r.rows }));
async function runPostgres(ds, sql) {
  PGlite ??= (await import(require.resolve('@electric-sql/pglite'))).PGlite;
  if (/\b(BEGIN|COMMIT|ROLLBACK|VACUUM|SAVEPOINT)\b/i.test(sql)) {
    const db = await PGlite.create();
    try {
      await db.exec(dataset(ds));
      return toRows(await db.exec(sql, { rowMode: 'array' }));
    } finally {
      await db.close();
    }
  }
  if (!pgCache.has(ds)) {
    const db = await PGlite.create();
    await db.exec(dataset(ds));
    pgCache.set(ds, db);
  }
  const db = pgCache.get(ds);
  await db.exec('BEGIN');
  try {
    return toRows(await db.exec(sql, { rowMode: 'array' }));
  } finally {
    await db.exec('ROLLBACK');
  }
}
const run = (engine, ds, sql) => (engine === 'postgres' ? runPostgres(ds, sql) : runSqlite(ds, sql));

// ---------------------------------------------------------------------------
// Từ khóa: bài nào dạy từ khóa nào
// ---------------------------------------------------------------------------
const lessonsById = new Map(syllabus.lessons.map((l) => [l.id, l]));
const isWordKeyword = (k) => /^[A-Z][A-Z_ ]*$/.test(k); // bỏ qua ký hiệu như *, ||, ::
const keywordOwner = new Map();
for (const l of syllabus.lessons) {
  for (const k of l.introduces ?? []) {
    if (isWordKeyword(k) && !keywordOwner.has(k)) keywordOwner.set(k, l);
  }
}
const keywordRe = (k) => new RegExp(`(^|[^A-Za-z_])${k.replace(/ /g, '\\s+')}(?![A-Za-z_])`);
function knownBefore(lesson) {
  const tracks = new Set([trackOf(lesson.id), ...(syllabus.tracks[trackOf(lesson.id)]?.requires ?? [])]);
  return (owner) =>
    tracks.has(trackOf(owner.id)) && (trackOf(owner.id) !== trackOf(lesson.id) || owner.order <= lesson.order);
}
const stripSql = (sql) => sql.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, '').replace(/"[^"]*"/g, '""');

// ---------------------------------------------------------------------------
// Thuật ngữ cần tránh
// ---------------------------------------------------------------------------
const avoidTerms = [];
for (const line of fs.readFileSync(GLOSSARY, 'utf8').split('\n')) {
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length < 6 || cells[1] === 'Tiếng Anh' || cells[1].startsWith('---')) continue;
  for (const t of cells[3].split(',').map((x) => x.trim()).filter(Boolean)) avoidTerms.push({ term: t, use: cells[2] });
}
function proseLines(lesson) {
  let inFence = false;
  return lesson.body.split('\n').map((text, i) => {
    const n = lesson.bodyStart + i + 1;
    if (/^```/.test(text)) { inFence = !inFence; return { n, text: '' }; }
    if (inFence) return { n, text: '' };
    return { n, text: text.replace(/`[^`]*`/g, '').replace(/<[^>]+>/g, '') };
  });
}
// Phần chú thích trong ngoặc được phép dùng từ "cần tránh", ví dụ "index (chỉ mục)"
function proseForTerms(lesson) {
  return proseLines(lesson).map(({ n, text }) => ({ n, text: text.replace(/\([^()]*\)/g, '') }));
}


// ---------------------------------------------------------------------------
// Kiểm tra "điều kiện có tác dụng" cho lời giải bài tập
// Bỏ thử từng điều kiện nối bằng AND ở cấp ngoài cùng của WHERE (và từng đầu của
// BETWEEN). Nếu kết quả không đổi, điều kiện đó không loại hàng nào: người học bỏ
// sót nó vẫn được chấm đúng (style-guide mục 8).
// ---------------------------------------------------------------------------
function splitWhere(sql) {
  const s = sql.replace(/;\s*$/, '');
  // Tìm WHERE ở cấp ngoài cùng (không nằm trong ngoặc hay chuỗi)
  let depth = 0, inStr = false, start = -1, end = s.length;
  const upper = s.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === "'") inStr = false; continue; }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0) {
      const rest = upper.slice(i);
      const word = (w) => rest.startsWith(w) && !/[A-Z0-9_]/.test(upper[i - 1] ?? ' ') && !/[A-Z0-9_]/.test(upper[i + w.length] ?? ' ');
      if (start < 0 && word('WHERE')) start = i + 5;
      else if (start >= 0 && (/^(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT)\b/.test(rest)) && !/[A-Z0-9_]/.test(upper[i - 1] ?? ' ')) { end = i; break; }
    }
  }
  if (start < 0) return null;
  const where = s.slice(start, end);
  // Tách theo AND ở cấp ngoài cùng; AND ngay sau BETWEEN thuộc về BETWEEN
  const parts = [];
  let cur = '', d = 0, str = false, pendingBetween = false;
  const W = where;
  for (let i = 0; i < W.length; i++) {
    const c = W[i];
    if (str) { cur += c; if (c === "'") str = false; continue; }
    if (c === "'") { str = true; cur += c; continue; }
    if (c === '(') d++;
    if (c === ')') d--;
    const restU = W.slice(i).toUpperCase();
    const boundary = !/[A-Za-z0-9_]/.test(W[i - 1] ?? ' ');
    if (d === 0 && boundary && /^BETWEEN\b/.test(restU)) pendingBetween = true;
    if (d === 0 && boundary && /^AND\b/.test(restU)) {
      if (pendingBetween) { pendingBetween = false; cur += c; continue; }
      parts.push(cur.trim()); cur = ''; i += 2; continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return { before: s.slice(0, start - 5), parts, after: s.slice(end) };
}

function mutants(sql) {
  const out0 = [];
  if (/\bSELECT\s+DISTINCT\b/i.test(sql)) {
    out0.push({ label: 'bỏ DISTINCT', sql: sql.replace(/\bSELECT\s+DISTINCT\b/i, 'SELECT') });
  }
  // COALESCE(x, …) → x: nếu kết quả không đổi, COALESCE không thay NULL nào
  const ci = sql.toUpperCase().indexOf('COALESCE(');
  if (ci >= 0) {
    let depth = 0, k = ci + 9, argEnd = -1, end = -1, inS = false;
    for (; k < sql.length; k++) {
      const c = sql[k];
      if (inS) { if (c === "'") inS = false; continue; }
      if (c === "'") { inS = true; continue; }
      if (c === '(') depth++;
      else if (c === ')') { if (depth === 0) { end = k; break; } depth--; }
      else if (c === ',' && depth === 0 && argEnd < 0) argEnd = k;
    }
    if (argEnd > 0 && end > 0) {
      out0.push({ label: 'thay COALESCE(...) bằng giá trị đầu tiên của nó', sql: sql.slice(0, ci) + sql.slice(ci + 9, argEnd) + sql.slice(end + 1) });
    }
  }
  const w = splitWhere(sql);
  if (!w) return out0;
  const build = (parts) =>
    (parts.length ? `${w.before}WHERE ${parts.join('\n  AND ')}\n${w.after}` : `${w.before}${w.after}`).trim() + ';';
  const out = out0;
  w.parts.forEach((p, i) => {
    const others = w.parts.filter((_, j) => j !== i);
    out.push({ label: `bỏ điều kiện \`${p.replace(/\s+/g, ' ')}\``, sql: build(others) });
    const m = p.match(/^([\s\S]+?)\s+BETWEEN\s+([\s\S]+?)\s+AND\s+([\s\S]+)$/i);
    if (m && !/^NOT\b/i.test(m[1].trim()) && !/\bNOT$/i.test(m[1].trim())) {
      const [, e, lo, hi] = m;
      out.push({ label: `bỏ đầu dưới của \`${p.replace(/\s+/g, ' ')}\``, sql: build([...others, `${e} <= ${hi}`]) });
      out.push({ label: `bỏ đầu trên của \`${p.replace(/\s+/g, ' ')}\``, sql: build([...others, `${e} >= ${lo}`]) });
    }
  });
  return out;
}
const sameRows = (a, b) => {
  const key = (r) => JSON.stringify(r.at(-1)?.rows.map((x) => JSON.stringify(x)).sort(), (_, v) => (typeof v === 'bigint' ? String(v) : v));
  return key(a) === key(b);
};

// ---------------------------------------------------------------------------
// Kiểm tra
// ---------------------------------------------------------------------------
const VOLATILE = /\b(CURRENT_DATE|CURRENT_TIMESTAMP|NOW|RANDOM|VERSION|GEN_RANDOM_UUID|CLOCK_TIMESTAMP)\b/i;
const hash = (v) =>
  crypto.createHash('sha1').update(JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? String(x) : x))).digest('hex').slice(0, 12);

const files = listMdx(LESSON_DIR).map(parseLesson);
const fileIds = new Set(files.map((f) => f.id));

for (const l of syllabus.lessons) {
  if (!STATUSES.includes(l.status)) err(l.id, `status "${l.status}" không hợp lệ (${STATUSES.join(', ')})`);
  const hasFile = fileIds.has(l.id);
  if (l.status === 'planned' && hasFile) warn(l.id, 'đã có file nhưng syllabus vẫn ghi "planned"');
  if (l.status !== 'planned' && !hasFile) err(l.id, `syllabus ghi "${l.status}" nhưng chưa có src/content/lessons/${l.id}.mdx`);
  if (l.status === 'done' && !l.recap) err(l.id, 'bài "done" phải có "recap" trong syllabus.json');
}

for (const lesson of files) {
  if (ONLY && lesson.id !== ONLY) continue;
  const where = path.relative(ROOT, lesson.file);
  const plan = lessonsById.get(lesson.id);
  if (!plan) { err(where, 'không có trong curriculum/syllabus.json'); continue; }
  if (lesson.front.title !== plan.title) err(where, `title "${lesson.front.title}" khác syllabus "${plan.title}"`);
  if (Number(lesson.front.order) !== plan.order) err(where, `order ${lesson.front.order} khác syllabus ${plan.order}`);
  if (!lesson.front.description) err(where, 'thiếu description');
  if (/code=\{`/.test(lesson.body)) err(where, 'dùng code={`...`}: MDX sẽ xóa thụt lề, hãy dùng khối ```sql bên trong');

  const track = syllabus.tracks[trackOf(lesson.id)];
  const isKnown = knownBefore(plan);
  const isDone = plan.status === 'done';
  const usedKeywords = new Set();

  const checkKeywords = (at, sql) => {
    const code = stripSql(sql);
    for (const [k, owner] of keywordOwner) {
      if (!keywordRe(k).test(code)) continue;
      usedKeywords.add(k);
      if (!isKnown(owner)) warn(at, `dùng ${k} nhưng từ khóa này được dạy ở ${owner.id} (bài ${owner.order})`);
    }
  };

  // Trình bày (style-guide mục 4): từ 3 cột trở lên thì mỗi cột một dòng.
  // Đếm dấu phẩy ở cấp ngoài cùng (không nằm trong ngoặc, không nằm trong chuỗi) trên dòng SELECT.
  const checkFormat = (at, code) => {
    for (const line of code.split('\n')) {
      const m = line.match(/^\s*SELECT\s+(?:DISTINCT\s+)?(.*)$/i);
      if (!m) continue;
      let depth = 0, inStr = false, commas = 0;
      for (const ch of m[1]) {
        if (ch === "'") inStr = !inStr;
        else if (inStr) continue;
        else if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) commas++;
      }
      if (commas >= 2) warn(at, `"${line.trim()}": từ 3 cột trở lên thì mỗi cột một dòng (style-guide mục 4)`);
    }
  };

  // Playground
  for (const [i, pg] of lesson.playgrounds.entries()) {
    const at = `${where}:${pg.line}`;
    const engine = pg.attrs.engine ?? 'sqlite';
    const ds = pg.attrs.dataset ?? track.dataset ?? 'shop';
    const expectError = pg.attrs.expect === 'error';
    if (engine !== track.engine) warn(at, `playground dùng engine "${engine}" trong khi lộ trình dùng "${track.engine}"`);

    let results = null;
    try {
      results = await run(engine, ds, pg.sql);
      if (expectError) err(at, 'playground expect="error" nhưng câu lệnh chạy thành công');
    } catch (e) {
      if (!expectError) err(at, `chạy lỗi (${engine}): ${e.message}`);
    }
    if (results) {
      // Gắn theo nội dung câu SQL: viết lại playground thì bắt đầu ảnh chụp mới;
      // cùng câu SQL mà kết quả khác nghĩa là dữ liệu đã đổi → cảnh báo.
      const key = `${lesson.id}#${hash(pg.sql.trim())}`;
      const volatile = VOLATILE.test(pg.sql);
      const snap = results.map((r) => ({ columns: r.columns, rows: r.rows.length, ...(volatile ? {} : { hash: hash(r.rows) }) }));
      const old = snapshots[key];
      if (!old || UPDATE) snapshots[key] = snap;
      else if (JSON.stringify(old) !== JSON.stringify(snap)) {
        warn(at, `kết quả playground #${i + 1} đã thay đổi dù câu SQL giữ nguyên (trước: ${old.map((r) => r.rows + ' hàng').join(', ')}; nay: ${snap.map((r) => r.rows + ' hàng').join(', ')}). Kiểm tra lại lời giải thích rồi chạy --update-snapshots`);
      }
    }
    checkKeywords(at, pg.sql);
    checkFormat(at, pg.sql);
  }

  // Bài tập
  for (const ex of lesson.exercises) {
    const at = `${where}:${ex.line}`;
    const engine = ex.attrs.engine ?? 'sqlite';
    const ds = ex.attrs.dataset ?? track.dataset ?? 'shop';
    if (!ex.sql) { err(at, '<Exercise> thiếu lời giải (khối ```sql ở cuối)'); continue; }
    if (!ex.prompt) err(at, '<Exercise> thiếu đề bài');
    try {
      const res = await run(engine, ds, ex.sql);
      if (res.length === 0) err(at, 'lời giải không trả về bảng kết quả (bài tập cần câu SELECT)');
      else if (res.at(-1).rows.length === 0) warn(at, 'lời giải trả về 0 hàng: người học khó biết mình đúng hay sai');
      else {
        for (const m of mutants(ex.sql)) {
          try {
            const r2 = await run(engine, ds, m.sql);
            if (r2.length && sameRows(res, r2)) {
              warn(at, `điều kiện thừa: ${m.label} vẫn cho cùng kết quả, nên lời giải thiếu ý vẫn được chấm đúng`);
            }
          } catch {
            /* biến thể không chạy được thì bỏ qua */
          }
        }
      }
    } catch (e) {
      err(at, `lời giải chạy lỗi (${engine}): ${e.message}`);
    }
    checkKeywords(at, ex.sql);
    checkFormat(at, ex.sql);
  }

  // Thuật ngữ
  for (const { n, text } of proseForTerms(lesson)) {
    for (const { term, use } of avoidTerms) {
      const re = new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu');
      if (re.test(text)) warn(`${where}:${n}`, `"${term}" → dùng "${use}" (glossary.md)`);
    }
  }

  // Cấu trúc: lỗi với bài "done", cảnh báo với bài đang viết
  if (plan.status !== 'planned') {
    const report = isDone ? err : warn;
    const rule = RULES[plan.kind ?? 'lesson'];
    const words = proseLines(lesson).map((l) => l.text).join(' ').split(/\s+/).filter(Boolean).length;
    if (!/^## Tóm tắt\s*$/m.test(lesson.body)) report(where, 'thiếu phần "## Tóm tắt"');
    if (!/^## Bài tập\s*$/m.test(lesson.body)) report(where, 'thiếu phần "## Bài tập"');
    if (!/<Callout type="warn"/.test(lesson.body)) report(where, 'chưa có <Callout type="warn"> (phần lỗi hay gặp)');
    if (lesson.playgrounds.length < rule.minPlaygrounds) report(where, `có ${lesson.playgrounds.length} playground (tối thiểu ${rule.minPlaygrounds})`);
    if (lesson.exercises.length < rule.minExercises) report(where, `có ${lesson.exercises.length} bài tập (tối thiểu ${rule.minExercises})`);
    if (words < rule.hardMinWords) report(where, `khoảng ${words} từ (tối thiểu ${rule.hardMinWords}, mục tiêu ${rule.minWords}–2.500)`);
    else if (words < rule.minWords) warn(where, `khoảng ${words} từ (mục tiêu ${rule.minWords}–2.500)`);
    for (const pg of lesson.playgrounds) {
      const after = lesson.body.slice(pg.end).trimStart();
      if (/^(<Playground|<Exercise|##|$)/.test(after)) report(`${where}:${pg.line}`, 'playground không có đoạn đọc kết quả ngay sau');
    }
    for (const k of plan.introduces ?? []) {
      if (isWordKeyword(k) && keywordOwner.get(k)?.id === plan.id && !usedKeywords.has(k)) {
        warn(where, `syllabus ghi bài này dạy ${k} nhưng không playground/bài tập nào dùng nó`);
      }
    }
  }
}

for (const db of pgCache.values()) await db.close();

if (!ONLY) {
  const live = new Set(files.flatMap((f) => f.playgrounds.map((pg) => `${f.id}#${hash(pg.sql.trim())}`)));
  for (const k of Object.keys(snapshots)) if (!live.has(k)) delete snapshots[k];
}
fs.writeFileSync(SNAPSHOTS, JSON.stringify(Object.fromEntries(Object.entries(snapshots).sort()), null, 2) + '\n');

// ---------------------------------------------------------------------------
// Tiến độ
// ---------------------------------------------------------------------------
const STATUS_LABEL = { planned: 'Chưa viết', rewrite: 'Bản nháp cũ, cần viết lại', drafting: 'Đang viết', done: 'Xong' };
const next =
  syllabus.lessons.find((l) => l.status === 'drafting') ??
  Object.keys(syllabus.tracks)
    .flatMap((tid) => syllabus.lessons.filter((l) => trackOf(l.id) === tid).sort((a, b) => a.order - b.order))
    .find((l) => l.status !== 'done');
const lines = ['# Tiến độ viết bài', '', '> File này do `npm run validate` tự sinh từ `syllabus.json`. Đừng sửa tay.', ''];
lines.push(next ? `**Bài cần làm tiếp theo:** \`${next.id}\` (${next.title}), trạng thái: ${STATUS_LABEL[next.status]}\n` : '**Đã viết xong toàn bộ lộ trình.**\n');
for (const [tid, t] of Object.entries(syllabus.tracks)) {
  const ls = syllabus.lessons.filter((l) => trackOf(l.id) === tid).sort((a, b) => a.order - b.order);
  const done = ls.filter((l) => l.status === 'done').length;
  lines.push(`## ${t.name}: ${done}/${ls.length} bài xong`, '', '| # | Module | Bài | Trạng thái |', '|---|---|---|---|');
  for (const l of ls) lines.push(`| ${l.order} | ${l.module} | ${l.title} | ${STATUS_LABEL[l.status] ?? l.status} |`);
  lines.push('');
}
fs.writeFileSync(PROGRESS, lines.join('\n'));

// ---------------------------------------------------------------------------
// Báo cáo
// ---------------------------------------------------------------------------
const total = syllabus.lessons.length;
const doneAll = syllabus.lessons.filter((l) => l.status === 'done').length;
const pgCount = files.reduce((n, f) => n + f.playgrounds.length, 0);
const exCount = files.reduce((n, f) => n + f.exercises.length, 0);
if (warnings.length) console.log(`\nCẢNH BÁO (${warnings.length})\n` + warnings.map((w) => '  - ' + w).join('\n'));
if (errors.length) console.log(`\nLỖI (${errors.length})\n` + errors.map((e) => '  - ' + e).join('\n'));
console.log(`\n${files.length} file bài, ${pgCount} playground, ${exCount} bài tập đã chạy. Tiến độ: ${doneAll}/${total} bài xong.`);
if (next) console.log(`Bài tiếp theo: ${next.id} (${next.title}), trạng thái: ${STATUS_LABEL[next.status]}`);
console.log(errors.length ? '\nKẾT QUẢ: có lỗi, cần sửa.' : '\nKẾT QUẢ: không có lỗi.');
process.exit(errors.length ? 1 : 0);
