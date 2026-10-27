"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useApi, useMasters, type List, type TrendSummary } from "@/lib/client/api";
import { load, save } from "@/lib/utils";

// お気に入りにできる種類と、詳細モーダルで開ける種類
export type FavType = "trend" | "outfit" | "product";
export type OpenType = FavType | "post";
type Favs = Record<FavType, string[]>;

export type ModalState =
  | { kind: OpenType; id: string }
  | { kind: "search"; query: string }
  | { kind: "favorites" }
  | null;

export type OutfitFilter = { scene: string; age: string; taste: string };

const FAV_KEY = "styleher:favorites";
const RECENT_KEY = "styleher:recent";
const RECENT_MAX = 8;

type Store = {
  todayText: string;
  todayTrendId: string;
  favs: Favs;
  isFav: (type: FavType, id: string) => boolean;
  toggleFav: (type: FavType, id: string) => void;
  recent: string[];
  clearRecent: () => void;
  modal: ModalState;
  open: (type: OpenType, id: string) => void;
  openSearch: (query?: string) => void;
  openFavorites: () => void;
  closeModal: () => void;
  outfitFilter: OutfitFilter;
  setOutfitFilter: (f: OutfitFilter) => void;
};

const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore は StoreProvider の中で使ってください");
  return store;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // 今日の日付と「今日のトレンド」：書き出し時ではなく、見ている人の日付で決める
  const [today, setToday] = useState<Date | null>(null);
  const [favs, setFavs] = useState<Favs>({ trend: [], outfit: [], product: [] });
  const [recent, setRecent] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  // シーンの初期値（最初のシーン）は、マスタを API から読み込んだあとに決める
  const [outfitFilter, setOutfitFilter] = useState<OutfitFilter>({ scene: "", age: "all", taste: "all" });
  const firstScene = useMasters()?.scenes[0]?.id;
  if (firstScene && !outfitFilter.scene) setOutfitFilter({ ...outfitFilter, scene: firstScene });
  // 「今日の注目」は、公開中のトレンドの並び順から決める（docs/db.md 7.1）
  const trends = useApi<List<TrendSummary>>("/trends").data?.items;

  // ブラウザに保存した内容は、表示後に読み込む（サーバーで作ったHTMLとずれないように）
  useEffect(() => {
    setToday(new Date());
    setFavs((f) => ({ ...f, ...load<Partial<Favs>>(FAV_KEY, {}) }));
    setRecent(load<string[]>(RECENT_KEY, []));
  }, []);

  const isFav = useCallback((type: FavType, id: string) => favs[type].includes(id), [favs]);

  const toggleFav = useCallback(
    (type: FavType, id: string) => {
      const on = !favs[type].includes(id);
      const next = { ...favs, [type]: on ? [...favs[type], id] : favs[type].filter((x) => x !== id) };
      setFavs(next);
      save(FAV_KEY, next);
      toast(on ? "お気に入りに追加しました" : "お気に入りから外しました");
    },
    [favs]
  );

  // 詳細を開く（コラム以外は「最近見たもの」に記録する）
  const open = useCallback((type: OpenType, id: string) => {
    setModal({ kind: type, id });
    if (type === "post") return;
    setRecent((list) => {
      const key = `${type}:${id}`;
      const next = [key, ...list.filter((k) => k !== key)].slice(0, RECENT_MAX);
      save(RECENT_KEY, next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    save(RECENT_KEY, []);
  }, []);

  const value = useMemo<Store>(() => {
    const dayNumber = today ? Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) : 0;
    return {
      todayText: today
        ? today.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
        : "",
      todayTrendId: trends?.length ? trends[dayNumber % trends.length].id : "",
      favs,
      isFav,
      toggleFav,
      recent,
      clearRecent,
      modal,
      open,
      openSearch: (query = "") => setModal({ kind: "search", query }),
      openFavorites: () => setModal({ kind: "favorites" }),
      closeModal: () => setModal(null),
      outfitFilter,
      setOutfitFilter,
    };
  }, [today, trends, favs, isFav, toggleFav, recent, clearRecent, modal, open, outfitFilter]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
