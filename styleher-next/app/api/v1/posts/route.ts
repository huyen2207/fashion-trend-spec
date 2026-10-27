// A-09 コラム一覧（公開日の新しい順。同じ日はIDの順）
import { loadMasters } from "@/lib/api/catalog";
import { api, json, pageParams, paged, route, Validator } from "@/lib/api/http";
import { masterChecks, optionalRef } from "@/lib/api/query";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async (c) => {
      const v = new Validator();
      const tag = optionalRef(v, c.req.nextUrl.searchParams.get("tag"), "tag", "タグ", masterChecks(await loadMasters()).isPostTag);
      const page = pageParams(c, 20, 50, v);
      v.check();
      const where = { isPublished: true, ...(tag && { tagId: tag }) };
      const [rows, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: [{ publishedOn: "desc" }, { id: "asc" }],
          skip: page.offset,
          take: page.limit,
          select: { id: true, title: true, tagId: true, publishedOn: true, image: true, excerpt: true },
        }),
        prisma.post.count({ where }),
      ]);
      const items = rows.map((p) => ({ ...p, publishedOn: p.publishedOn.toISOString().slice(0, 10) }));
      return json(paged(items, total, page));
    },
    { cache: "public" }
  ),
});
