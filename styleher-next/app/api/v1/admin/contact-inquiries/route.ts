// D-06 お問い合わせ一覧（受付日時の新しい順）
import { api, json, pageParams, paginate, route, Validator } from "@/lib/api/http";
import { optionalRef, isInquiryType } from "@/lib/api/query";
import { db } from "@/lib/api/store";

const STATUSES = ["new", "in_progress", "closed"];

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    (c) => {
      const sp = c.req.nextUrl.searchParams;
      const v = new Validator();
      const status = sp.get("status");
      if (status !== null && !STATUSES.includes(status)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      const inquiryTypeId = optionalRef(v, sp.get("inquiryTypeId"), "inquiryTypeId", "お問い合わせの種類", isInquiryType);
      const page = pageParams(c, 50, 100, v);
      v.check();
      const rows = db.contactInquiries
        .filter((x) => (!status || x.status === status) && (!inquiryTypeId || x.inquiryTypeId === inquiryTypeId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
      return json(paginate(rows, page));
    },
    { auth: "admin" }
  ),
});
