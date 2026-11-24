/// <reference lib="webworker" />
// SQLite (sql.js) chạy trong Web Worker. File này và file wasm chỉ được
// tải khi người học bấm "Chạy" lần đầu trên trang dùng engine SQLite.
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import type { Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import { fetchDataset, type Request, type Response } from './protocol';

const SQL = initSqlJs({ locateFile: () => wasmUrl, useOldExtensionFunctions: false });
let db: Database | null = null;

async function reset(dataset: string) {
  const [lib, seed] = await Promise.all([SQL, fetchDataset(dataset)]);
  db?.close();
  db = new lib.Database();
  db.run('PRAGMA foreign_keys = ON;');
  db.exec(seed);
}

function exec(sql: string) {
  if (!db) throw new Error('Database chưa sẵn sàng');
  // Dùng từng statement thay vì db.exec(): db.exec() bỏ qua câu SELECT trả về 0 hàng,
  // làm mất cả tiêu đề cột. Ở đây câu nào có cột thì luôn có một bảng kết quả, kể cả rỗng.
  const results: { columns: string[]; rows: unknown[][] }[] = [];
  let changes = 0;
  for (const stmt of db.iterateStatements(sql)) {
    const columns = stmt.getColumnNames();
    const rows: unknown[][] = [];
    while (stmt.step()) rows.push(stmt.get());
    if (columns.length > 0) results.push({ columns, rows });
    else changes += db.getRowsModified();
  }
  return { results, changes };
}

self.onmessage = async (e: MessageEvent<Request>) => {
  const msg = e.data;
  const t0 = performance.now();
  let reply: Response;
  try {
    if (msg.type === 'reset') {
      await reset(msg.dataset);
      reply = { id: msg.id, ok: true, results: [], changes: 0, ms: performance.now() - t0 };
    } else {
      const { results, changes } = exec(msg.sql);
      reply = { id: msg.id, ok: true, results, changes, ms: performance.now() - t0 };
    }
  } catch (err) {
    reply = { id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  self.postMessage(reply);
};
