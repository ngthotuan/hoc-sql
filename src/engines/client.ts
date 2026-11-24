import type { EngineId } from '../data/tracks';
import type { Request, Response } from './protocol';

type Pending = Map<number, (r: Response) => void>;
// Omit phân phối trên từng nhánh của union
type Outgoing = Request extends infer R ? (R extends unknown ? Omit<R, 'id'> : never) : never;

export interface EngineSession {
  exec(sql: string): Promise<Response>;
  reset(): Promise<Response>;
}

// Mỗi playground có worker (database) riêng, nên người học sửa dữ liệu ở
// ô này không ảnh hưởng ô khác. Worker chỉ được tạo ở lần chạy đầu tiên.
function spawn(engine: EngineId): Worker {
  // Vite tách mỗi `new Worker(new URL(...))` thành một chunk riêng.
  return engine === 'postgres'
    ? new Worker(new URL('./postgres.worker.ts', import.meta.url), { type: 'module' })
    : new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
}

export function createSession(engine: EngineId, dataset: string): EngineSession {
  let worker: Worker | null = null;
  let ready: Promise<Response> | null = null;
  let nextId = 0;
  const pending: Pending = new Map();

  const send = (msg: Outgoing) =>
    new Promise<Response>((resolve) => {
      const id = ++nextId;
      pending.set(id, resolve);
      worker!.postMessage({ ...msg, id });
    });

  const boot = () => {
    if (!worker) {
      worker = spawn(engine);
      worker.onmessage = (e: MessageEvent<Response>) => {
        pending.get(e.data.id)?.(e.data);
        pending.delete(e.data.id);
      };
      ready = send({ type: 'reset', dataset });
    }
    return ready!;
  };

  return {
    async exec(sql) {
      const boot_ = await boot();
      if (!boot_.ok) {
        ready = null;
        worker?.terminate();
        worker = null;
        return boot_;
      }
      return send({ type: 'exec', sql });
    },
    async reset() {
      if (!worker) return boot();
      ready = send({ type: 'reset', dataset });
      return ready;
    },
  };
}
