"use client";

import { ExternalLink, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  nameOf,
  useApi,
  useMasters,
  type ApiClientError,
  type OutfitDetail as OutfitDetailData,
  type PostDetail as PostDetailData,
  type ProductDetail as ProductDetailData,
  type SearchResults,
  type TrendDetail as TrendDetailData,
} from "@/lib/client/api";
import { useItems, type ItemType } from "@/lib/client/useItems";
import { dateJa, img, money } from "@/lib/utils";
import {
  FavButtonLarge,
  HeartButton,
  LoadError,
  MiniProduct,
  OutfitResult,
  PostResult,
  ProductResult,
  ResultList,
  ShopResult,
  TrendResult,
} from "./parts";
import { useStore, type ModalState } from "./StoreProvider";

type DetailState = Exclude<NonNullable<ModalState>, { kind: "favorites" }>;

// ---------- 詳細・検索（Dialog）とお気に入り（Sheet） ----------
export function Overlays() {
  const { modal, closeModal } = useStore();
  const detail = modal && modal.kind !== "favorites" ? modal : null;
  // 閉じるアニメーションの間も中身を表示しておくため、最後に開いた内容を覚えておく
  const [shown, setShown] = useState<DetailState | null>(null);
  if (detail && detail !== shown) setShown(detail);
  const contentRef = useRef<HTMLDivElement>(null);

  // 別の詳細に切り替えたら、先頭までスクロールを戻す
  useEffect(() => {
    if (!detail || !contentRef.current) return;
    contentRef.current.scrollTop = 0;
    if (!contentRef.current.contains(document.activeElement)) contentRef.current.focus();
  }, [detail]);

  return (
    <>
      <Dialog open={!!detail} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent
          ref={contentRef}
          aria-describedby={undefined}
          className="max-h-[90dvh] overflow-y-auto p-5 sm:max-w-4xl md:p-8"
          // 検索のときは、入力欄にすぐ文字を打てるようにする
          onOpenAutoFocus={(e) => {
            const input = contentRef.current?.querySelector("input");
            if (input) {
              e.preventDefault();
              input.focus();
            }
          }}
        >
          {/* 詳細から別の詳細へ移ったときは、中身をふわっと入れ替える */}
          {shown && (
            <motion.div
              key={shown.kind === "search" ? "search" : `${shown.kind}:${shown.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <DetailContent state={shown} />
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
      <FavoritesSheet />
    </>
  );
}

function DetailContent({ state }: { state: DetailState }) {
  switch (state.kind) {
    case "trend":
      return <TrendDetail id={state.id} />;
    case "outfit":
      return <OutfitDetail id={state.id} />;
    case "product":
      return <ProductDetail id={state.id} />;
    case "post":
      return <PostDetail id={state.id} />;
    case "search":
      return <SearchPanel key={state.query} initial={state.query} />;
  }
}

// 詳細を API から読む間の表示。ダイアログには見出し（DialogTitle）が必要なので、読み込み中も入れておく
function DetailLoading({ error, onRetry }: { error?: ApiClientError; onRetry: () => void }) {
  return (
    <div>
      <DialogTitle className="sr-only">{error ? "読み込めませんでした" : "読み込み中"}</DialogTitle>
      {error ? (
        <LoadError error={error} onRetry={onRetry} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2" aria-busy="true">
          <div className="aspect-[10/9] animate-pulse rounded-xl bg-secondary" />
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-24 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- 詳細の共通パーツ ----------
function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-serif text-xs tracking-[0.2em] text-rose">{children}</p>;
}

function Stats({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="my-5 grid grid-cols-3 gap-2">
      {items.map((s) => (
        <div key={s.label} className="rounded-lg bg-secondary p-3">
          <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
          <dd className="text-sm font-medium">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h4 className="mt-5 mb-2 text-sm font-medium">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground marker:text-rose">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </>
  );
}

function Block({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <Separator className="mb-5" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {sub && <p className="mb-3 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

// 1枚目を大きく、残りを小さく並べる
function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const [first, ...rest] = images;
  return (
    <div className="grid grid-cols-3 gap-2">
      <img src={first.src} alt={first.alt} className="col-span-3 aspect-[10/9] w-full rounded-xl object-cover" />
      {rest.map((g) => (
        <img key={g.src} src={g.src} alt={g.alt} className="aspect-[3/4] w-full rounded-lg object-cover" />
      ))}
    </div>
  );
}

// M-01 トレンド詳細（A-03）
function TrendDetail({ id }: { id: string }) {
  const { todayTrendId } = useStore();
  const ages = useMasters()?.ages;
  const { data: t, error, reload } = useApi<TrendDetailData>(`/trends/${encodeURIComponent(id)}`);
  if (!t) return <DetailLoading error={error} onRetry={reload} />;
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <Gallery images={[t.image, ...t.images].slice(0, 4).map((g, i) => ({ src: img(g, i ? 300 : 700, i ? 400 : 630), alt: t.name }))} />
        <div>
          <Kicker>TREND {t.id === todayTrendId && "· 今日の注目"}</Kicker>
          <DialogTitle className="mt-1 font-serif text-3xl">{t.name}</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          <p className="mt-4 text-sm leading-relaxed">{t.description}</p>
          <Stats
            items={[
              {
                label: "注目度",
                value: (
                  <>
                    {t.hotScore}%
                    <Progress value={t.hotScore} className="mt-1 h-1 *:data-[slot=progress-indicator]:bg-rose" />
                  </>
                ),
              },
              { label: "シーズン", value: t.season },
              { label: "おすすめ年代", value: t.ageIds.map((x) => nameOf(ages, x)).join("・") },
            ]}
          />
          <Bullets title="ポイント" items={t.points} />
          <Bullets title="着こなしと着回しのコツ" items={t.tips} />
          <div className="mt-6">
            <FavButtonLarge type="trend" id={t.id} />
          </div>
        </div>
      </div>
      <Block title="このトレンドのアイテム">
        <div className="grid gap-2 sm:grid-cols-2">
          {t.products.map((p) => (
            <MiniProduct key={p.id} p={p} />
          ))}
        </div>
      </Block>
      {t.relatedOutfits.length > 0 && (
        <Block title="おすすめコーデ">
          <ResultList>
            {t.relatedOutfits.map((o) => (
              <OutfitResult key={o.id} o={o} />
            ))}
          </ResultList>
        </Block>
      )}
    </div>
  );
}

// M-02 コーデ詳細（A-05）
function OutfitDetail({ id }: { id: string }) {
  const masters = useMasters();
  const { data: o, error, reload } = useApi<OutfitDetailData>(`/outfits/${encodeURIComponent(id)}`);
  if (!o) return <DetailLoading error={error} onRetry={reload} />;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Gallery
        images={[{ src: img(o.image, 700, 630), alt: o.title }, ...o.items.map((p) => ({ src: img(p.image, 300, 400), alt: p.name }))]}
      />
      <div>
        <Kicker>COORDINATE · {nameOf(masters?.scenes, o.sceneId)}</Kicker>
        <DialogTitle className="mt-1 font-serif text-2xl leading-snug">{o.title}</DialogTitle>
        <p className="mt-4 text-sm leading-relaxed">{o.description}</p>
        <Stats
          items={[
            { label: "アイテム合計", value: money(o.totalPrice) },
            { label: "テイスト", value: o.tasteIds.map((x) => nameOf(masters?.tastes, x)).join("・") },
            { label: "おすすめ年代", value: o.ageIds.map((x) => nameOf(masters?.ages, x)).join("・") },
          ]}
        />
        <Bullets title="着こなしのコツ" items={o.tips} />
        <h4 className="mt-5 mb-2 text-sm font-medium">コーデのアイテム</h4>
        <div className="grid gap-2">
          {o.products.map((p) => (
            <MiniProduct key={p.id} p={p} />
          ))}
        </div>
        <div className="mt-6">
          <FavButtonLarge type="outfit" id={o.id} />
        </div>
      </div>
    </div>
  );
}

// M-03 アイテム詳細（F-09）・ショップ比較（F-10）・着回し提案（F-11）（A-07）
function ProductDetail({ id }: { id: string }) {
  const { open } = useStore();
  const masters = useMasters();
  const { data: p, error, reload } = useApi<ProductDetailData>(`/products/${encodeURIComponent(id)}`);
  if (!p) return <DetailLoading error={error} onRetry={reload} />;
  const category = nameOf(masters?.categories, p.categoryId);
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <img src={img(p.image, 700, 800)} alt={p.name} className="aspect-[7/8] w-full rounded-xl object-cover" />
        <div>
          <Kicker>ITEM · {category}</Kicker>
          <DialogTitle className="mt-1 font-serif text-2xl">{p.name}</DialogTitle>
          <p className="mt-2 font-serif text-2xl font-semibold">
            {money(p.price)}
            <small className="ml-1 font-sans text-xs font-normal text-muted-foreground">（参考価格）</small>
          </p>
          <Stats
            items={[
              { label: "カラー", value: nameOf(masters?.colors, p.colorId) },
              { label: "カテゴリー", value: category },
              { label: "着回し", value: `${p.wearCount}コーデ` },
            ]}
          />
          <h4 className="mb-2 text-sm font-medium">ショップを比べて購入する</h4>
          <div className="flex flex-wrap gap-2">
            {p.links.map((l, i) => (
              <Button key={l.shopId} asChild variant={i === 0 ? "default" : "outline"} className="rounded-full">
                <a href={l.url} target="_blank" rel="noopener">
                  {l.shopName}で探す <ExternalLink />
                </a>
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">各ショップの検索結果ページが開きます。価格や在庫はショップでご確認ください。</p>
          {p.trends.length > 0 && (
            <>
              <h4 className="mt-5 mb-2 text-sm font-medium">このアイテムが入っているトレンド</h4>
              <div className="flex flex-wrap gap-2">
                {p.trends.map((t) => (
                  <Badge key={t.id} variant="secondary" asChild className="cursor-pointer px-3 py-1 text-xs hover:bg-blush">
                    <button onClick={() => open("trend", t.id)}>{t.name}</button>
                  </Badge>
                ))}
              </div>
            </>
          )}
          <div className="mt-6">
            <FavButtonLarge type="product" id={p.id} />
          </div>
        </div>
      </div>
      <Block
        title={`このアイテムを使ったコーデ（${p.wearCount}）`}
        sub={p.wearCount ? `1着で${p.wearCount}通りの着こなしができます。` : "このアイテムを使ったコーデは準備中です。"}
      >
        <ResultList>
          {p.outfits.map((o) => (
            <OutfitResult key={o.id} o={o} />
          ))}
        </ResultList>
      </Block>
    </div>
  );
}

// M-04 コラム記事（A-10）
function PostDetail({ id }: { id: string }) {
  const tags = useMasters()?.postTags;
  const { data: p, error, reload } = useApi<PostDetailData>(`/posts/${encodeURIComponent(id)}`);
  if (!p) return <DetailLoading error={error} onRetry={reload} />;
  return (
    <article className="mx-auto max-w-2xl">
      <Kicker>
        {nameOf(tags, p.tagId)} · {dateJa(p.publishedOn)}
      </Kicker>
      <DialogTitle className="mt-1 font-serif text-2xl leading-snug md:text-3xl">{p.title}</DialogTitle>
      <img src={img(p.image, 1100, 620)} alt="" className="my-5 aspect-[16/9] w-full rounded-xl object-cover" />
      <p className="font-medium">{p.excerpt}</p>
      {p.paragraphs.map((x) => (
        <p key={x} className="mt-4 text-sm leading-loose">
          {x}
        </p>
      ))}
    </article>
  );
}

// ---------- M-05 検索（A-14） ----------
const SUGGESTIONS = ["きれいめ", "通勤", "ワンピース", "ブラウン", "ニット", "お呼ばれ"];

// 入力が止まってから検索する（1文字ごとに API を呼ばないように）
function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setV(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return v;
}

function SearchPanel({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial);
  const q = useDebounced(query.trim(), 250);
  // 表記ゆれ（カタカナ・ひらがな・半角）とスペース区切りの AND は API がそろえる
  const { data, lastData, error, reload } = useApi<SearchResults>(q ? `/search-results?q=${encodeURIComponent(q.slice(0, 100))}&limit=50` : null);
  const r = q ? (data ?? lastData) : undefined;
  const groups: [string, ReactNode[]][] = r
    ? (
        [
          ["トレンド", r.trends.items.map((t) => <TrendResult key={t.id} t={t} />)],
          ["コーデ", r.outfits.items.map((o) => <OutfitResult key={o.id} o={o} />)],
          ["アイテム", r.products.items.map((p) => <ProductResult key={p.id} p={p} />)],
          ["コラム", r.posts.items.map((p) => <PostResult key={p.id} p={p} />)],
          ["ショップ", r.shops.items.map((s) => <ShopResult key={s.id} s={s} />)],
        ] as [string, ReactNode[]][]
      ).filter(([, items]) => items.length)
    : [];
  const total = r ? r.trends.total + r.outfits.total + r.products.total + r.posts.total + r.shops.total : 0;

  return (
    <div>
      <DialogTitle className="font-serif text-2xl">検索</DialogTitle>
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="トレンド・コーデ・アイテム・ショップを検索"
          aria-label="検索キーワード"
          autoComplete="off"
          maxLength={100}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          className="h-11 rounded-full pl-9"
        />
      </div>
      <div className="mt-5" aria-live="polite">
        {!query.trim() ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            人気のキーワード:
            {SUGGESTIONS.map((w) => (
              <Button key={w} variant="outline" size="sm" className="rounded-full" onClick={() => setQuery(w)}>
                {w}
              </Button>
            ))}
          </div>
        ) : error ? (
          <LoadError error={error} onRetry={reload} />
        ) : !r ? (
          <p className="py-8 text-center text-muted-foreground">検索中…</p>
        ) : total ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              「{r.query}」の検索結果：{total}件
            </p>
            {groups.map(([name, items]) => (
              <div key={name}>
                <h3 className="mb-2 text-base font-semibold">
                  {name} <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
                </h3>
                <ResultList>{items}</ResultList>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">「{r.query}」に一致する結果がありません。別のキーワードでお試しください。</p>
        )}
      </div>
    </div>
  );
}

// ---------- M-06 お気に入り一覧 ----------
// ブラウザに保存したIDの内容を API から取る（存在しない・非公開になったものは出さない）
function FavoritesSheet() {
  const { modal, closeModal, favs } = useStore();
  const isOpen = modal?.kind === "favorites";
  const types: ItemType[] = ["trend", "outfit", "product"];
  const refs = isOpen ? types.flatMap((type) => favs[type].map((id) => ({ type, id }))) : [];
  const { items, lastItems, error, reload } = useItems(refs);
  // ハートを外した直後も、読み直しが終わるまでは前の一覧から外したものだけを除いて出す
  const shown = (items ?? lastItems ?? []).filter((x) => favs[x.type].includes(x.id));
  const groups = [
    { name: "トレンド", type: "trend" as const },
    { name: "コーデ", type: "outfit" as const },
    { name: "アイテム", type: "product" as const },
  ].map((g) => ({ ...g, items: shown.filter((x) => x.type === g.type) }));
  const total = shown.length;
  const saved = favs.trend.length + favs.outfit.length + favs.product.length;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeModal()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">お気に入り</SheetTitle>
          <SheetDescription>
            {saved ? `${total || saved}件を保存しています（このブラウザに保存されます）。` : "トレンド・コーデ・アイテムのハートを押すと、ここに保存されます。"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {error && <LoadError error={error} onRetry={reload} />}
          {!error && saved > 0 && !items && !lastItems && <p className="py-6 text-center text-sm text-muted-foreground">読み込み中…</p>}
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <div key={g.type}>
                <h3 className="mb-2 text-base font-semibold">
                  {g.name} <span className="text-sm font-normal text-muted-foreground">({g.items.length})</span>
                </h3>
                <div className="space-y-2">
                  {/* ハートを外すと、横にすべって消え、下の行が詰まる */}
                  <AnimatePresence initial={false}>
                    {g.items.map((x) => (
                      <motion.div
                        key={x.id}
                        layout
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                      >
                        {x.type === "trend" ? <TrendResult t={x.data} /> : x.type === "outfit" ? <OutfitResult o={x.data} /> : <ProductResult p={x.data} />}
                        <HeartButton type={g.type} id={x.id} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
