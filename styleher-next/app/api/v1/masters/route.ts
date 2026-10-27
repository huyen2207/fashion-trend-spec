// A-01 マスタの取得
import { loadMasters, type MasterRow } from "@/lib/api/catalog";
import { api, json, route } from "@/lib/api/http";
import { bySortOrder } from "@/lib/api/serializers";

const published = <T extends MasterRow>(list: T[]) => list.filter((x) => x.isPublished).sort(bySortOrder);
const option = (x: MasterRow) => ({ id: x.id, name: x.name });

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async () => {
      const m = await loadMasters();
      return json({
        scenes: published(m.scenes).map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
        ages: published(m.ages).map(option),
        tastes: published(m.tastes).map(option),
        categories: published(m.categories).map(option),
        colors: published(m.colors).map(option),
        postTags: published(m.postTags).map(option),
        inquiryTypes: published(m.inquiryTypes).map(option),
      });
    },
    { cache: "public" }
  ),
});
