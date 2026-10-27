// ===== API の認証・認可（docs/api.md 3.4） =====
// 本人は next-auth のセッション（ログイン時に発行される Cookie）で決める（auth.ts）。
// 本人の行は DB の users から読み、管理者かどうかは毎回 users.role で確認する（権限を外したらすぐに使えなくするため）。
//   member：ログインしていなければ 401
//   admin ：ログインしていなければ 401、管理者でなければ 403
//   optional：ログインしていれば本人として扱い、していなければ null
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toUserRow, type UserRow } from "./catalog";
import { ApiError, errors } from "./http";

export async function authenticate(mode: "optional" | "member" | "admin"): Promise<UserRow | null> {
  // セッションの Cookie がない・署名が正しくない・期限切れのときは null
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    if (mode === "optional") return null;
    throw errors.unauthenticated();
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // セッションは有効だが、退会などで users に行がない
  if (!user) throw new ApiError(404, "NOT_FOUND", "会員情報が見つかりません。もう一度ログインしてください。");
  if (mode === "admin" && user.role !== "admin") throw errors.forbidden();
  return toUserRow(user);
}
