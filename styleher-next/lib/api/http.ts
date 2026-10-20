// ===== APIの共通処理（docs/api.md 3章） =====
import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { authenticate } from "./auth";
import type { UserRow } from "./store";

// ---- エラー（3.6） ----
export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra: { details?: FieldError[]; meta?: Record<string, unknown>; headers?: Record<string, string> } = {}
  ) {
    super(message);
  }
}

export const errors = {
  badRequest: (message = "リクエストの形式が正しくありません。") => new ApiError(400, "BAD_REQUEST", message),
  validation: (details: FieldError[], message = "入力内容を確認してください。") =>
    new ApiError(400, "VALIDATION_ERROR", message, { details }),
  unauthenticated: () =>
    new ApiError(401, "UNAUTHENTICATED", "ログインしてください。", { headers: { "WWW-Authenticate": "Bearer" } }),
  forbidden: () => new ApiError(403, "FORBIDDEN", "この操作を行う権限がありません。"),
  notFound: (message = "見つかりませんでした。") => new ApiError(404, "NOT_FOUND", message),
  methodNotAllowed: (allow: string[]) =>
    new ApiError(405, "METHOD_NOT_ALLOWED", "この操作はできません。", { headers: { Allow: allow.join(", ") } }),
  conflict: (code: string, message: string, meta?: Record<string, unknown>) => new ApiError(409, code, message, { meta }),
  preconditionFailed: () =>
    new ApiError(412, "PRECONDITION_FAILED", "ほかの人が更新しました。読み込み直してください。"),
  preconditionRequired: () =>
    new ApiError(428, "PRECONDITION_REQUIRED", "If-Match ヘッダーを付けてください。"),
  tooManyRequests: (retryAfter: number) =>
    new ApiError(429, "TOO_MANY_REQUESTS", "しばらく時間をおいてから、もう一度お試しください。", {
      headers: { "Retry-After": String(retryAfter) },
    }),
};

// ---- レスポンス ----
export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
export const noContent = (headers: Record<string, string> = {}) => new Response(null, { status: 204, headers });

// ---- 回数の制限（3.8） ----
type RateLimit = { name: string; limit: number; windowSec: number; by: "ip" | "user" };
export const RATE_LIMITS = {
  public: { name: "public", limit: 300, windowSec: 60, by: "ip" },
  member: { name: "member", limit: 60, windowSec: 60, by: "user" },
  contact: { name: "contact", limit: 5, windowSec: 600, by: "ip" },
  newsletter: { name: "newsletter", limit: 5, windowSec: 600, by: "ip" },
} satisfies Record<string, RateLimit>;

const g = globalThis as unknown as { __styleherRate?: Map<string, { count: number; resetAt: number }> };
const counters = (g.__styleherRate ??= new Map());

function hitRateLimit(rule: RateLimit, key: string): Record<string, string> {
  const now = Date.now();
  const id = `${rule.name}:${key}`;
  let c = counters.get(id);
  if (!c || c.resetAt <= now) {
    c = { count: 0, resetAt: now + rule.windowSec * 1000 };
    counters.set(id, c);
  }
  c.count++;
  const reset = Math.ceil((c.resetAt - now) / 1000);
  if (c.count > rule.limit) throw errors.tooManyRequests(reset);
  return {
    "RateLimit-Limit": String(rule.limit),
    "RateLimit-Remaining": String(rule.limit - c.count),
    "RateLimit-Reset": String(reset),
  };
}

const clientIp = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

// ---- 共通の入口：リクエストID・認証・回数制限・キャッシュ・エラー処理をまとめる ----
export type Ctx = {
  req: NextRequest;
  params: Record<string, string>;
  user: UserRow | null;
  requestId: string;
};
type Options = {
  // none：認証なし / optional：トークンがあれば使う / member：ログイン必須 / admin：管理者のみ
  auth?: "none" | "optional" | "member" | "admin";
  // public：公開APIのキャッシュ（3.7）。それ以外は no-store
  cache?: "public" | "none";
  rateLimit?: RateLimit;
};
export type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string | string[]>> }) => Promise<Response>;

// ブラウザは60秒だけ使う。古い結果を出しながら取り直す（stale-while-revalidate）のは CDN だけにする。
// ブラウザでも使うと、「もっと見る」で古いページと新しいページがつながり、抜けや重複が起きるため（docs/api.md 3.7）
const PUBLIC_CACHE = "public, max-age=60";
const PUBLIC_CDN_CACHE = "public, max-age=300, stale-while-revalidate=86400";

