// D-01 一覧（非公開も含む） / D-03 登録
import { findRow, inAuditedTransaction, RESOURCES, type ResourceDef } from "@/lib/api/admin";
import { loadCatalog } from "@/lib/api/catalog";
import { api, errors, etagOf, json, pageParams, paginate, readJson, route, Validator } from "@/lib/api/http";
import { plain } from "@/lib/api/serializers";

function resourceOf(name: string): ResourceDef {
  const def = RESOURCES[name];
  if (!def) throw errors.notFound("APIが見つかりません。URLを確認してください。");
  return def;
}

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async (c) => {
      const def = resourceOf(c.params.resource);
      const sp = c.req.nextUrl.searchParams;
      const v = new Validator();
      const isPublished = v.boolParam(sp.get("isPublished"), "isPublished");
      const q = sp.get("q");
      const page = pageParams(c, 50, 100, v);
      v.check();
      const rows = def
        .rows(await loadCatalog())
        .filter((r) => (isPublished === undefined || r.isPublished === isPublished) && (!q || plain(def.searchText(r)).includes(plain(q))))
        .sort(def.order);
      return json(paginate(rows, page));
    },
    { auth: "admin" }
  ),

  POST: api(
    async ({ req, params, user }) => {
      const def = resourceOf(params.resource);
      const body = await readJson(req);
      const catalog = await loadCatalog();
      const v = new Validator();
      // 文字列IDのリソースは、登録時にIDを指定する。自動採番のリソースは指定しない
      const id = def.autoId ? undefined : v.id(body.id, "id", "ID");
      const data = def.parse(body, v, catalog, id);
      v.check();
      if (id !== undefined && findRow(def, catalog, id)) throw errors.conflict("ID_ALREADY_EXISTS", `ID「${id}」はすでに使われています。`);

      // 変更履歴（insert）は DB のトリガーが記録する
      const newId = await inAuditedTransaction(user!.id, (tx) => def.save(tx, id, data, true));
      const row = findRow(def, await loadCatalog(), String(newId))!;
      return json(row, 201, {
        Location: `/api/v1/admin/${params.resource}/${row.id}`,
        ETag: etagOf(`${def.table}:${row.id}`, row.updatedAt),
      });
    },
    { auth: "admin" }
  ),
});
