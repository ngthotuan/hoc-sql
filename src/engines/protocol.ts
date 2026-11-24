import { withBase } from '../lib/url';

export interface ResultSet {
  columns: string[];
  rows: unknown[][];
}

export type Request =
  | { id: number; type: 'exec'; sql: string }
  | { id: number; type: 'reset'; dataset: string };

export type Response =
  | { id: number; ok: true; results: ResultSet[]; changes: number; ms: number }
  | { id: number; ok: false; error: string };

export async function fetchDataset(name: string): Promise<string> {
  const res = await fetch(withBase(`/datasets/${name}.sql`));
  if (!res.ok) throw new Error(`Không tải được dataset "${name}" (HTTP ${res.status})`);
  return res.text();
}
