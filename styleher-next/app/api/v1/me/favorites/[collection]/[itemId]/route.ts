// C-04 お気に入りに追加する / C-05 お気に入りから外す（どちらも何度呼んでも結果が同じ）
import { api, errors, noContent, route } from "@/lib/api/http";
import { addFavorite, COLLECTIONS, isPublishedItem, removeWhere } from "@/lib/api/member";
import { db } from "@/lib/api/store";

// コレクション名がちがうときは、パスが存在しないのと同じ 404
function typeOf(collection: string) {
  const type = COLLECTIONS[collection];
  if (!type) throw errors.notFound("APIが見つかりません。URLを確認してください。");
  return type;
}

export const { GET, POST, PUT, PATCH, DELETE } = route({
  PUT: api(
    ({ user, params }) => {
      const type = typeOf(params.collection);
      if (!isPublishedItem(type, params.itemId)) throw errors.notFound("お気に入りにする対象が見つかりません。");
      addFavorite(user!.id, type, params.itemId);
      return noContent();
    },
    { auth: "member" }
  ),
  DELETE: api(
    ({ user, params }) => {
      const type = typeOf(params.collection);
      removeWhere(db.favorites, (f) => f.userId === user!.id && f.type === type && f.itemId === params.itemId);
      return noContent();
    },
    { auth: "member" }
  ),
});
