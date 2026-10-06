// B-01 メールマガジンに登録する（確認メールを送る）
import { api, json, RATE_LIMITS, readJson, route, Validator } from "@/lib/api/http";
import { sendDummyMail } from "@/lib/api/mail";
import { db, nextId, nowIso } from "@/lib/api/store";
import { createToken } from "@/lib/api/tokens";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  POST: api(
    async ({ req }) => {
      const body = await readJson(req);
      const v = new Validator();
      const email = v.email(body.email, "email");
      v.check();

      let sub = db.newsletterSubscriptions.find((s) => s.email.toLowerCase() === email.toLowerCase());
      if (!sub) {
        const now = nowIso();
        sub = { id: nextId("newsletterSubscriptions"), email, status: "pending", confirmedAt: null, unsubscribedAt: null, createdAt: now, updatedAt: now };
        db.newsletterSubscriptions.push(sub);
      }
      // 配信中の人には何も送らない。確認待ち・配信停止中の人には確認メールを送る（送り直す）
      if (sub.status !== "active") {
        const origin = req.nextUrl.origin;
        sendDummyMail("【StyleHer】メールマガジン登録の確認", [
          "下のリンクを開くと登録が完了します（7日間有効）。",
          `${origin}/newsletter?subscription=${sub.id}&token=${createToken(sub.id, "active")}`,
        ]);
      }
      // 登録済みかどうかが分からないよう、いつも同じ応答（6.1）。登録の id も返さない
      return json({ message: "確認メールを送りました。メールのリンクを開くと登録が完了します。" }, 202);
    },
    { rateLimit: RATE_LIMITS.newsletter }
  ),
});
