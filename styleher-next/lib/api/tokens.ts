// メールマガジンの確認・配信停止のトークン（docs/api.md 6.2）
// 登録ID・変えてよい状態・有効期限をサーバーの秘密の鍵で署名したもの。DBには保存しない。
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NewsletterStatus } from "./catalog";

// 本番では必ず環境変数で設定する。ダミー版では未設定なら開発用の鍵を使う
const SECRET = process.env.NEWSLETTER_TOKEN_SECRET ?? "styleher-dev-only-secret";
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 確認は7日、配信停止は期限なし

type Payload = { sid: number; st: Exclude<NewsletterStatus, "pending">; exp: number | null };

const sign = (data: string) => createHmac("sha256", SECRET).update(data).digest("base64url");

export function createToken(sid: number, st: Payload["st"]): string {
  const payload: Payload = { sid, st, exp: st === "active" ? Date.now() + CONFIRM_TTL_MS : null };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

// 署名と期限が正しければ中身を返す。正しくなければ null
export function verifyToken(token: string): Payload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (p.exp !== null && p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
