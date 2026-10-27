// C-06 最近見たもの / C-07 記録する / C-08 履歴を消す
import { iso, loadCatalog, type ItemType } from "@/lib/api/catalog";
import { api, errors, json, noContent, readJson, route, Validator } from "@/lib/api/http";
import { addRecentView, isPublishedItem, itemOf, ITEM_TYPES } from "@/lib/api/member";
import { itemSummary } from "@/lib/api/serializers";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ user }) => {
      const [rows, c] = await Promise.all([
        prisma.recentView.findMany({ where: { userId: user!.id }, orderBy: [{ viewedAt: "desc" }, { id: "desc" }] }),
        loadCatalog(),
      ]);
      const items = rows
        .map((r) => {
          const { type, itemId } = itemOf(r);
          return { type, viewedAt: iso(r.viewedAt), item: itemSummary(c, type, itemId) };
        })
        // 非公開になったものは出さない
        .filter((r) => r.item);
      return json({ items });
    },
    { auth: "member" }
  ),

  POST: api(
    async ({ req, user }) => {
      const body = await readJson(req);
      const v = new Validator();
      if (!ITEM_TYPES.includes(body.type as ItemType)) v.add("type", "type は trend / outfit / product のいずれかにしてください。");
      const id = v.str(body.id, "id", { max: 30, label: "ID" });
      v.check();
      const type = body.type as ItemType;
      if (!(await isPublishedItem(type, id))) throw errors.notFound("記録する対象が見つかりません。");
      await prisma.$transaction((tx) => addRecentView(user!.id, type, id, new Date(), tx));
      return noContent();
    },
    { auth: "member" }
  ),

  DELETE: api(
    async ({ user }) => {
      await prisma.recentView.deleteMany({ where: { userId: user!.id } });
      return noContent();
    },
    { auth: "member" }
  ),
});