export function api(fn: (c: Ctx) => Promise<Response> | Response, options: Options = {}): Handler {
  const { auth = "none", cache = "none" } = options;
  return async (req, ctx) => {
    const requestId = req.headers.get("x-request-id") || `req_${randomUUID().replaceAll("-", "")}`;
    const started = Date.now();
    let res: Response;
    try {
      const user = auth === "none" ? null : authenticate(req, auth);
      const rule = options.rateLimit ?? (auth === "member" || auth === "admin" ? RATE_LIMITS.member : RATE_LIMITS.public);
      const rateHeaders = hitRateLimit(rule, rule.by === "user" && user ? user.id : clientIp(req));
      // [...path] のような配列のパラメーターは "/" でつなぐ
      // パラメーターのないルートでは ctx.params が渡されない
      const raw = (await ctx?.params) ?? {};
      const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.join("/") : v]));
      res = await fn({ req, params, user, requestId });
      for (const [k, v] of Object.entries(rateHeaders)) res.headers.set(k, v);
      res.headers.set("Cache-Control", cache === "public" ? PUBLIC_CACHE : "no-store");
      if (cache === "public") res.headers.set("CDN-Cache-Control", PUBLIC_CDN_CACHE);
      if (cache === "public" && res.status === 200) res = await withEtag(req, res);
    } catch (e) {
      res = errorResponse(e, requestId);
    }
    res.headers.set("X-Request-Id", requestId);
    // ログには個人情報（メールアドレス・お問い合わせ内容・トークン）を書かない（3.11）
    console.log(`[api] ${requestId} ${req.method} ${req.nextUrl.pathname} ${res.status} ${Date.now() - started}ms`);
    return res;
  };
}

function errorResponse(e: unknown, requestId: string): Response {
  if (e instanceof ApiError) {
    const { details, meta, headers } = e.extra;
    return json(
      { error: { code: e.code, message: e.message, requestId, ...(details && { details }), ...(meta && { meta }) } },
      e.status,
      { ...headers, "Cache-Control": "no-store" }
    );
  }
  // 詳しい内容は返さず、ログにだけ残す
  console.error(`[api] ${requestId} 予期しないエラー`, e);
  return json(
    { error: { code: "INTERNAL_ERROR", message: "サーバーでエラーが発生しました。時間をおいて、もう一度お試しください。", requestId } },
    500,
    { "Cache-Control": "no-store" }
  );
}

// 公開APIの ETag と 304（3.7）
async function withEtag(req: NextRequest, res: Response): Promise<Response> {
  const body = await res.text();
  const etag = `"${createHash("sha1").update(body).digest("base64url")}"`;
  const headers = new Headers(res.headers);
  headers.set("ETag", etag);
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { status: res.status, headers });
}

// ---- メソッドの割り当て：定義していないメソッドは 405（共通のエラー形式で返す） ----
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

export function route(handlers: Partial<Record<Method, Handler>>): Record<Method, Handler> {
  const allow = METHODS.filter((m) => handlers[m]);
  const notAllowed = api(() => {
    throw errors.methodNotAllowed(allow);
  });
  return Object.fromEntries(METHODS.map((m) => [m, handlers[m] ?? notAllowed])) as Record<Method, Handler>;
}

// ---- リクエストの本文（3.12：100KB まで、JSON のみ） ----
const MAX_BODY = 100 * 1024;

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type は application/json にしてください。");
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "送信する内容が大きすぎます。");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw errors.badRequest("JSONとして読み取れません。");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw errors.badRequest("本文はJSONのオブジェクトにしてください。");
  return body as Record<string, unknown>;
}

// ---- ページ分け（3.3） ----
export function pageParams(c: Ctx, defaultLimit: number, maxLimit: number, v: Validator) {
  const sp = c.req.nextUrl.searchParams;
  const limit = v.intParam(sp.get("limit"), "limit", { min: 1, max: maxLimit }) ?? defaultLimit;
  const offset = v.intParam(sp.get("offset"), "offset", { min: 0 }) ?? 0;
  return { limit, offset };
}
export const paginate = <T>(all: T[], { limit, offset }: { limit: number; offset: number }) => ({
  items: all.slice(offset, offset + limit),
  total: all.length,
  limit,
  offset,
});

// ---- 管理APIの同時編集の確認（3.9） ----
export const etagOf = (key: string, updatedAt: string) =>
  `"${createHash("sha1").update(`${key}:${updatedAt}`).digest("base64url")}"`;

export function checkIfMatch(req: NextRequest, current: string) {
  const ifMatch = req.headers.get("if-match");
  if (!ifMatch) throw errors.preconditionRequired();
  if (ifMatch !== current && ifMatch !== "*") throw errors.preconditionFailed();
}

