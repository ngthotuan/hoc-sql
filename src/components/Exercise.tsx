import { useEffect, useRef, useState } from 'preact/hooks';
import type { EngineId } from '../data/tracks';
import type { ResultSet } from '../engines/protocol';
import { ENGINE_LABEL, ResultTable, statusText, useEditor, useRunKey, useSession } from './sql-ui';

interface Props {
  engine: EngineId;
  dataset: string;
  solution: string;
  starter: string;
  hint?: string;
  storageKey: string;
}

type Verdict =
  | { kind: 'pass' }
  | { kind: 'fail'; message: string; result?: ResultSet }
  | { kind: 'error'; message: string }
  | { kind: 'note'; message: string };

// ---------------------------------------------------------------------------
// So sánh kết quả
// ---------------------------------------------------------------------------
const MUTATES = /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i;

function norm(v: unknown): string {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  if (typeof v === 'bigint') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') return JSON.stringify(v);
  // "120000" (chuỗi) và 120000 (số) coi như nhau: tránh đánh trượt vì khác kiểu nhỏ giữa các database
  const s = String(v);
  return /^-?\d+(\.\d+)?$/.test(s) ? String(Number(s)) : s;
}
const rowKey = (r: unknown[]) => r.map(norm).join('␟');

/** Lời giải có ORDER BY ở cấp ngoài cùng (không nằm trong ngoặc, ví dụ OVER (ORDER BY …))? */
function isOrdered(sql: string) {
  let s = sql.replace(/'(?:[^']|'')*'/g, "''").replace(/--[^\n]*/g, '');
  let prev;
  do {
    prev = s;
    s = s.replace(/\([^()]*\)/g, '');
  } while (s !== prev);
  return /\bORDER\s+BY\b/i.test(s);
}

