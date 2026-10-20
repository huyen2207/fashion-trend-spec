// 診断のおすすめ（docs/設計書.md 4.9。画面の components/Shindan.tsx の recommend() と同じ点数の付け方）
import type { Catalog } from "./catalog";
import { outfitSummary, publishedOutfits, publishedTrends, trendSummary } from "./serializers";

export type Answers = { ageId: string; tasteIds: string[]; sceneId: string };

export function recommend(c: Catalog, { ageId, tasteIds, sceneId }: Answers) {
  const [main, sub] = tasteIds;
  // 1つ目のテイストは w 点、2つ目は w/2 点
  const tasteScore = (list: string[], w: number) => (list.includes(main) ? w : 0) + (sub && list.includes(sub) ? w / 2 : 0);
  // 0点は出さず、点の高い順。同じ点なら並び順（安定ソート）
  const top = <T,>(list: T[], score: (x: T) => number, n: number) =>
    list
      .map((x) => ({ x, score: score(x) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((r) => r.x);
  return {
    // 点数そのものは返さない（内部の値。docs/api.md 3.2）
    trends: top(publishedTrends(c), (t) => (t.ageIds.includes(ageId) ? 2 : 0) + tasteScore(t.tasteIds, 4), 2).map(trendSummary),
    outfits: top(
      publishedOutfits(c),
      (o) => (o.sceneId === sceneId ? 4 : 0) + (o.ageIds.includes(ageId) ? 2 : 0) + tasteScore(o.tasteIds, 2),
      4
    ).map((o) => outfitSummary(c, o)),
  };
}
