// A-13 診断のおすすめ（ログインしていなくても使える。結果は保存しない）
import { api, json, route, Validator } from "@/lib/api/http";
import { isAge, isScene, isTaste } from "@/lib/api/query";
import { recommend } from "@/lib/api/recommend";

export const { GET, POST, PUT, PATCH, DELETE } = route({
  GET: api(
    ({ req }) => {
      const sp = req.nextUrl.searchParams;
      const age = sp.get("age");
      const scene = sp.get("scene");
      const tastes = (sp.get("tastes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const v = new Validator();
      if (!age || !scene || !tastes.length) {
        if (!age) v.add("age", "年代を選んでください。");
        if (!tastes.length) v.add("tastes", "好きなテイストを選んでください。");
        if (!scene) v.add("scene", "よく着るシーンを選んでください。");
        v.check("3つの質問すべてに答えてください");
      }
      if (tastes.length > 2) v.add("tastes", "テイストは2つまで選べます");
      if (new Set(tastes).size !== tastes.length) v.add("tastes", "同じテイストが2回指定されています。");
      if (!isAge(age!)) v.add("age", `年代「${age}」は存在しません。`);
      if (!isScene(scene!)) v.add("scene", `シーン「${scene}」は存在しません。`);
      tastes.forEach((t, i) => !isTaste(t) && v.add(`tastes[${i}]`, `テイスト「${t}」は存在しません。`));
      v.check();
      return json(recommend({ ageId: age!, tasteIds: tastes, sceneId: scene! }));
    },
    { cache: "public" }
  ),
});
