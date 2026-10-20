import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
