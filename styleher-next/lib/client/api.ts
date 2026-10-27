"use client";

// ===== 画面から API（/api/v1）を呼ぶための型と仕組み（docs/api.md） =====
import { useCallback, useEffect, useState } from "react";

// ---- レスポンスの型（docs/api.md 5.0 ほか） ----
export type Option = { id: string; name: string };
export type SceneIcon = "briefcase" | "bag" | "heart" | "sparkle" | "plane" | "home";
export type Scene = Option & { icon: SceneIcon };
export type Masters = {
  scenes: Scene[];
  ages: Option[];
  tastes: Option[];
  categories: Option[];
  colors: Option[];
  postTags: Option[];
  inquiryTypes: Option[];
};

export type TrendSummary = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  hotScore: number;
  season: string;
  postCount: number;
  ageIds: string[];
  tasteIds: string[];
};
export type ProductSummary = {
  id: string;
  name: string;
  categoryId: string;
  colorId: string;
  price: number;
  image: string;
  recommendedShopId: string;
  purchaseUrl: string;
  wearCount: number;
};
export type OutfitSummary = {
  id: string;
  sceneId: string;
  title: string;
  image: string;
  ageIds: string[];
  tasteIds: string[];
  mainProductId: string | null;
  items: { id: string; name: string; image: string; price: number }[];
  totalPrice: number;
};
export type TrendDetail = TrendSummary & {
  description: string;
  images: string[];
  points: string[];
  tips: string[];
  products: ProductSummary[];
  relatedOutfits: OutfitSummary[];
};
export type OutfitDetail = OutfitSummary & {
  description: string;
  tips: string[];
  products: (ProductSummary & { role: "main" | "item" })[];
};
export type ProductDetail = ProductSummary & {
  links: { shopId: string; shopName: string; url: string }[];
  trends: { id: string; name: string; image: string }[];
  outfits: OutfitSummary[];
};
export type PostSummary = { id: string; title: string; tagId: string; publishedOn: string; image: string; excerpt: string };
export type PostDetail = PostSummary & { paragraphs: string[] };
export type Shop = { id: string; name: string; url: string; shopType: string };
export type HeroSlide = { id: number; image: string; imagePosition: string; title: string; body: string };
export type CommunityImage = { id: number; image: string };

export type List<T> = { items: T[] };
export type Page<T> = List<T> & { total: number; limit: number; offset: number };
export type Recommendations = { trends: TrendSummary[]; outfits: OutfitSummary[] };
export type SearchResults = {
  query: string;
  trends: Page<TrendSummary>;
  outfits: Page<OutfitSummary>;
  products: Page<ProductSummary>;
  posts: Page<PostSummary>;
  shops: Page<Shop>;
};

// ---- 取得 ----
const BASE = "/api/v1";

// API のエラー（共通の形 { error: { code, message, requestId } } を受け取る。docs/api.md 3.6）
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "通信できませんでした。インターネットの接続を確認してください。");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    throw new ApiClientError(res.status, e?.code ?? "UNKNOWN", e?.message ?? "読み込めませんでした。", e?.requestId);
  }
  return body as T;
}

// 同じURLを何度も取りに行かないよう、ページを開いている間は結果を覚えておく
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function apiGet<T>(path: string): Promise<T> {
  if (cache.has(path)) return Promise.resolve(cache.get(path) as T);
  let p = inflight.get(path);
  if (!p) {
    p = apiFetch<T>(path)
      .then((data) => {
        cache.set(path, data);
        return data;
      })
      .finally(() => inflight.delete(path));
    inflight.set(path, p);
  }
  return p as Promise<T>;
}

type ApiState<T> = { path: string | null; data?: T; error?: ApiClientError };

// GET の結果を返すフック。path が null のときは取りに行かない。
// 条件を変えて読み込んでいる間は、前の結果（stale）を出したままにする（一覧がちらつかないように）
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<ApiState<T>>(() => ({ path, data: path && cache.has(path) ? (cache.get(path) as T) : undefined }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    if (cache.has(path)) {
      setState({ path, data: cache.get(path) as T });
      return;
    }
    setState((s) => ({ ...s, error: undefined }));
    apiGet<T>(path).then(
      (data) => alive && setState({ path, data }),
      (error: ApiClientError) => alive && setState((s) => ({ path, data: s.path === path ? s.data : undefined, error }))
    );
    return () => {
      alive = false;
    };
  }, [path, nonce]);

  const fresh = state.path === path;
  const reload = useCallback(() => {
    if (path) cache.delete(path);
    setNonce((n) => n + 1);
  }, [path]);

  return {
    // 今の path の結果（読み込み中は undefined）
    data: fresh ? state.data : undefined,
    // 読み込み中も前の結果を出したいとき用
    lastData: state.data,
    error: fresh ? state.error : undefined,
    loading: !!path && (!fresh || (state.data === undefined && !state.error)),
    reload,
  };
}

// クエリ文字列を作る（空の値は付けない）
export function qs(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all");
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
}

// ---- よく使うデータ ----
// マスタ（シーン・年代・テイストなどの名前）。全画面で共有し、1回だけ取りに行く
export function useMasters() {
  return useApi<Masters>("/masters").data;
}
export const nameOf = (list: Option[] | undefined, id: string) => list?.find((x) => x.id === id)?.name ?? "";

// ショップ名（アイテムのおすすめのショップ）
export function useShopName() {
  const shops = useApi<List<Shop>>("/shops").data?.items;
  return useCallback((id: string) => shops?.find((s) => s.id === id)?.name ?? "", [shops]);
}
