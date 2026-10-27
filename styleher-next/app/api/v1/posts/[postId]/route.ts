// A-10 コラム記事
import { api, errors, json, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ params }) => {
      const p = await prisma.post.findFirst({
        where: { id: params.postId, isPublished: true },
        include: { paragraphs: { orderBy: { sortOrder: "asc" } } },
      });
      if (!p) throw errors.notFound("コラムが見つかりません。");
      return json({
        id: p.id,
        title: p.title,
        tagId: p.tagId,
        publishedOn: p.publishedOn.toISOString().slice(0, 10),
        image: p.image,
        excerpt: p.excerpt,
        paragraphs: p.paragraphs.map((x) => x.body),
      });
    },
    { cache: "public" }
  ),
});
