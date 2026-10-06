// D-07 お問い合わせの内容 / D-08 対応状況を変える
import { touch } from "@/lib/api/admin";
import { api, checkIfMatch, errors, etagOf, json, readJson, route, Validator } from "@/lib/api/http";
import { db, type ContactInquiryRow, type InquiryStatus } from "@/lib/api/store";

const STATUSES: InquiryStatus[] = ["new", "in_progress", "closed"];

function find(id: string) {
  const row = db.contactInquiries.find((x) => String(x.id) === id);
  if (!row) throw errors.notFound("お問い合わせが見つかりません。");
  return row;
}
const etag = (row: ContactInquiryRow) => etagOf(`contact_inquiries:${row.id}`, row.updatedAt);

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ params }) => {
      const row = find(params.inquiryId);
      return json(row, 200, { ETag: etag(row) });
    },
    { auth: "admin" }
  ),

  PATCH: api(
    async ({ req, params }) => {
      const row = find(params.inquiryId);
      checkIfMatch(req, etag(row));
      const body = await readJson(req);
      const v = new Validator();
      if (!STATUSES.includes(body.status as InquiryStatus)) v.add("status", `status は ${STATUSES.join(" / ")} のいずれかにしてください。`);
      for (const key of Object.keys(body)) if (key !== "status") v.add(key, "この操作では status だけを変えられます。");
      v.check();
      row.status = body.status as InquiryStatus;
      touch(row);
      return json(row, 200, { ETag: etag(row) });
    },
    { auth: "admin" }
  ),
});
