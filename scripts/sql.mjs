// Chạy nhanh câu SQL trên dataset để khảo sát dữ liệu khi viết hoặc duyệt bài.
//
//   node scripts/sql.mjs "SELECT * FROM customers WHERE city = 'Hà Nội';"
//   node scripts/sql.mjs --pg "SELECT CURRENT_DATE - joined_on FROM customers;"
//   node scripts/sql.mjs --dataset shop --file /đường/dẫn/query.sql
//
// Mỗi lần chạy dùng một database mới nạp từ dataset, nên câu lệnh sửa dữ liệu không ảnh hưởng lần sau.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const args = process.argv.slice(2);
const pg = args.includes('--pg');
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const ds = opt('--dataset') ?? 'shop';
const file = opt('--file');
const sql = file ? fs.readFileSync(file, 'utf8') : args.filter((a, i) => !a.startsWith('--') && !['--dataset', '--file'].includes(args[i - 1])).join(' ');
if (!sql.trim()) {
  console.error('Thiếu câu SQL. Ví dụ: node scripts/sql.mjs "SELECT * FROM products;"');
  process.exit(2);
}
const seed = fs.readFileSync(path.join(ROOT, 'public/datasets', `${ds}.sql`), 'utf8');

function show(columns, rows) {
  const fmt = (v) => (v === null || v === undefined ? 'NULL' : v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const cells = rows.map((r) => r.map(fmt));
  const w = columns.map((c, i) => Math.max([...c].length, ...cells.map((r) => [...r[i]].length)));
  const line = (vals) => vals.map((v, i) => v + ' '.repeat(w[i] - [...v].length)).join(' | ');
  console.log(line(columns));
  console.log(w.map((n) => '-'.repeat(n)).join('-+-'));
  for (const r of cells) console.log(line(r));
  console.log(`(${rows.length} hàng)\n`);
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

try {
  if (pg) {
    const { PGlite } = await import(require.resolve('@electric-sql/pglite'));
    const db = await PGlite.create();
    await db.exec(seed);
    const out = await db.exec(sql, { rowMode: 'array' });
    let any = false;
    for (const r of out) {
      if (r.fields.length) { any = true; show(r.fields.map((f) => f.name), r.rows); }
      else if (r.affectedRows) console.log(`(${r.affectedRows} hàng bị thay đổi)\n`);
    }
    if (!any) console.log('(không có bảng kết quả)');
    await db.close();
  } else {
    const SQL = await require('sql.js')();
    const db = new SQL.Database();
    db.run('PRAGMA foreign_keys = ON;');
    db.exec(seed);
    const out = sqliteRun(db, sql);
    for (const r of out) show(r.columns, r.rows);
    if (!out.length) console.log(`(không có bảng kết quả; ${db.getRowsModified()} hàng bị thay đổi)`);
  }
} catch (e) {
  console.log(`LỖI: ${e.message}`);
  process.exit(1);
}