// ---- 入力チェック ----
const ID_PATTERN = /^[a-z0-9_]{1,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StrOpts = { min?: number; max: number; label: string; optional?: boolean };

export class Validator {
  details: FieldError[] = [];

  add(field: string, message: string) {
    this.details.push({ field, message });
  }
  // エラーがあれば 400 VALIDATION_ERROR
  check(message?: string) {
    if (this.details.length) throw errors.validation(this.details, message);
  }

  str(value: unknown, field: string, { min = 1, max, label, optional }: StrOpts): string {
    if (value === undefined || value === null) {
      if (!optional) this.add(field, `${label}を入力してください。`);
      return "";
    }
    if (typeof value !== "string") {
      this.add(field, `${label}は文字列で指定してください。`);
      return "";
    }
    const s = value.trim();
    if (s.length < min) this.add(field, min <= 1 ? `${label}を入力してください。` : `${label}を${min}文字以上で入力してください。`);
    else if (s.length > max) this.add(field, `${label}は${max}文字以内で入力してください。`);
    return s;
  }

  int(value: unknown, field: string, label: string, { min, max }: { min?: number; max?: number } = {}): number {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      this.add(field, `${label}は整数で指定してください。`);
      return 0;
    }
    if ((min !== undefined && value < min) || (max !== undefined && value > max))
      this.add(field, `${label}は${min ?? ""}〜${max ?? ""}の範囲で指定してください。`);
    return value;
  }

  bool(value: unknown, field: string, label: string): boolean {
    if (typeof value !== "boolean") this.add(field, `${label}は true か false で指定してください。`);
    return value === true;
  }

  id(value: unknown, field: string, label: string): string {
    const s = typeof value === "string" ? value : "";
    if (!ID_PATTERN.test(s)) this.add(field, `${label}は英小文字・数字・_ の30文字以内で指定してください。`);
    return s;
  }

  email(value: unknown, field: string): string {
    const s = this.str(value, field, { max: 254, label: "メールアドレス" });
    if (s && !EMAIL_PATTERN.test(s)) this.add(field, "メールアドレスの形式が正しくありません。");
    return s;
  }

  url(value: unknown, field: string, label: string, max = 500): string {
    const s = this.str(value, field, { max, label });
    if (s && !/^https?:\/\/\S+$/.test(s)) this.add(field, `${label}は http:// か https:// で始まるURLにしてください。`);
    return s;
  }

  // 参照先のIDが存在するか
  ref(value: unknown, field: string, label: string, exists: (id: string) => boolean): string {
    const s = typeof value === "string" ? value : "";
    if (!s) this.add(field, `${label}を指定してください。`);
    else if (!exists(s)) this.add(field, `${label}「${s}」は存在しません。`);
    return s;
  }

  // 文字列の配列（1件以上）
  strList(value: unknown, field: string, label: string, max: number, { min = 1 } = {}): string[] {
    if (!Array.isArray(value)) {
      this.add(field, `${label}は配列で指定してください。`);
      return [];
    }
    if (value.length < min) this.add(field, `${label}を${min}件以上入れてください。`);
    return value.map((x, i) => this.str(x, `${field}[${i}]`, { max, label }));
  }

  // IDの配列（重複なし・存在するもの）
  refList(value: unknown, field: string, label: string, exists: (id: string) => boolean, { min = 1, max = 50 } = {}): string[] {
    if (!Array.isArray(value)) {
      this.add(field, `${label}は配列で指定してください。`);
      return [];
    }
    if (value.length < min) this.add(field, `${label}を${min}件以上指定してください。`);
    if (value.length > max) this.add(field, `${label}は${max}件までです。`);
    if (new Set(value).size !== value.length) this.add(field, `${label}に同じものが入っています。`);
    return value.map((x, i) => this.ref(x, `${field}[${i}]`, label, exists));
  }

  // クエリパラメーターの整数
  intParam(raw: string | null, field: string, { min, max }: { min?: number; max?: number }): number | undefined {
    if (raw === null) return undefined;
    const n = Number(raw);
    if (!/^-?\d+$/.test(raw) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
      this.add(field, `${field} は${min ?? ""}〜${max ?? ""}の整数で指定してください。`);
      return undefined;
    }
    return n;
  }

  // クエリパラメーターのID一覧（ids=p01,p07）
  idsParam(raw: string | null, field = "ids"): string[] | undefined {
    if (raw === null) return undefined;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!ids.length || ids.length > 50) this.add(field, `${field} は1〜50件で指定してください。`);
    return ids;
  }

  // クエリパラメーターの true / false
  boolParam(raw: string | null, field: string): boolean | undefined {
    if (raw === null) return undefined;
    if (raw !== "true" && raw !== "false") this.add(field, `${field} は true か false で指定してください。`);
    return raw === "true";
  }
}

export type { UserRow };
