// C-04 お気に入りに追加する / C-05 お気に入りから外す（どちらも何度呼んでも結果が同じ）
import { api, errors, noContent, route } from "@/lib/api/http";
import { addFavorite, COLLECTIONS, isPublishedItem, itemWhere } from "@/lib/api/member";
import { prisma } from "@/lib/db";

// コレクション名がちがうときは、パスが存在しないのと同じ 404
function typeOf(collection: string) {
  const type = COLLECTIONS[collection];
  if (!type) throw errors.notFound("APIが見つかりません。URLを確認してください。");
  return type;
}

export const { GET, POST, PUT, PATCH, DELETE } = route({
  PUT: api(
    async ({ user, params }) => {
      const type = typeOf(params.collection);
      if (!(await isPublishedItem(type, params.itemId))) throw errors.notFound("お気に入りにする対象が見つかりません。");
      await addFavorite(user!.id, type, params.itemId);
      return noContent();
    },
    { auth: "member" }
  ),
  DELETE: api(
    async ({ user, params }) => {
      const type = typeOf(params.collection);
      await prisma.favorite.deleteMany({ where: { userId: user!.id, ...itemWhere(type, params.itemId) } });
      return noContent();
    },
    { auth: "member" }
  ),
});