function compare(user: ResultSet, expected: ResultSet, ordered: boolean): Verdict {
  const uc = user.columns.length;
  const ec = expected.columns.length;
  if (uc !== ec) {
    return {
      kind: 'fail',
      result: user,
      message: `Kết quả của bạn có ${uc} cột, đề bài cần ${ec} cột (${expected.columns.join(', ')}).`,
    };
  }
  const ur = user.rows.length;
  const er = expected.rows.length;
  if (ur !== er) {
    return {
      kind: 'fail',
      result: user,
      message: `Kết quả của bạn có ${ur} hàng, đáp án có ${er} hàng.`,
    };
  }
  const u = user.rows.map(rowKey);
  const e = expected.rows.map(rowKey);
  const sameSet = [...u].sort().join('\n') === [...e].sort().join('\n');
  if (!sameSet) {
    return { kind: 'fail', result: user, message: 'Số hàng và số cột đã đúng, nhưng một số giá trị chưa khớp với đáp án.' };
  }
  if (ordered && u.join('\n') !== e.join('\n')) {
    return { kind: 'fail', result: user, message: 'Đúng các hàng rồi, nhưng thứ tự chưa đúng như đề bài yêu cầu.' };
  }
  return { kind: 'pass' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Exercise({ engine, dataset, solution, starter, hint, storageKey }: Props) {
  const label = ENGINE_LABEL[engine];
  const session = useSession(engine, dataset);
  const runKey = useRunKey();
  const [busy, setBusy] = useState<null | 'boot' | 'run' | 'reset'>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const expected = useRef<ResultSet | null>(null);
  const editor = useEditor({ doc: starter, engine, label: `Ô làm bài tập (${label.name})`, onRun: () => check() });

  useEffect(() => {
    try {
      setSolved(localStorage.getItem(`ex:${storageKey}`) === '1');
    } catch {
      /* trình duyệt chặn lưu trữ: vẫn làm bài được, chỉ không nhớ */
    }
  }, []);

  async function check() {
    if (busy) return;
    const sql = editor.getText();
    const stripped = sql.replace(/--[^\n]*/g, '').trim();
    if (!stripped) {
      setVerdict({ kind: 'note', message: 'Ô đang trống. Hãy viết câu truy vấn rồi bấm Kiểm tra.' });
      return;
    }
    setBusy(session.booted ? 'run' : 'boot');
    // Lấy kết quả chuẩn trước, khi dữ liệu còn nguyên
    if (!expected.current) {
      const ref = await session.exec(solution);
      if (!ref.ok || ref.results.length === 0) {
        setBusy(null);
        setVerdict({ kind: 'note', message: 'Không chạy được lời giải mẫu. Đây là lỗi của bài học, không phải của bạn.' });
        return;
      }
      expected.current = ref.results.at(-1)!;
    }
    // Bài tập thay đổi dữ liệu (INSERT, UPDATE…): lời giải mẫu hoặc lần chạy trước đã sửa database,
    // nên khôi phục dữ liệu gốc trước khi chạy câu của người học.
    if (MUTATES.test(solution)) await session.reset();
    const res = await session.exec(sql);
    setBusy(null);
    if (!res.ok) {
      setVerdict({ kind: 'error', message: res.error });
      return;
    }
    if (res.results.length === 0) {
      setVerdict({ kind: 'fail', message: 'Câu lệnh chạy được nhưng không trả về bảng kết quả nào. Bài này cần một câu SELECT.' });
      return;
    }
    const v = compare(res.results.at(-1)!, expected.current, isOrdered(solution));
    setVerdict(v);
    if (v.kind === 'pass') {
      setSolved(true);
      try {
        localStorage.setItem(`ex:${storageKey}`, '1');
      } catch {
        /* bỏ qua */
      }
    }
  }

  async function reset() {
    setBusy('reset');
    await session.reset();
    setBusy(null);
    editor.setText(starter);
    setVerdict(null);
  }

  return (
    <div class="ex-work">
      {solved && verdict?.kind !== 'pass' && <p class="ex-solved">Bạn đã giải đúng bài này trước đây.</p>}
      <div class="pg-editor">
        {!editor.ready && <pre class="pg-fallback"><code>{starter}</code></pre>}
        <div ref={editor.host} />
      </div>

      <div class="pg-bar">
        <button type="button" class="btn btn-go" onClick={check} disabled={!!busy}>
          Kiểm tra
          <kbd aria-hidden="true">{runKey}</kbd>
        </button>
        {hint && (
          <button type="button" class="btn" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}>
            {showHint ? 'Ẩn gợi ý' : 'Gợi ý'}
          </button>
        )}
        <button type="button" class="btn" aria-expanded={showSolution} onClick={() => setShowSolution(!showSolution)}>
          {showSolution ? 'Ẩn lời giải' : 'Xem lời giải'}
        </button>
        <button type="button" class="btn" onClick={reset} disabled={!!busy}>
          Làm lại
        </button>
        <span class="pg-status" role="status">{statusText(engine, busy, session.booted, 'Kiểm tra')}</span>
      </div>

      {showHint && hint && (
        <div class="ex-hint">
          <strong>Gợi ý:</strong> {hint}
        </div>
      )}

      <div aria-live="polite">
        {verdict?.kind === 'pass' && (
          <div class="ex-verdict ex-pass">
            <strong>Chính xác.</strong> Kết quả của bạn khớp với đáp án.
          </div>
        )}
        {verdict?.kind === 'fail' && (
          <div class="ex-verdict ex-fail">
            <strong>Chưa đúng.</strong> {verdict.message}
          </div>
        )}
        {verdict?.kind === 'note' && <div class="ex-hint">{verdict.message}</div>}
        {verdict?.kind === 'error' && (
          <div class="pg-error">
            <strong>Lỗi từ {label.name}:</strong> {verdict.message}
          </div>
        )}
      </div>
      {verdict?.kind === 'fail' && verdict.result && <ResultTable set={verdict.result} label="Kết quả của bạn" />}

      {showSolution && (
        <div class="ex-solution">
          <p>Lời giải mẫu (viết cách khác mà ra cùng kết quả vẫn được tính là đúng):</p>
          <pre><code>{solution}</code></pre>
        </div>
      )}
    </div>
  );
}
