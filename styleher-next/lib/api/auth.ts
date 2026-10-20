// ===== 認証（ダミー） =====
// 本番では認証サービス（例：Supabase Auth）が発行したアクセストークン（JWT）を確認する（docs/api.md 3.4）。
// このダミー版では、次の固定トークンで本人を決める（本人の行は DB の users にある。prisma/seed.ts）。
//   Authorization: Bearer dummy-member-token → 一般会員（hanako@example.com）
//   Authorization: Bearer dummy-admin-token  → 管理者（admin@example.com）
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { DUMMY_ADMIN_ID, DUMMY_MEMBER_ID, toUserRow, type UserRow } from "./catalog";
import { ApiError, errors } from "./http";

const DUMMY_TOKENS: Record<string, string> = {
  "dummy-member-token": DUMMY_MEMBER_ID,
  "dummy-admin-token": DUMMY_ADMIN_ID,
};

export async function authenticate(req: NextRequest, mode: "optional" | "member" | "admin"): Promise<UserRow | null> {
  const header = req.headers.get("authorization");
  if (!header) {
    if (mode === "optional") return null;
    throw errors.unauthenticated();
  }
  // トークンが付いているのに無効なときは、未ログイン扱いにせず 401（3.4）
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
  const userId = token ? DUMMY_TOKENS[token] : undefined;
  if (!userId) throw errors.unauthenticated();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // トークンは有効だが、退会などで users に行がない
  if (!user) throw new ApiError(404, "NOT_FOUND", "会員情報が見つかりません。もう一度ログインしてください。");
  // 管理者かどうかは、毎回 users.role で確認する
  if (mode === "admin" && user.role !== "admin") throw errors.forbidden();
  return toUserRow(user);
}
