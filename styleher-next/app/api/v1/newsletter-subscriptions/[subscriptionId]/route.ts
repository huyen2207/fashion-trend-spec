// B-02 登録の確定・配信の停止（status を変える）
import { bigIntId } from "@/lib/api/catalog";
import { ApiError, api, errors, json, readJson, route, Validator } from "@/lib/api/http";
import { sendDummyMail } from "@/lib/api/mail";
import { createToken, verifyToken } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";

const invalidToken = () => new ApiError(400, "INVALID_TOKEN", "リンクの有効期限が切れています。もう一度登録してください。");

export const { GET, POST, PUT, PATCH, DELETE } = route({
  PATCH: api(
    async ({ req, params }) => {
      const body = await readJson(req);
      const v = new Validator();
      if (body.status !== "active" && body.status !== "unsubscribed")
        v.add("status", "status は active か unsubscribed にしてください。");
      const token = v.str(body.token, "token", { max: 1000, label: "トークン" });
      v.check();

      const id = bigIntId(params.subscriptionId);
      const sub = id === null ? null : await prisma.newsletterSubscription.findUnique({ where: { id } });
      if (!sub) throw errors.notFound("登録が見つかりません。");
      const sid = Number(sub.id);
      const payload = verifyToken(token);
      // パスの登録IDとトークンの中の登録ID、変えてよい状態が一致すること
      if (!payload || payload.sid !== sid || payload.st !== body.status) throw invalidToken();

      // すでにその状態なら何もしない（べき等）
      if (sub.status === body.status) return json({ status: sub.status });
      const now = new Date();
      // 状態と日時の組み合わせは DB の ck_newsletter_subscriptions_dates でも確認される
      const updated = await prisma.newsletterSubscription.update({
        where: { id: sub.id },
        data: body.status === "active" ? { status: "active", confirmedAt: now, unsubscribedAt: null } : { status: "unsubscribed", unsubscribedAt: now },
      });
      if (updated.status === "active")
        sendDummyMail("【StyleHer】メールマガジンの登録が完了しました", [
          "配信を停止するときは、下のリンクを開いてください。",
          `${req.nextUrl.origin}/newsletter?subscription=${sid}&token=${createToken(sid, "unsubscribed")}`,
        ]);
      return json({ status: updated.status });
    },
    { auth: "none" }
  ),
});
