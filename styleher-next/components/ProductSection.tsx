"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { categories, products, type Product } from "@/lib/data";
import { CATS, img, money, wearCount } from "@/lib/utils";
import { FilterSelect } from "./FilterSelect";
import { Stagger, StaggerItem } from "./motion";
import { ChipGroup, HeartButton, Section, SectionHeading } from "./parts";
import { useStore } from "./StoreProvider";

const PAGE = 10;
const INITIAL = { cat: "all", color: "all", price: "all", sort: "recommend" };
const COLORS = [{ id: "all", name: "すべて" }, ...[...new Set(products.map((p) => p.color))].map((c) => ({ id: c, name: c }))];
const SORTS = [
  { id: "recommend", name: "おすすめ順" },
  { id: "price-asc", name: "価格が安い順" },
  { id: "price-desc", name: "価格が高い順" },
  { id: "wear", name: "着回しできる順" },
];
const PRICES = [
  { id: "all", name: "すべて" },
  { id: "0-2999", name: "〜¥2,999" },
  { id: "3000-6999", name: "¥3,000〜¥6,999" },
  { id: "7000-9999999", name: "¥7,000〜" },
];

// 並び替え（F-08）
const SORTERS: Record<string, (a: Product, b: Product) => number> = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  wear: (a, b) => wearCount(b.id) - wearCount(a.id),
};

function ProductCard({ p }: { p: Product }) {
  const { open } = useStore();
  const wear = wearCount(p.id);
  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition hover:-translate-y-0.5 hover:shadow-md">
      <button className="relative block aspect-[10/11] overflow-hidden" aria-label={`${p.name}の詳細を見る`} onClick={() => open("product", p.id)}>
        <img src={img(p.img, 400, 440)} alt={p.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        {wear > 0 && (
          <Badge variant="secondary" className="absolute bottom-2 left-2 bg-white/90">
            着回し {wear}コーデ
          </Badge>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <button className="text-left text-sm leading-snug font-medium hover:text-rose" onClick={() => open("product", p.id)}>
          {p.name}
        </button>
        <p className="text-[11px] text-muted-foreground">
          {CATS[p.cat].name} · {p.color} · {p.shop}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-serif text-lg font-semibold">{money(p.price)}</span>
          <HeartButton type="product" id={p.id} />
        </div>
        <Button asChild size="sm" className="rounded-full">
          <a href={p.url} target="_blank" rel="noopener">
            購入する <ExternalLink />
          </a>
        </Button>
      </div>
    </Card>
  );
}

export function ProductSection() {
  const [state, setState] = useState(INITIAL);
  const [limit, setLimit] = useState(PAGE);
  // 条件を変えたら、表示件数を最初に戻す
  const set = (patch: Partial<typeof INITIAL>) => {
    setState({ ...state, ...patch });
    setLimit(PAGE);
  };

  const [min, max] = state.price === "all" ? [0, Infinity] : state.price.split("-").map(Number);
  const list = products.filter(
    (p) =>
      (state.cat === "all" || p.cat === state.cat) &&
      (state.color === "all" || p.color === state.color) &&
      p.price >= min &&
      p.price <= max
  );
  if (SORTERS[state.sort]) list.sort(SORTERS[state.sort]);

  return (
    <Section id="products">
      <SectionHeading title="おすすめアイテム" en="ITEM">
        <Button variant="link" className="px-0 text-foreground" onClick={() => set(INITIAL)}>
          条件をリセット <ArrowRight />
        </Button>
      </SectionHeading>

      <div className="mb-6 space-y-3">
        <ChipGroup label="カテゴリー" options={categories} value={state.cat} onChange={(cat) => set({ cat })} />
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="カラー" value={state.color} options={COLORS} onChange={(color) => set({ color })} />
          <FilterSelect label="並び替え" value={state.sort} options={SORTS} onChange={(sort) => set({ sort })} />
          <FilterSelect label="価格" value={state.price} options={PRICES} onChange={(price) => set({ price })} />
        </div>
      </div>

      {list.length ? (
        <Stagger className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" gap={0.05}>
          <AnimatePresence mode="popLayout">
            {list.slice(0, limit).map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard p={p} />
              </StaggerItem>
            ))}
          </AnimatePresence>
        </Stagger>
      ) : (
        <p className="py-10 text-center text-muted-foreground">条件に合うアイテムがありません。</p>
      )}

      {list.length > limit && (
        <div className="mt-8 text-center">
          <Button variant="outline" className="rounded-full px-8" onClick={() => setLimit(limit + PAGE)}>
            もっと見る（残り{list.length - limit}件）
          </Button>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        ※価格は参考価格です。写真を押すとアイテム詳細（着回しコーデ・ショップ比較）が開きます。「購入する」を押すと、楽天市場・Amazonの検索結果ページが開きます。
      </p>
    </Section>
  );
}
