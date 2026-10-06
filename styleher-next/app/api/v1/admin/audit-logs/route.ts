// D-10 変更履歴（新しい順）
import { api, json, pageParams, paginate, route, Validator } from "@/lib/api/http";
import { db } from "@/lib/api/store";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    (c) => {
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
      // to はその日の終わりまで含める
      const toEnd = to ? new Date(Date.parse(to) + 24 * 60 * 60 * 1000).toISOString() : null;
      const rows = db.auditLogs
        .filter(
          (x) =>
            (!table || x.tableName === table) &&
            (!userId || x.userId === userId) &&
            (!from || x.createdAt >= from) &&
            (!toEnd || x.createdAt < toEnd)
        )
        .sort((a, b) => b.id - a.id);
      return json(paginate(rows, page));
    },
    { auth: "admin" }
  ),
});
