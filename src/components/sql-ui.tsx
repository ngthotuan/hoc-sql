// Phần dùng chung của Playground và Exercise: bảng kết quả, editor, phiên engine.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { EditorView } from '@codemirror/view';
import type { EngineId } from '../data/tracks';
import type { ResultSet } from '../engines/protocol';
import type { EngineSession } from '../engines/client';

export const ENGINE_LABEL: Record<EngineId, { name: string; size: string }> = {
  sqlite: { name: 'SQLite', size: 'dưới 0,5 MB' },
  postgres: { name: 'PostgreSQL', size: 'khoảng 5 MB' },
};

export const fmtMs = (ms: number) => (ms < 1 ? '<1 ms' : `${Math.round(ms)} ms`);
export const isNum = (v: unknown) => typeof v === 'number' || typeof v === 'bigint';

function Cell({ value, num }: { value: unknown; num: boolean }) {
  if (value === null || value === undefined) return <td class={num ? 'is-null num' : 'is-null'}>NULL</td>;
  if (value instanceof Date) return <td>{value.toISOString().slice(0, 10)}</td>;
  if (typeof value === 'object') return <td class="is-json">{JSON.stringify(value)}</td>;
  return <td class={num ? 'num' : undefined}>{String(value)}</td>;
}

export function ResultTable({ set, label = 'Bảng kết quả' }: { set: ResultSet; label?: string }) {
  // Cột số: mọi giá trị khác NULL đều là số → căn phải cả tiêu đề lẫn ô
  const numeric = set.columns.map((_, i) => {
    const vals = set.rows.map((r) => r[i]).filter((v) => v !== null && v !== undefined);
    return vals.length > 0 && vals.every(isNum);
  });
  return (
    <div class="pg-grid" tabIndex={0} role="region" aria-label={label}>
      <table>
        <thead>
          <tr>{set.columns.map((c, i) => <th scope="col" class={numeric[i] ? 'num' : undefined}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {set.rows.map((r) => (
            <tr>{r.map((v, i) => <Cell value={v} num={numeric[i]} />)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phím tắt hiển thị trên nút, đúng với hệ điều hành */
export function useRunKey() {
  const [key, setKey] = useState('Ctrl ↵');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setKey('⌘ ↵');
  }, []);
  return key;
}

/** Gắn CodeMirror vào một phần tử; trả về ref tới editor và cờ đã sẵn sàng */
export function useEditor(opts: { doc: string; engine: EngineId; label: string; onRun: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [ready, setReady] = useState(false);
  const onRun = useRef(opts.onRun);
  onRun.current = opts.onRun;

  useEffect(() => {
    let cancelled = false;
    import('./editor').then(({ mountEditor }) => {
      if (cancelled || !host.current) return;
      view.current = mountEditor({
        parent: host.current,
        doc: opts.doc,
        dialect: opts.engine,
        label: opts.label,
        onRun: () => onRun.current(),
      });
      setReady(true);
    });
    return () => {
      cancelled = true;
      view.current?.destroy();
    };
  }, []);

  const getText = () => view.current?.state.doc.toString() ?? opts.doc;
  const setText = (text: string) =>
    view.current?.dispatch({ changes: { from: 0, to: view.current.state.doc.length, insert: text } });
  return { host, ready, getText, setText };
}

/** Phiên engine tạo lười: chỉ tải engine ở lần chạy đầu tiên */
export function useSession(engine: EngineId, dataset: string) {
  const session = useRef<EngineSession | null>(null);
  const [booted, setBooted] = useState(false);
  async function get() {
    if (!session.current) {
      const { createSession } = await import('../engines/client');
      session.current = createSession(engine, dataset);
    }
    return session.current;
  }
  return {
    booted,
    async exec(sql: string) {
      const s = await get();
      const res = await s.exec(sql);
      setBooted(true);
      return res;
    },
    async reset() {
      const s = await get();
      const res = await s.reset();
      setBooted(true);
      return res;
    },
  };
}

export function statusText(engine: EngineId, busy: string | null, booted: boolean, verb = 'Chạy') {
  const label = ENGINE_LABEL[engine];
  if (busy === 'boot') return `Đang tải ${label.name} (${label.size}, chỉ lần đầu)…`;
  if (busy === 'run') return 'Đang chạy…';
  if (busy === 'reset') return 'Đang khôi phục dữ liệu gốc…';
  return booted ? `${label.name} đã sẵn sàng` : `${label.name} sẽ được tải khi bạn bấm ${verb}`;
}
