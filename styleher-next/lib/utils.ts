import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ages, categories, outfits, posts, products, scenes, tastes, trends, type Option, type Outfit } from "./data";

// Tailwind のクラスをまとめる（shadcn/ui で使う）
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unsplash の画像ID → URL。パス（"/" や "." を含む）の場合はそのまま使う
export function img(id: string, w: number, h?: number) {
  if (/[/.]/.test(id)) return id;
  const size = h ? `w=${w}&h=${h}&fit=crop` : `w=${w}`;
  return `https://images.unsplash.com/photo-${id}?${size}&auto=format&q=70`;
}

export const money = (n: number) => "¥" + n.toLocaleString("ja-JP");

// 検索用に正規化（全角/半角をそろえ、カタカナをひらがなに変換）
export const plain = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export const dateJa = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;
export const PRODUCTS = byId(products);
export const TRENDS = byId(trends);
export const OUTFITS = byId(outfits);
export const POSTS = byId(posts);
export const SCENES = byId(scenes);
export const CATS = byId(categories);

export const nameOf = (list: Option[], id: string) => list.find((x) => x.id === id)?.name ?? id;
export const ageName = (id: string) => nameOf(ages, id);
export const tasteName = (id: string) => nameOf(tastes, id);

// コーデに使うアイテム（写真の主役アイテム main + サムネイルの items）
export const outfitItems = (o: Outfit) => (o.main ? [o.main, ...o.items] : o.items);
export const outfitPrice = (o: Outfit) => outfitItems(o).reduce((sum, id) => sum + PRODUCTS[id].price, 0);

// そのアイテムを使ったコーデ（F-11 着回し提案）
export const outfitsWith = (pid: string) => outfits.filter((o) => outfitItems(o).includes(pid));
export const wearCount = (pid: string) => outfitsWith(pid).length;

// ブラウザ保存（使えない環境でもエラーにしない）
export function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 何もしない */
  }
}
