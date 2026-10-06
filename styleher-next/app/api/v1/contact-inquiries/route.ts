// B-03 お問い合わせを送る
import { api, json, RATE_LIMITS, readJson, route, Validator } from "@/lib/api/http";
import { isInquiryType } from "@/lib/api/query";
import { db, nextId, nowIso } from "@/lib/api/store";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export const { GET, POST, PUT, PATCH, DELETE } = route({
  POST: api(
    async ({ req, user }) => {
      // 二重送信の防止：同じキーで24時間以内なら、保存せずに前回と同じ結果を返す（3.12）
      const key = req.headers.get("idempotency-key");
      const saved = key ? db.idempotency.get(`contact:${key}`) : undefined;
      if (saved && saved.expiresAt > Date.now()) return json(saved.body, saved.status);

      const body = await readJson(req);
      const v = new Validator();
      // エラーメッセージは今のフォーム（components/ContactForm.tsx）と同じ
      const name = v.str(body.name, "name", { max: 50, label: "お名前" });
      const email = v.email(body.email, "email");
      if (!body.inquiryTypeId) v.add("inquiryTypeId", "お問い合わせの種類を選んでください。");
      else if (typeof body.inquiryTypeId !== "string" || !isInquiryType(body.inquiryTypeId))
        v.add("inquiryTypeId", "お問い合わせの種類が正しくありません。");
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (message.length < 10) v.add("message", "お問い合わせ内容を10文字以上で入力してください。");
      else if (message.length > 1000) v.add("message", "お問い合わせ内容は1000文字以内で入力してください。");
      v.check();

      const now = nowIso();
      const result = { receivedAt: now };
      // スパム対策の見えない入力欄に値があれば、保存せずに成功したように返す（6.3）
      if (!body.website) {
        const id = nextId("contactInquiries");
        db.contactInquiries.push({
          id,
          userId: user?.id ?? null,
          name,
          email,
          inquiryTypeId: body.inquiryTypeId as string,
          message,
          status: "new",
          createdAt: now,
          updatedAt: now,
        });
        // 運営者への通知（ダミー）。ログに個人情報は出さない
        console.log(`[ダミーの通知] お問い合わせを受け付けました（ID: ${id}）`);
      }
      if (key) db.idempotency.set(`contact:${key}`, { status: 201, body: result, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
      // 本人は取得できないので、Location と連番の id は返さない
      return json(result, 201);
    },
    { auth: "optional", rateLimit: RATE_LIMITS.contact }
  ),
});
