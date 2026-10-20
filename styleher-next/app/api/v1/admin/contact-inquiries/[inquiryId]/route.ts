// D-07 お問い合わせの内容 / D-08 対応状況を変える
import { bigIntId, toContactInquiryJson, type InquiryStatus } from "@/lib/api/catalog";
import { api, checkIfMatch, errors, etagOf, json, readJson, route, Validator } from "@/lib/api/http";
import { prisma } from "@/lib/db";

const STATUSES: InquiryStatus[] = ["new", "in_progress", "closed"];

async function find(raw: string) {
  const id = bigIntId(raw);
  const row = id === null ? null : await prisma.contactInquiry.findUnique({ where: { id } });
  if (!row) throw errors.notFound("お問い合わせが見つかりません。");
  return toContactInquiryJson(row);
}
const etag = (row: { id: number; updatedAt: string }) => etagOf(`contact_inquiries:${row.id}`, row.updatedAt);

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ params }) => {
      const row = await find(params.inquiryId);
      return json(row, 200, { ETag: etag(row) });
    },
    { auth: "admin" }
  ),

  PATCH: api(
    async ({ req, params }) => {
      const row = await find(params.inquiryId);
      checkIfMatch(req, etag(row));
      const body = await readJson(req);
      const v = new Validator();
      if (!STATUSES.includes(body.status as InquiryStatus)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      for (const key of Object.keys(body)) if (key !== "status") v.add(key, "この操作では status だけを変えられます。");
      v.check();
      // updated_at はトリガーが更新する
      const updated = toContactInquiryJson(
        await prisma.contactInquiry.update({ where: { id: BigInt(row.id) }, data: { status: body.status as InquiryStatus } })
      );
      return json(updated, 200, { ETag: etag(updated) });
    },
    { auth: "admin" }
  ),
});
