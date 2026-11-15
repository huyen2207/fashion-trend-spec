// ===== アプリのログ（docs/api.md 3.11） =====
// ログの種類は3つ：
//   access：API へのアクセス（1リクエスト1行）
//   warn  ：すぐに壊れてはいないが、気にしておきたいこと（回数制限を超えた・ログイン失敗・遅いレスポンス など）
//   error ：サーバーのエラー。Discord にも通知する（DISCORD_WEBHOOK_URL）
// 出し方：
//   本番（NODE_ENV=production）は JSON 1行（Vercel などのログ画面で検索しやすい）、開発中は読みやすい1行。LOG_FORMAT で変えられる
//   access は標準出力、warn・error は標準エラー出力に出す
//   LOG_DIR を指定すると、そのフォルダの access.log・warn.log・error.log にも追記する（自分のサーバーで動かすとき用）
// ログ・通知には、メールアドレス・お問い合わせ内容・トークン・パスワードを書かない
import fs from "node:fs";
import path from "node:path";
import { after } from "next/server";

type LogType = "access" | "warn" | "error";
type Fields = Record<string, unknown>;

const FORMAT = process.env.LOG_FORMAT ?? (process.env.NODE_ENV === "production" ? "json" : "pretty");

// ---- 出力 ----
function write(type: LogType, fields: Fields) {
  const entry = { time: new Date().toISOString(), type, ...fields };
  const line = JSON.stringify(entry);
  const text = FORMAT === "json" ? line : pretty(entry);
  if (type === "access") console.log(text);
  else console.error(text);
  appendToFile(type, line);
}

// 開発中の見た目：2026-11-13T01:23:45.678Z ACCESS GET /api/v1/trends 200 12ms requestId=req_… userId=u01
function pretty({ time, type, message, method, path, status, durationMs, error, ...rest }: Fields) {
  const head = [time, String(type).toUpperCase(), message, method, path, status, durationMs !== undefined && `${durationMs}ms`];
  const tail = Object.entries(rest)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`);
  const stack = (error as SerializedError | undefined)?.stack;
  return [...head.filter((x) => x !== undefined && x !== false), ...tail].join(" ") + (stack ? `\n${stack}` : "");
}

const g = globalThis as unknown as {
  __styleherLogStreams?: Map<LogType, fs.WriteStream>;
  __styleherNotified?: Map<string, number>;
};
const streams = (g.__styleherLogStreams ??= new Map<LogType, fs.WriteStream>());

function appendToFile(type: LogType, line: string) {
  const dir = process.env.LOG_DIR;
  if (!dir) return;
  let stream = streams.get(type);
  if (!stream) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      return;
    }
    stream = fs.createWriteStream(path.join(dir, `${type}.log`), { flags: "a" });
    // 書き込めなくても、アプリは止めない
    stream.on("error", (e) => console.error(`[logger] ${type}.log に書き込めません`, e.message));
    streams.set(type, stream);
  }
  stream.write(line + "\n");
}

// ---- エラーの中身（スタックトレースはログにだけ残し、APIのレスポンスには返さない） ----
type SerializedError = { name: string; message: string; code?: string; digest?: string; stack?: string };

export function serializeError(e: unknown): SerializedError {
  if (e instanceof Error) {
    const { code, digest } = e as Error & { code?: unknown; digest?: unknown };
    return {
      name: e.name,
      message: e.message,
      ...(code !== undefined && { code: String(code) }),
      ...(digest !== undefined && { digest: String(digest) }),
      stack: e.stack,
    };
  }
  return { name: "NonError", message: typeof e === "string" ? e : JSON.stringify(e) ?? String(e) };
}

// ---- Discord への通知 ----
// 同じエラーが続けて起きたとき、通知であふれないよう、同じ内容は1分に1回までにする
const NOTIFY_INTERVAL_MS = 60 * 1000;
const notified = (g.__styleherNotified ??= new Map<string, number>());

async function notifyDiscord(message: string, fields: Fields, error?: SerializedError): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const key = `${message}|${error?.name}|${error?.message}|${fields.path ?? ""}`;
  const now = Date.now();
  if (now - (notified.get(key) ?? 0) < NOTIFY_INTERVAL_MS) return;
  notified.set(key, now);
  for (const [k, t] of notified) if (now - t >= NOTIFY_INTERVAL_MS) notified.delete(k);

  const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
  const info = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => ({ name: k, value: clip(typeof v === "string" ? v : JSON.stringify(v), 1024), inline: true }))
    .slice(0, 20);
  const description = [
    error && `**${error.name}**: ${clip(error.message, 1500)}`,
    error?.stack && `\`\`\`\n${clip(error.stack, 2000)}\n\`\`\``,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "StyleHer エラー通知",
        // エラーの文面に @everyone などが入っていても、メンションにしない
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: clip(`🚨 ${message}`, 256),
            description: description || undefined,
            color: 0xe53935,
            fields: [{ name: "env", value: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown", inline: true }, ...info],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[logger] Discord への通知に失敗しました（${res.status}）`);
  } catch (e) {
    // 通知の失敗で error を出すと、通知がくり返されるため、ここでは console に出すだけにする
    console.error("[logger] Discord への通知に失敗しました", e instanceof Error ? e.message : e);
  }
}

// ---- 使う側の関数 ----
export const logger = {
  access(fields: { requestId: string; method: string; path: string; status: number; durationMs: number; userId?: string }) {
    write("access", fields);
  },

  warn(message: string, fields: Fields = {}) {
    write("warn", { message, ...fields });
  },

  // ログに書き、Discord に通知する。通知が終わるまで待ちたいときは、返り値の Promise を await する。
  // リクエストの処理中に呼んだときは、レスポンスを返したあとも通知が終わるまで処理を続ける（after）
  error(message: string, fields: Fields = {}, err?: unknown): Promise<void> {
    const error = err === undefined ? undefined : serializeError(err);
    write("error", { message, ...fields, ...(error && { error }) });
    const sending = notifyDiscord(message, fields, error);
    try {
      after(sending);
    } catch {
      // リクエストの外（起動時・onRequestError など）では after を使えない。呼び出し元が await する
    }
    return sending;
  },
};
