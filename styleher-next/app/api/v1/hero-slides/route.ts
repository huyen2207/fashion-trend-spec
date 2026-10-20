// A-11 メインビジュアル
import { api, json, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async () => {
      const rows = await prisma.heroSlide.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, image: true, imagePosition: true, title: true, body: true },
      });
      return json({ items: rows });
    },
    { cache: "public" }
  ),
});
