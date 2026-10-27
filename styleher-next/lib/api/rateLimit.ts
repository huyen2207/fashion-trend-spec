// 回数の制限のカウンター（docs/api.md 3.8）。今のところサーバーのメモリに持つ（再起動すると消える）。
// API（lib/api/http.ts）とログイン（auth.ts）の両方から使う
const g = globalThis as unknown as { __styleherRate?: Map<string, { count: number; resetAt: number }> };
const counters = (g.__styleherRate ??= new Map());

// 1回数える。制限を超えたら ok: false。reset は残りの秒数
export function countHit(id: string, limit: number, windowSec: number) {
  const now = Date.now();
  let c = counters.get(id);
  if (!c || c.resetAt <= now) {
    c = { count: 0, resetAt: now + windowSec * 1000 };
    counters.set(id, c);
  }
  c.count++;
  return { ok: c.count <= limit, remaining: Math.max(limit - c.count, 0), reset: Math.ceil((c.resetAt - now) / 1000) };
}

export const clientIp = (req: { headers: Headers }) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
