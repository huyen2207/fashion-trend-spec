// C-12 ブラウザ（localStorage）に保存していた内容を引き継ぐ（docs/db.md 8.2）
// まちがった値・存在しないID・非公開のものは、エラーにせず飛ばす
import { api, json, readJson, route, Validator } from "@/lib/api/http";
import { addFavorite, addRecentView, isPublishedItem, ITEM_TYPES, saveProfile, validateProfile } from "@/lib/api/member";
import { db, type ItemType } from "@/lib/api/store";

const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

export const { GET, POST, PUT, PATCH, DELETE } = route({
  POST: api(
    async ({ req, user }) => {
      const body = await readJson(req);
      const userId = user!.id;

      // styleher:favorites → { trend: ID[], outfit: ID[], product: ID[] }
      const favorites = { added: 0, skipped: 0 };
      if (isRecord(body.favorites)) {
        for (const type of ITEM_TYPES) {
          const ids = body.favorites[type];
          if (!Array.isArray(ids)) continue;
          for (const id of ids) {
            if (typeof id === "string" && isPublishedItem(type, id) && addFavorite(userId, type, id)) favorites.added++;
            else favorites.skipped++;
          }
        }
      }

      // styleher:recent → ["種類:ID", ...]（新しい順）。並び順を保つよう、日時を1ミリ秒ずつずらして入れる
      const recentViews = { added: 0, skipped: 0 };
      if (Array.isArray(body.recent)) {
        const now = Date.now();
        body.recent.forEach((key, i) => {
          const [type, id] = typeof key === "string" ? key.split(":") : [];
          if (ITEM_TYPES.includes(type as ItemType) && id && isPublishedItem(type as ItemType, id)) {
            addRecentView(userId, type as ItemType, id, new Date(now - i).toISOString());
            recentViews.added++;
          } else recentViews.skipped++;
        });
      }

      // styleher:profile → { age, tastes, scene }。DBに結果がないときだけ保存する（DBを優先）
      let styleProfile: "created" | "kept" | "none" = "none";
      if (db.styleProfiles.some((s) => s.userId === userId)) {
        if (body.profile) styleProfile = "kept";
      } else if (isRecord(body.profile)) {
        const v = new Validator();
        const answers = validateProfile(v, { ageId: body.profile.age, tasteIds: body.profile.tastes, sceneId: body.profile.scene });
        if (!v.details.length) {
          saveProfile(userId, answers);
          styleProfile = "created";
        }
      }

      return json({ favorites, recentViews, styleProfile });
    },
    { auth: "member" }
  ),
});
