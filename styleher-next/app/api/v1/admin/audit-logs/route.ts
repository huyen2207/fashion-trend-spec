// D-10 変更履歴（新しい順）
import { toAuditLogJson } from "@/lib/api/catalog";
import { api, json, pageParams, paged, route, Validator } from "@/lib/api/http";
import { prisma } from "@/lib/db";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async (c) => {
      const sp = c.req.nextUrl.searchParams;
      const v = new Validator();
      const table = sp.get("table");
      const userId = sp.get("userId");
      const from = sp.get("from");
      const to = sp.get("to");
      if (from !== null && (!DATE.test(from) || Number.isNaN(Date.parse(from)))) v.add("from", "from は YYYY-MM-DD で指定してください。");
      if (to !== null && (!DATE.test(to) || Number.isNaN(Date.parse(to)))) v.add("to", "to は YYYY-MM-DD で指定してください。");
      const page = pageParams(c, 50, 100, v);
      v.check();
      // ユーザーIDの形でない userId は、だれの変更にも当てはまらない
      if (userId && !UUID.test(userId)) return json(paged([], 0, page));

      const where = {
        ...(table && { tableName: table }),
        ...(userId && { userId }),
        // to はその日の終わりまで含める
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lt: new Date(Date.parse(to) + 24 * 60 * 60 * 1000) }),
          },
        }),
      };
      const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({ where, orderBy: { id: "desc" }, skip: page.offset, take: page.limit }),
        prisma.auditLog.count({ where }),
      ]);
      return json(paged(rows.map(toAuditLogJson), total, page));
    },
    { auth: "admin" }
  ),
});
