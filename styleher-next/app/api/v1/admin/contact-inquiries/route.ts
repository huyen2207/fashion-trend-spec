// D-06 お問い合わせ一覧（受付日時の新しい順）
import { loadMasters, toContactInquiryJson } from "@/lib/api/catalog";
import { api, json, pageParams, paged, route, Validator } from "@/lib/api/http";
import { masterChecks, optionalRef } from "@/lib/api/query";
import { prisma } from "@/lib/db";

const STATUSES = ["new", "in_progress", "closed"];

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async (c) => {
      const sp = c.req.nextUrl.searchParams;
      const v = new Validator();
      const status = sp.get("status");
      if (status !== null && !STATUSES.includes(status)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      const inquiryTypeId = optionalRef(v, sp.get("inquiryTypeId"), "inquiryTypeId", "お問い合わせの種類", masterChecks(await loadMasters()).isInquiryType);
      const page = pageParams(c, 50, 100, v);
      v.check();
      const where = { ...(status && { status }), ...(inquiryTypeId && { inquiryTypeId }) };
      const [rows, total] = await Promise.all([
        prisma.contactInquiry.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: page.offset, take: page.limit }),
        prisma.contactInquiry.count({ where }),
      ]);
      return json(paged(rows.map(toContactInquiryJson), total, page));
    },
    { auth: "admin" }
  ),
});
