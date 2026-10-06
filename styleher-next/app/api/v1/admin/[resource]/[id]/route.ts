// D-02 1件の取得 / D-04 更新（全項目） / D-05 一部の項目を変える
// DELETE は作らない（削除の代わりに非公開にする）。送られたら 405
import { findRow, productUsage, RESOURCES, snapshot, touch, writeAudit, type ResourceDef, type Row } from "@/lib/api/admin";
import { api, checkIfMatch, errors, etagOf, json, readJson, route, Validator } from "@/lib/api/http";

function target(params: Record<string, string>): { def: ResourceDef; row: Row; etag: string } {
  const def = RESOURCES[params.resource];
  if (!def) throw errors.notFound("APIが見つかりません。URLを確認してください。");
  const row = findRow(def, params.id);
  if (!row) throw errors.notFound();
  return { def, row, etag: etagOf(`${def.table}:${row.id}`, row.updatedAt) };
}

const withEtag = (def: ResourceDef, row: Row) => json(row, 200, { ETag: etagOf(`${def.table}:${row.id}`, row.updatedAt) });

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ params }) => {
      const { def, row } = target(params);
      return withEtag(def, row);
    },
    { auth: "admin" }
  ),

  PUT: api(
    async ({ req, params, user }) => {
      const { def, row, etag } = target(params);
      checkIfMatch(req, etag);
      const body = await readJson(req);
      const v = new Validator();
      // IDは変えられない（本文の id は無視する）
      const data = def.parse(body, v, row.id);
      v.check();
      const before = snapshot(row);
      Object.assign(row, data);
      touch(row);
      writeAudit(user!.id, def.table, "update", before, row);
      return withEtag(def, row);
    },
    { auth: "admin" }
  ),

  PATCH: api(
    async ({ req, params, user }) => {
      const { def, row, etag } = target(params);
      checkIfMatch(req, etag);
      const body = await readJson(req);
      const v = new Validator();
      const allowed = def.hasSortOrder ? ["isPublished", "sortOrder"] : ["isPublished"];
      for (const key of Object.keys(body))
        if (!allowed.includes(key)) v.add(key, `この操作では ${allowed.join("・")} だけを変えられます。ほかの項目は PUT でまとめて変えてください。`);
      if (!Object.keys(body).length) v.add("body", `${allowed.join("・")} のどれかを指定してください。`);
      const changes: Record<string, unknown> = {};
      if ("isPublished" in body) changes.isPublished = v.bool(body.isPublished, "isPublished", "公開");
      if ("sortOrder" in body && def.hasSortOrder) changes.sortOrder = v.int(body.sortOrder, "sortOrder", "並び順", { min: -32768, max: 32767 });
      const force = v.boolParam(req.nextUrl.searchParams.get("force"), "force") ?? false;
      v.check();

      // 公開中のコーデ・トレンドで使っているアイテムを非公開にするときは確認する（?force=true で続ける）
      if (def.table === "products" && row.isPublished && changes.isPublished === false && !force) {
        const usage = productUsage(String(row.id));
        if (usage.outfitIds.length || usage.trendIds.length)
          throw errors.conflict("PRODUCT_IN_USE", "このアイテムは公開中のコーデ・トレンドで使われています。", usage);
      }

      const before = snapshot(row);
      Object.assign(row, changes);
      touch(row);
      writeAudit(user!.id, def.table, "update", before, row);
      return withEtag(def, row);
    },
    { auth: "admin" }
  ),
});
