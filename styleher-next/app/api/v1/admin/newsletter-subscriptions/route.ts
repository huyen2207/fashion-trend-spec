// D-09 メールマガジン登録者の一覧
import { toNewsletterJson } from "@/lib/api/catalog";
import { api, json, pageParams, paged, route, Validator } from "@/lib/api/http";
import { prisma } from "@/lib/db";

const STATUSES = ["pending", "active", "unsubscribed"];

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async (c) => {
      const v = new Validator();
      const status = c.req.nextUrl.searchParams.get("status");
      if (status !== null && !STATUSES.includes(status)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      const page = pageParams(c, 50, 100, v);
      v.check();
      const where = status ? { status } : {};
      const [rows, total] = await Promise.all([
        prisma.newsletterSubscription.findMany({ where, orderBy: { id: "desc" }, skip: page.offset, take: page.limit }),
        prisma.newsletterSubscription.count({ where }),
      ]);
      return json(paged(rows.map(toNewsletterJson), total, page));
    },
    { auth: "admin" }
  ),
});
