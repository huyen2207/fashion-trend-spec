// A-12 コミュニティ告知の画像
import { api, json, route } from "@/lib/api/http";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async () => {
      const rows = await prisma.communityImage.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, image: true },
      });
      return json({ items: rows });
    },
    { cache: "public" }
  ),
});
