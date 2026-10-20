// A-08 ショップ一覧
import { api, json, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async () => {
      const rows = await prisma.shop.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, name: true, url: true, shopType: true },
      });
      return json({ items: rows });
    },
    { cache: "public" }
  ),
});
