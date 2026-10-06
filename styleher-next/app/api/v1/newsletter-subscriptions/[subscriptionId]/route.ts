// B-02 登録の確定・配信の停止（status を変える）
import { ApiError, api, errors, json, readJson, route, Validator } from "@/lib/api/http";
import { sendDummyMail } from "@/lib/api/mail";
import { db, nowIso } from "@/lib/api/store";
import { createToken, verifyToken } from "@/lib/api/tokens";

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

      const sub = db.newsletterSubscriptions.find((s) => String(s.id) === params.subscriptionId);
      if (!sub) throw errors.notFound("登録が見つかりません。");
      const payload = verifyToken(token);
      // パスの登録IDとトークンの中の登録ID、変えてよい状態が一致すること
      if (!payload || payload.sid !== sub.id || payload.st !== body.status) throw invalidToken();

      // すでにその状態なら何もしない（べき等）
      if (sub.status !== body.status) {
        const now = nowIso();
        if (body.status === "active") {
          sub.status = "active";
          sub.confirmedAt = now;
          sub.unsubscribedAt = null;
          sendDummyMail("【StyleHer】メールマガジンの登録が完了しました", [
            "配信を停止するときは、下のリンクを開いてください。",
            `${req.nextUrl.origin}/newsletter?subscription=${sub.id}&token=${createToken(sub.id, "unsubscribed")}`,
          ]);
        } else {
          sub.status = "unsubscribed";
          sub.unsubscribedAt = now;
        }
        sub.updatedAt = now;
      }
      return json({ status: sub.status });
    },
    { auth: "none" }
  ),
});
