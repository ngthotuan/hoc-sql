/// <reference lib="webworker" />
// PostgreSQL thật (PGlite) chạy trong Web Worker. Chỉ trang thuộc lộ trình
// PostgreSQL mới tạo worker này, nên các trang khác không tải ~3 MB của nó.
import { PGlite } from '@electric-sql/pglite';
import { fetchDataset, type Request, type Response } from './protocol';

let db: PGlite | null = null;

async function reset(dataset: string) {
  const seed = await fetchDataset(dataset);
  await db?.close();
  db = await PGlite.create();
  await db.exec(seed);
}

async function exec(sql: string) {
  if (!db) throw new Error('Database chưa sẵn sàng');
  const out = await db.exec(sql, { rowMode: 'array' });
  let changes = 0;
  const results = out
    .filter((r) => {
      changes += r.affectedRows ?? 0;
      return r.fields.length > 0;
    })
    .map((r) => ({ columns: r.fields.map((f) => f.name), rows: r.rows as unknown[][] }));
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
      const { results, changes } = await exec(msg.sql);
      reply = { id: msg.id, ok: true, results, changes, ms: performance.now() - t0 };
    }
  } catch (err) {
    reply = { id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  self.postMessage(reply);
};
