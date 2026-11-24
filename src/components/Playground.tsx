import { useState } from 'preact/hooks';
import type { EngineId } from '../data/tracks';
import type { ResultSet } from '../engines/protocol';
import { ENGINE_LABEL, ResultTable, fmtMs, statusText, useEditor, useRunKey, useSession } from './sql-ui';

interface Props {
  engine: EngineId;
  dataset: string;
  code: string;
}

type Outcome =
  | { kind: 'rows'; results: ResultSet[]; changes: number; ms: number }
  | { kind: 'error'; message: string };

export default function Playground({ engine, dataset, code }: Props) {
  const label = ENGINE_LABEL[engine];
  const session = useSession(engine, dataset);
  const runKey = useRunKey();
  const [busy, setBusy] = useState<null | 'boot' | 'run' | 'reset'>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const editor = useEditor({ doc: code, engine, label: `Ô viết SQL (${label.name})`, onRun: () => run() });

  async function run() {
    if (busy) return;
    const sql = editor.getText();
    if (!sql.trim()) {
      setOutcome({ kind: 'error', message: 'Ô SQL đang trống. Hãy viết một câu lệnh rồi bấm Chạy.' });
      return;
    }
    setBusy(session.booted ? 'run' : 'boot');
    const res = await session.exec(sql);
    setBusy(null);
    setOutcome(
      res.ok
        ? { kind: 'rows', results: res.results, changes: res.changes, ms: res.ms }
        : { kind: 'error', message: res.error },
    );
  }

  async function reset() {
    setBusy('reset');
    const res = await session.reset();
    setBusy(null);
    editor.setText(code);
    setOutcome(res.ok ? null : { kind: 'error', message: res.error });
  }

  return (
    <section class="pg" aria-label={`Thực hành với ${label.name}`}>
      <div class="pg-editor">
        {!editor.ready && <pre class="pg-fallback"><code>{code}</code></pre>}
        <div ref={editor.host} />
      </div>

      <div class="pg-bar">
        <button type="button" class="btn btn-go" onClick={run} disabled={!!busy}>
          Chạy
          <kbd aria-hidden="true">{runKey}</kbd>
        </button>
        <button type="button" class="btn" onClick={reset} disabled={!!busy}>
          Khôi phục
        </button>
        <span class="pg-status" role="status">{statusText(engine, busy, session.booted)}</span>
      </div>

      {outcome?.kind === 'error' && (
        <div class="pg-error" role="alert">
          <strong>Lỗi từ {label.name}:</strong> {outcome.message}
        </div>
      )}

      {outcome?.kind === 'rows' && (
        <div class="pg-out">
          {outcome.results.length === 0 ? (
            <p class="pg-note">
              {outcome.changes > 0
                ? `Đã thay đổi ${outcome.changes} hàng.`
                : 'Câu lệnh chạy xong, không trả về hàng nào.'}
              <span class="pg-ms"> {fmtMs(outcome.ms)}</span>
            </p>
          ) : (
            outcome.results.map((set, i) => (
              <>
                <ResultTable set={set} />
                <p class="pg-foot">
                  {set.rows.length} hàng
                  {i === outcome.results.length - 1 && <span class="pg-ms">, {fmtMs(outcome.ms)}</span>}
                </p>
              </>
            ))
          )}
        </div>
      )}
    </section>
  );
}
