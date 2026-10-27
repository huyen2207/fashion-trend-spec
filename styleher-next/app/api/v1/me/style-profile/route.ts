// C-09 診断結果を取得 / C-10 保存する / C-11 消す
import { loadMasters } from "@/lib/api/catalog";
import { api, errors, json, noContent, readJson, route, Validator } from "@/lib/api/http";
import { findProfile, profileJson, saveProfile, validateProfile } from "@/lib/api/member";
import { prisma } from "@/lib/db";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    async ({ user }) => {
      const p = await findProfile(user!.id);
      if (!p) throw errors.notFound("診断結果がありません。");
      return json(profileJson(p));
    },
    { auth: "member" }
  ),

  PUT: api(
    async ({ req, user }) => {
      const body = await readJson(req);
      const v = new Validator();
      const answers = validateProfile(v, await loadMasters(), body);
      v.check();
      return json(profileJson(await saveProfile(user!.id, answers)));
    },
    { auth: "member" }
  ),

  // 診断結果がなくても 204（べき等）。テイストは外部キーの CASCADE で一緒に消える
  DELETE: api(
    async ({ user }) => {
      await prisma.styleProfile.deleteMany({ where: { userId: user!.id } });
      return noContent();
    },
    { auth: "member" }
  ),
});
