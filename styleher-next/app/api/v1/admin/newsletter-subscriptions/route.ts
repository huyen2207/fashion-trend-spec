// D-09 メールマガジン登録者の一覧
import { api, json, pageParams, paginate, route, Validator } from "@/lib/api/http";
import { db } from "@/lib/api/store";

const STATUSES = ["pending", "active", "unsubscribed"];

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    (c) => {
      const v = new Validator();
      const status = c.req.nextUrl.searchParams.get("status");
      if (status !== null && !STATUSES.includes(status)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      const page = pageParams(c, 50, 100, v);
      v.check();
      const rows = db.newsletterSubscriptions.filter((x) => !status || x.status === status).sort((a, b) => b.id - a.id);
      return json(paginate(rows, page));
    },
    { auth: "admin" }
  ),
});
