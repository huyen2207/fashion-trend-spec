// A-01 マスタの取得
import { api, json, route } from "@/lib/api/http";
import { bySortOrder } from "@/lib/api/serializers";
import { db, type MasterRow } from "@/lib/api/store";

const published = <T extends MasterRow>(list: T[]) => list.filter((x) => x.isPublished).sort(bySortOrder);
const option = (x: MasterRow) => ({ id: x.id, name: x.name });

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    () =>
      json({
        scenes: published(db.scenes).map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
        ages: published(db.ages).map(option),
        tastes: published(db.tastes).map(option),
        categories: published(db.categories).map(option),
        colors: published(db.colors).map(option),
        postTags: published(db.postTags).map(option),
        inquiryTypes: published(db.inquiryTypes).map(option),
      }),
    { cache: "public" }
  ),
});
