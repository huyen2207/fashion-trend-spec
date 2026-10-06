// C-06 最近見たもの / C-07 記録する / C-08 履歴を消す
import { api, errors, json, noContent, readJson, route, Validator } from "@/lib/api/http";
import { addRecentView, isPublishedItem, ITEM_TYPES, removeWhere } from "@/lib/api/member";
import { itemSummary } from "@/lib/api/serializers";
import { db, type ItemType } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ user }) => {
      const items = db.recentViews
        .filter((r) => r.userId === user!.id)
        .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt) || b.id - a.id)
        .map((r) => ({ type: r.type, viewedAt: r.viewedAt, item: itemSummary(r.type, r.itemId) }))
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
      if (!isPublishedItem(type, id)) throw errors.notFound("記録する対象が見つかりません。");
      addRecentView(user!.id, type, id);
      return noContent();
    },
    { auth: "member" }
  ),

  DELETE: api(
    ({ user }) => {
      removeWhere(db.recentViews, (r) => r.userId === user!.id);
      return noContent();
    },
    { auth: "member" }
  ),
});
