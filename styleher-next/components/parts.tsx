"use client";

import { ExternalLink, Heart, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  nameOf,
  useMasters,
  useShopName,
  type ApiClientError,
  type Option,
  type OutfitSummary,
  type PostSummary,
  type ProductSummary,
  type Shop,
  type TrendSummary,
} from "@/lib/client/api";
import { cn, img, money } from "@/lib/utils";
import { Reveal } from "./motion";
import { useStore, type FavType, type OpenType } from "./StoreProvider";

// ---------- 見出し ----------
export function SectionHeading({ title, en, sub, children }: { title: string; en: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-serif text-xs tracking-[0.3em] text-rose">{en}</p>
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {/* 英字ラベルの下に、左から伸びる線 */}
        <motion.span
          aria-hidden="true"
          className="mt-2 block h-px w-12 origin-left bg-rose"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </Reveal>
  );
}

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-6xl px-4 py-12 md:py-16", className)}>
      {children}
    </section>
  );
}

// ---------- カード全体を押すと詳細が開く（Enter / Space でも開ける） ----------
export function OpenCard({
  type,
  id,
  label,
  className,
  children,
}: {
  type: OpenType;
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useStore();
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(type, id);
    }
  };
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => open(type, id)}
      onKeyDown={onKeyDown}
      className={cn(
        "group cursor-pointer gap-0 overflow-hidden py-0 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      {children}
    </Card>
  );
}

// ---------- お気に入り ----------
export function HeartButton({ type, id, className }: { type: FavType; id: string; className?: string }) {
  const { isFav, toggleFav } = useStore();
  const on = isFav(type, id);
  const [pulse, setPulse] = useState(0);
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav(type, id);
    setPulse((n) => n + 1);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("shrink-0 rounded-full text-muted-foreground hover:text-rose", on && "text-rose", className)}
      aria-pressed={on}
      aria-label={on ? "お気に入りから外す" : "お気に入りに追加"}
      onClick={onClick}
    >
      <HeartPop on={on} pulse={pulse} className="size-5" />
    </Button>
  );
}

export function FavButtonLarge({ type, id }: { type: FavType; id: string }) {
  const { isFav, toggleFav } = useStore();
  const on = isFav(type, id);
  const [pulse, setPulse] = useState(0);
  const onClick = () => {
    toggleFav(type, id);
    setPulse((n) => n + 1);
  };
  return (
    <Button variant="outline" className={cn("rounded-full", on && "border-rose text-rose")} aria-pressed={on} onClick={onClick}>
      <HeartPop on={on} pulse={pulse} />
      {on ? "保存済み" : "お気に入りに保存"}
    </Button>
  );
}

// pulse が増えたとき（＝押したとき）だけ弾ませる
function HeartPop({ on, pulse, className }: { on: boolean; pulse: number; className?: string }) {
  return (
    <motion.span
      key={pulse}
      className="inline-flex"
      initial={pulse ? { scale: on ? 0.4 : 1.3 } : false}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 12 }}
    >
      <Heart className={cn(className, on && "fill-current")} />
    </motion.span>
  );
}

// ---------- 年代・カテゴリーなどを1つ選ぶチップ ----------
export function ChipGroup({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
}) {
  const pillId = useId();
  return (
    <ToggleGroup
      type="single"
      spacing={2}
      value={value}
      // もう一度押しても選択を外さない（常にどれか1つを選んだ状態にする）
      onValueChange={(v) => v && onChange(v)}
      aria-label={label}
      className={cn("flex-wrap", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.id} value={o.id} className={cn(chipClass, "relative data-[state=on]:border-transparent data-[state=on]:bg-transparent")}>
          {o.id === value && (
            <motion.span
              layoutId={pillId}
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{o.name}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export const chipClass =
  "h-9 rounded-full border border-input bg-card px-4 text-sm font-normal hover:bg-secondary hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

// ---------- 検索結果・お気に入り・最近見たものなどで使う一覧の行 ----------
function ResultButton({ type, id, image, title, sub }: { type: OpenType; id: string; image: string; title: string; sub: string }) {
  const { open } = useStore();
  return (
    <button
      className="flex w-full min-w-0 items-center gap-3 rounded-lg border bg-card p-2 text-left transition hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      onClick={() => open(type, id)}
    >
      <img src={img(image, 110, 130)} alt="" className="size-14 shrink-0 rounded-md object-cover" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

export const TrendResult = ({ t }: { t: TrendSummary }) => (
  <ResultButton type="trend" id={t.id} image={t.image} title={t.name} sub={`トレンド · ${t.subtitle}`} />
);
export function OutfitResult({ o }: { o: OutfitSummary }) {
  const scenes = useMasters()?.scenes;
  return <ResultButton type="outfit" id={o.id} image={o.image} title={o.title} sub={`${nameOf(scenes, o.sceneId)} · ${money(o.totalPrice)}〜`} />;
}
export const ProductResult = ({ p }: { p: ProductSummary }) => (
  <ResultButton type="product" id={p.id} image={p.image} title={p.name} sub={`アイテム · ${money(p.price)}`} />
);
export function PostResult({ p }: { p: PostSummary }) {
  const tags = useMasters()?.postTags;
  return <ResultButton type="post" id={p.id} image={p.image} title={p.title} sub={`コラム · ${nameOf(tags, p.tagId)}`} />;
}
export const ShopResult = ({ s }: { s: Shop }) => (
  <a
    className="flex w-full items-center gap-3 rounded-lg border bg-card p-2 transition hover:bg-secondary"
    href={s.url}
    target="_blank"
    rel="noopener"
  >
    <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-secondary p-1 text-center font-serif text-[11px] leading-tight">
      {s.name}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-medium">{s.name}</span>
      <span className="block text-xs text-muted-foreground">ショップ · {s.shopType}</span>
    </span>
  </a>
);

export function ResultList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2 sm:grid-cols-2", className)}>{children}</div>;
}

export function MiniProduct({ p }: { p: ProductSummary }) {
  const { open } = useStore();
  const shopName = useShopName();
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2">
      <button className="shrink-0" aria-label={`${p.name}の詳細を見る`} onClick={() => open("product", p.id)}>
        <img src={img(p.image, 120, 140)} alt="" loading="lazy" className="h-16 w-14 rounded-md object-cover" />
      </button>
      <div className="min-w-0 text-sm">
        <button className="block truncate text-left font-medium hover:text-rose" onClick={() => open("product", p.id)}>
          {p.name}
        </button>
        <span className="text-muted-foreground">{money(p.price)}</span>
        <a href={p.purchaseUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-rose hover:underline">
          {shopName(p.recommendedShopId) || "ショップ"}で見る <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

// ---------- API の読み込み中・エラー ----------
// 読み込み中：カードの形の薄い箱を並べる
export function LoadingGrid({ count = 4, className, itemClassName }: { count?: number; className?: string; itemClassName?: string }) {
  return (
    <div className={cn("grid gap-4", className)} aria-busy="true" aria-label="読み込み中">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("animate-pulse rounded-xl bg-secondary", itemClassName)} />
      ))}
    </div>
  );
}

// 読み込めなかったとき：理由と「もう一度読み込む」ボタン
export function LoadError({ error, onRetry, className }: { error: ApiClientError; onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground", className)}>
      <p>{error.status === 404 ? "見つかりませんでした。" : error.message}</p>
      {error.status !== 404 && (
        <Button variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          <RotateCw /> もう一度読み込む
        </Button>
      )}
    </div>
  );
}
