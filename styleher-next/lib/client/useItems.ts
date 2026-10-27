"use client";

// お気に入り・最近見たもの（ブラウザに保存したID）から、表示用の概要をまとめて取る。
// 種類ごとに A-02・A-04・A-06 の ids パラメーター（1回50件まで）で取得する（docs/api.md 9.1）
import { useEffect, useState } from "react";
import { apiGet, ApiClientError, type List, type OutfitSummary, type Page, type ProductSummary, type TrendSummary } from "./api";

export type ItemType = "trend" | "outfit" | "product";
export type ItemRef = { type: ItemType; id: string };
export type Item =
  | { type: "trend"; id: string; data: TrendSummary }
  | { type: "outfit"; id: string; data: OutfitSummary }
  | { type: "product"; id: string; data: ProductSummary };

const PATHS: Record<ItemType, string> = { trend: "/trends", outfit: "/outfits", product: "/products" };
const MAX_IDS = 50;

async function fetchType(type: ItemType, ids: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += MAX_IDS) chunks.push(ids.slice(i, i + MAX_IDS));
  const lists = await Promise.all(
    chunks.map((c) => {
      const q = `?ids=${encodeURIComponent(c.join(","))}${type === "product" ? `&limit=${MAX_IDS}` : ""}`;
      return apiGet<List<TrendSummary | OutfitSummary | ProductSummary> | Page<ProductSummary>>(PATHS[type] + q);
    })
  );
  return lists.flatMap((l) => l.items);
}

// refs の順番どおりに返す。存在しない・非公開になったものは入らない
export function useItems(refs: ItemRef[]) {
  const key = refs.map((r) => `${r.type}:${r.id}`).join(",");
  const [state, setState] = useState<{ key: string; items?: Item[]; error?: ApiClientError }>({ key: "" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    const byType = (type: ItemType) => [...new Set(refs.filter((r) => r.type === type).map((r) => r.id))];
    const types: ItemType[] = ["trend", "outfit", "product"];
    Promise.all(types.map((t) => (byType(t).length ? fetchType(t, byType(t)) : Promise.resolve([]))))
      .then((lists) => {
        if (!alive) return;
        const found = new Map(types.flatMap((t, i) => lists[i].map((x) => [`${t}:${x.id}`, x] as const)));
        const items = refs.flatMap((r) => {
          const data = found.get(`${r.type}:${r.id}`);
          return data ? [{ type: r.type, id: r.id, data } as Item] : [];
        });
        setState({ key, items });
      })
      .catch((error: ApiClientError) => alive && setState({ key, error }));
    return () => {
      alive = false;
    };
    // refs の中身は key で比べる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const fresh = state.key === key;
  return {
    items: fresh ? state.items : undefined,
    // 外したときに一覧が一瞬消えないよう、読み込み中は前の結果も使えるようにする
    lastItems: state.items,
    error: fresh ? state.error : undefined,
    reload: () => setNonce((n) => n + 1),
  };
}
