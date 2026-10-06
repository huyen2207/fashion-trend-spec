// C-09 診断結果を取得 / C-10 保存する / C-11 消す
import { api, errors, json, noContent, readJson, route, Validator } from "@/lib/api/http";
import { profileJson, removeWhere, saveProfile, validateProfile } from "@/lib/api/member";
import { db } from "@/lib/api/store";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ user }) => {
      const p = db.styleProfiles.find((s) => s.userId === user!.id);
      if (!p) throw errors.notFound("診断結果がありません。");
      return json(profileJson(p));
    },
    { auth: "member" }
  ),

  PUT: api(
    async ({ req, user }) => {
      const v = new Validator();
      const answers = validateProfile(v, await readJson(req));
      v.check();
      return json(profileJson(saveProfile(user!.id, answers)));
    },
    { auth: "member" }
  ),

  // 診断結果がなくても 204（べき等）
  DELETE: api(
    ({ user }) => {
      removeWhere(db.styleProfiles, (s) => s.userId === user!.id);
      return noContent();
    },
    { auth: "member" }
  ),
});
