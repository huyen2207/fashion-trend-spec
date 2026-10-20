// B-01 メールマガジンに登録する（確認メールを送る）
import { api, json, RATE_LIMITS, readJson, route, Validator } from "@/lib/api/http";
import { sendDummyMail } from "@/lib/api/mail";
import { createToken } from "@/lib/api/tokens";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

// 大文字・小文字を区別せずに探す（DB の一意インデックスも lower(email)）
const findByEmail = (email: string) => prisma.newsletterSubscription.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

export const { GET, POST, PUT, PATCH, DELETE } = route({
  POST: api(
    async ({ req }) => {
      const body = await readJson(req);
      const v = new Validator();
      const email = v.email(body.email, "email");
      v.check();

      let sub = await findByEmail(email);
      if (!sub) {
        try {
          sub = await prisma.newsletterSubscription.create({ data: { email } });
        } catch (e) {
          // 同時に同じアドレスで登録されたときは、先に登録されたほうを使う
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
          sub = (await findByEmail(email))!;
        }
      }
      // 配信中の人には何も送らない。確認待ち・配信停止中の人には確認メールを送る（送り直す）
      if (sub.status !== "active") {
        const id = Number(sub.id);
        sendDummyMail("【StyleHer】メールマガジン登録の確認", [
          "下のリンクを開くと登録が完了します（7日間有効）。",
          `${req.nextUrl.origin}/newsletter?subscription=${id}&token=${createToken(id, "active")}`,
        ]);
      }
      // 登録済みかどうかが分からないよう、いつも同じ応答（6.1）。登録の id も返さない
      return json({ message: "確認メールを送りました。メールのリンクを開くと登録が完了します。" }, 202);
    },
    { rateLimit: RATE_LIMITS.newsletter }
  ),
});
