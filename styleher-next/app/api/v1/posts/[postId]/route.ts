// A-10 コラム記事
import { api, errors, json, route } from "@/lib/api/http";
import { findPublished, postDetail } from "@/lib/api/serializers";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ params }) => {
      const p = findPublished.post(params.postId);
      if (!p) throw errors.notFound("コラムが見つかりません。");
      return json(postDetail(p));
    },
    { cache: "public" }
  ),
});
