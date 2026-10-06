// C-01 自分の会員情報 / C-02 退会する
import { api, json, noContent, route } from "@/lib/api/http";
import { removeWhere } from "@/lib/api/member";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  // GET はデータを変えない（users の行の作成・最終ログイン日時の更新は、認証サービスの仕組みで行う。7.1）
  GET: api(({ user }) => json({ id: user!.id, email: user!.email, role: user!.role, createdAt: user!.createdAt }), { auth: "member" }),

  DELETE: api(
    ({ user }) => {
      const id = user!.id;
      // お気に入り・最近見たもの・診断結果は一緒に消す。お問い合わせ・変更履歴は本人とのつながりだけ外す（docs/db.md 5章）
      removeWhere(db.users, (u) => u.id === id);
      removeWhere(db.favorites, (f) => f.userId === id);
      removeWhere(db.recentViews, (r) => r.userId === id);
      removeWhere(db.styleProfiles, (s) => s.userId === id);
      for (const c of db.contactInquiries) if (c.userId === id) c.userId = null;
      for (const a of db.auditLogs) if (a.userId === id) a.userId = null;
      // 本番では認証サービスのアカウントも削除する
      return noContent();
    },
    { auth: "member" }
  ),
});
