"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiGet, ApiClientError, nameOf, qs, useMasters, useShopName, type Page, type ProductSummary } from "@/lib/client/api";
import { img, money } from "@/lib/utils";
import { FilterSelect } from "./FilterSelect";
import { Stagger, StaggerItem } from "./motion";
import { ChipGroup, HeartButton, LoadError, LoadingGrid, Section, SectionHeading } from "./parts";
import { useStore } from "./StoreProvider";

const PAGE = 10;
// 並び替え（F-08）。id は API（A-06）の sort の値
const SORTS = [
  { id: "recommended", name: "おすすめ順" },
  { id: "price_asc", name: "価格が安い順" },
  { id: "price_desc", name: "価格が高い順" },
  { id: "wear_count_desc", name: "着回しできる順" },
];
// 価格帯 → API の minPrice・maxPrice（docs/api.md 5.6）
const PRICES = [
  { id: "all", name: "すべて", min: undefined, max: undefined },
  { id: "0-2999", name: "〜¥2,999", min: undefined, max: 2999 },
  { id: "3000-6999", name: "¥3,000〜¥6,999", min: 3000, max: 6999 },
  { id: "7000-", name: "¥7,000〜", min: 7000, max: undefined },
];

function ProductCard({ p }: { p: ProductSummary }) {
  const { open } = useStore();
  const masters = useMasters();
  const shopName = useShopName();
  const wear = p.wearCount;
  return (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition hover:-translate-y-0.5 hover:shadow-md">
      <button className="relative block aspect-[10/11] overflow-hidden" aria-label={`${p.name}の詳細を見る`} onClick={() => open("product", p.id)}>
        <img src={img(p.image, 400, 440)} alt={p.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
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
          {nameOf(masters?.categories, p.categoryId)} · {nameOf(masters?.colors, p.colorId)} · {shopName(p.recommendedShopId)}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-serif text-lg font-semibold">{money(p.price)}</span>
          <HeartButton type="product" id={p.id} />
        </div>
        <Button asChild size="sm" className="rounded-full">
          <a href={p.purchaseUrl} target="_blank" rel="noopener">
            購入する <ExternalLink />
          </a>
        </Button>
      </div>
    </Card>
  );
}

const INITIAL = { cat: "all", color: "all", price: "all", sort: "recommended" };

export function ProductSection() {
  const masters = useMasters();
  const categories = [{ id: "all", name: "すべて" }, ...(masters?.categories ?? [])];
  const COLORS = [{ id: "all", name: "すべて" }, ...(masters?.colors ?? [])];
  const [state, setState] = useState(INITIAL);
  const set = (patch: Partial<typeof INITIAL>) => setState({ ...state, ...patch });

  // 絞り込み・並び替えは API（A-06）で行い、10件ずつ取る。「もっと見る」で次の10件を足す
  const price = PRICES.find((x) => x.id === state.price) ?? PRICES[0];
  const query = qs({ category: state.cat, color: state.color, minPrice: price.min, maxPrice: price.max, sort: state.sort, limit: PAGE });
  const [pages, setPages] = useState<{ query: string; items: ProductSummary[]; total: number } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ query: string; error: ApiClientError } | null>(null);
  const [nonce, setNonce] = useState(0);

  // 条件を変えたら、1ページ目から取り直す
  useEffect(() => {
    let alive = true;
    apiGet<Page<ProductSummary>>(`/products${query}&offset=0`).then(
      (r) => alive && (setPages({ query, items: r.items, total: r.total }), setError(null)),
      (e: ApiClientError) => alive && setError({ query, error: e })
    );
    return () => {
      alive = false;
    };
  }, [query, nonce]);

  const more = async () => {
    if (!pages) return;
    setLoadingMore(true);
    try {
      const r = await apiGet<Page<ProductSummary>>(`/products${pages.query}&offset=${pages.items.length}`);
      // 読み込みの間にデータが変わってページがずれても、同じアイテムを2回出さない
      setPages((p) => {
        if (!p || p.query !== pages.query) return p;
        const seen = new Set(p.items.map((x) => x.id));
        return { ...p, items: [...p.items, ...r.items.filter((x) => !seen.has(x.id))], total: r.total };
      });
    } catch (e) {
      setError({ query: pages.query, error: e as ApiClientError });
    } finally {
      setLoadingMore(false);
    }
  };

  const list = pages?.items;
  const rest = pages ? pages.total - pages.items.length : 0;
  const shownError = error?.query === query ? error.error : undefined;

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

      {shownError ? (
        <LoadError error={shownError} onRetry={() => setNonce((n) => n + 1)} />
      ) : !list ? (
        <LoadingGrid count={10} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-5" itemClassName="aspect-[10/17]" />
      ) : list.length ? (
        <Stagger className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" gap={0.05}>
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard p={p} />
              </StaggerItem>
            ))}
          </AnimatePresence>
        </Stagger>
      ) : (
        <p className="py-10 text-center text-muted-foreground">条件に合うアイテムがありません。</p>
      )}

      {rest > 0 && !shownError && (
        <div className="mt-8 text-center">
          <Button variant="outline" className="rounded-full px-8" disabled={loadingMore} onClick={more}>
            {loadingMore ? "読み込み中…" : `もっと見る（残り${rest}件）`}
          </Button>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        ※価格は参考価格です。写真を押すとアイテム詳細（着回しコーデ・ショップ比較）が開きます。「購入する」を押すと、楽天市場・Amazonの検索結果ページが開きます。
      </p>
    </Section>
  );
}
