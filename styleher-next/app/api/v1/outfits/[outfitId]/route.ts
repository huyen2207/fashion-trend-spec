// A-05 コーデ詳細
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, outfitDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ params }) => {
      const o = findPublished.outfit(params.outfitId);
      if (!o) throw errors.notFound("コーデが見つかりません。");
      return json(outfitDetail(o));
    },
    { cache: "public" }
  ),
});
