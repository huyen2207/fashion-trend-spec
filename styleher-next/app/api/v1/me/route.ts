// C-01 自分の会員情報 / C-02 退会する
import { api, json, noContent, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  // GET はデータを変えない（users の行の作成・最終ログイン日時の更新は、認証サービスの仕組みで行う。7.1）
  GET: api(({ user }) => json({ id: user!.id, email: user!.email, role: user!.role, createdAt: user!.createdAt }), { auth: "member" }),

  DELETE: api(
    async ({ user }) => {
      // お気に入り・最近見たもの・診断結果は外部キーの CASCADE で一緒に消える。
      // お問い合わせ・変更履歴は SET NULL で本人とのつながりだけ外れる（docs/db.md 5章）
      await prisma.user.deleteMany({ where: { id: user!.id } });
      // 本番では認証サービスのアカウントも削除する
      return noContent();
    },
    { auth: "member" }
  ),
});
