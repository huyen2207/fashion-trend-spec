// A-05 コーデ詳細
import { loadCatalog } from "@/lib/api/catalog";
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, outfitDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ params }) => {
      const c = await loadCatalog();
      const o = findPublished.outfit(c, params.outfitId);
      if (!o) throw errors.notFound("コーデが見つかりません。");
      return json(outfitDetail(c, o));
    },
    { cache: "public" }
  ),
});
