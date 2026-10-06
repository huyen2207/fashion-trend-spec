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
import { outfits, posts, products, shops, trends } from "@/lib/data";
import {
  ageName,
  CATS,
  dateJa,
  img,
  money,
  OUTFITS,
  outfitItems,
  outfitPrice,
  outfitsWith,
  plain,
  POSTS,
  PRODUCTS,
  SCENES,
  tasteName,
  TRENDS,
} from "@/lib/utils";
import {
  FavButtonLarge,
  HeartButton,
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
      return TRENDS[state.id] ? <TrendDetail id={state.id} /> : null;
    case "outfit":
      return OUTFITS[state.id] ? <OutfitDetail id={state.id} /> : null;
    case "product":
      return PRODUCTS[state.id] ? <ProductDetail id={state.id} /> : null;
    case "post":
      return POSTS[state.id] ? <PostDetail id={state.id} /> : null;
    case "search":
      return <SearchPanel key={state.query} initial={state.query} />;
  }
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

// M-01 トレンド詳細
function TrendDetail({ id }: { id: string }) {
  const { todayTrendId } = useStore();
  const t = TRENDS[id];
  const related = outfits.filter((o) => o.tastes.some((x) => t.tastes.includes(x))).slice(0, 3);
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <Gallery images={[t.img, ...t.gallery].slice(0, 4).map((g, i) => ({ src: img(g, i ? 300 : 700, i ? 400 : 630), alt: t.name }))} />
        <div>
          <Kicker>TREND {t.id === todayTrendId && "· 今日の注目"}</Kicker>
          <DialogTitle className="mt-1 font-serif text-3xl">{t.name}</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
          <p className="mt-4 text-sm leading-relaxed">{t.desc}</p>
          <Stats
            items={[
              {
                label: "注目度",
                value: (
                  <>
                    {t.hot}%
                    <Progress value={t.hot} className="mt-1 h-1 *:data-[slot=progress-indicator]:bg-rose" />
                  </>
                ),
              },
              { label: "シーズン", value: t.season },
              { label: "おすすめ年代", value: t.ages.map(ageName).join("・") },
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
            <MiniProduct key={p} p={PRODUCTS[p]} />
          ))}
        </div>
      </Block>
      {related.length > 0 && (
        <Block title="おすすめコーデ">
          <ResultList>
            {related.map((o) => (
              <OutfitResult key={o.id} o={o} />
            ))}
          </ResultList>
        </Block>
      )}
    </div>
  );
}

// M-02 コーデ詳細
function OutfitDetail({ id }: { id: string }) {
  const o = OUTFITS[id];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Gallery
        images={[
          { src: img(o.img, 700, 630), alt: o.title },
          ...o.items.map((pid) => ({ src: img(PRODUCTS[pid].img, 300, 400), alt: PRODUCTS[pid].name })),
        ]}
      />
      <div>
        <Kicker>COORDINATE · {SCENES[o.scene].name}</Kicker>
        <DialogTitle className="mt-1 font-serif text-2xl leading-snug">{o.title}</DialogTitle>
        <p className="mt-4 text-sm leading-relaxed">{o.desc}</p>
        <Stats
          items={[
            { label: "アイテム合計", value: money(outfitPrice(o)) },
            { label: "テイスト", value: o.tastes.map(tasteName).join("・") },
            { label: "おすすめ年代", value: o.ages.map(ageName).join("・") },
          ]}
        />
        <Bullets title="着こなしのコツ" items={o.tips} />
        <h4 className="mt-5 mb-2 text-sm font-medium">コーデのアイテム</h4>
        <div className="grid gap-2">
          {outfitItems(o).map((p) => (
            <MiniProduct key={p} p={PRODUCTS[p]} />
          ))}
        </div>
        <div className="mt-6">
          <FavButtonLarge type="outfit" id={o.id} />
        </div>
      </div>
    </div>
  );
}

// M-03 アイテム詳細（F-09）・ショップ比較（F-10）・着回し提案（F-11）
function ProductDetail({ id }: { id: string }) {
  const { open } = useStore();
  const p = PRODUCTS[id];
  const wearing = outfitsWith(p.id);
  const inTrends = trends.filter((t) => t.products.includes(p.id));
  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <img src={img(p.img, 700, 800)} alt={p.name} className="aspect-[7/8] w-full rounded-xl object-cover" />
        <div>
          <Kicker>ITEM · {CATS[p.cat].name}</Kicker>
          <DialogTitle className="mt-1 font-serif text-2xl">{p.name}</DialogTitle>
          <p className="mt-2 font-serif text-2xl font-semibold">
            {money(p.price)}
            <small className="ml-1 font-sans text-xs font-normal text-muted-foreground">（参考価格）</small>
          </p>
          <Stats
            items={[
              { label: "カラー", value: p.color },
              { label: "カテゴリー", value: CATS[p.cat].name },
              { label: "着回し", value: `${wearing.length}コーデ` },
            ]}
          />
          <h4 className="mb-2 text-sm font-medium">ショップを比べて購入する</h4>
          <div className="flex flex-wrap gap-2">
            {p.links.map((l, i) => (
              <Button key={l.shop} asChild variant={i === 0 ? "default" : "outline"} className="rounded-full">
                <a href={l.url} target="_blank" rel="noopener">
                  {l.shop}で探す <ExternalLink />
                </a>
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">各ショップの検索結果ページが開きます。価格や在庫はショップでご確認ください。</p>
          {inTrends.length > 0 && (
            <>
              <h4 className="mt-5 mb-2 text-sm font-medium">このアイテムが入っているトレンド</h4>
              <div className="flex flex-wrap gap-2">
                {inTrends.map((t) => (
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
        title={`このアイテムを使ったコーデ（${wearing.length}）`}
        sub={wearing.length ? `1着で${wearing.length}通りの着こなしができます。` : "このアイテムを使ったコーデは準備中です。"}
      >
        <ResultList>
          {wearing.map((o) => (
            <OutfitResult key={o.id} o={o} />
          ))}
        </ResultList>
      </Block>
    </div>
  );
}

// M-04 コラム記事
function PostDetail({ id }: { id: string }) {
  const p = POSTS[id];
  return (
    <article className="mx-auto max-w-2xl">
      <Kicker>
        {p.tag} · {dateJa(p.date)}
      </Kicker>
      <DialogTitle className="mt-1 font-serif text-2xl leading-snug md:text-3xl">{p.title}</DialogTitle>
      <img src={img(p.img, 1100, 620)} alt="" className="my-5 aspect-[16/9] w-full rounded-xl object-cover" />
      <p className="font-medium">{p.excerpt}</p>
      {p.body.map((x) => (
        <p key={x} className="mt-4 text-sm leading-loose">
          {x}
        </p>
      ))}
    </article>
  );
}

// ---------- M-05 検索 ----------
const SUGGESTIONS = ["きれいめ", "通勤", "ワンピース", "ブラウン", "ニット", "お呼ばれ"];

function search(query: string) {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const match = (...fields: (string | string[])[]) => {
    const text = plain(fields.flat().join(" "));
    return words.every((w) => text.includes(w));
  };
  const groups: [string, ReactNode[]][] = [
    ["トレンド", trends.filter((t) => match(t.name, t.sub, t.desc, t.points, t.season)).map((t) => <TrendResult key={t.id} t={t} />)],
    [
      "コーデ",
      outfits
        .filter((o) => match(o.title, o.desc, SCENES[o.scene].name, o.tastes.map(tasteName)))
        .map((o) => <OutfitResult key={o.id} o={o} />),
    ],
    ["アイテム", products.filter((p) => match(p.name, p.color, CATS[p.cat].name, p.shop)).map((p) => <ProductResult key={p.id} p={p} />)],
    ["コラム", posts.filter((p) => match(p.title, p.excerpt, p.tag, p.body)).map((p) => <PostResult key={p.id} p={p} />)],
    ["ショップ", shops.filter((s) => match(s.name, s.type)).map((s) => <ShopResult key={s.name} s={s} />)],
  ];
  return groups.filter(([, items]) => items.length);
}

function SearchPanel({ initial }: { initial: string }) {
  const [query, setQuery] = useState(initial);
  const groups = search(query);
  const total = groups?.reduce((n, [, items]) => n + items.length, 0) ?? 0;

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          className="h-11 rounded-full pl-9"
        />
      </div>
      <div className="mt-5">
        {!groups ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            人気のキーワード:
            {SUGGESTIONS.map((w) => (
              <Button key={w} variant="outline" size="sm" className="rounded-full" onClick={() => setQuery(w)}>
                {w}
              </Button>
            ))}
          </div>
        ) : total ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              「{query}」の検索結果：{total}件
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
          <p className="py-8 text-center text-muted-foreground">「{query}」に一致する結果がありません。別のキーワードでお試しください。</p>
        )}
      </div>
    </div>
  );
}

// ---------- M-06 お気に入り一覧 ----------
function FavoritesSheet() {
  const { modal, closeModal, favs } = useStore();
  const groups = [
    { name: "トレンド", type: "trend" as const, ids: favs.trend.filter((id) => TRENDS[id]), row: (id: string) => <TrendResult t={TRENDS[id]} /> },
    { name: "コーデ", type: "outfit" as const, ids: favs.outfit.filter((id) => OUTFITS[id]), row: (id: string) => <OutfitResult o={OUTFITS[id]} /> },
    { name: "アイテム", type: "product" as const, ids: favs.product.filter((id) => PRODUCTS[id]), row: (id: string) => <ProductResult p={PRODUCTS[id]} /> },
  ];
  const total = groups.reduce((n, g) => n + g.ids.length, 0);

  return (
    <Sheet open={modal?.kind === "favorites"} onOpenChange={(o) => !o && closeModal()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">お気に入り</SheetTitle>
          <SheetDescription>
            {total ? `${total}件を保存しています（このブラウザに保存されます）。` : "トレンド・コーデ・アイテムのハートを押すと、ここに保存されます。"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {groups
            .filter((g) => g.ids.length)
            .map((g) => (
              <div key={g.type}>
                <h3 className="mb-2 text-base font-semibold">
                  {g.name} <span className="text-sm font-normal text-muted-foreground">({g.ids.length})</span>
                </h3>
                <div className="space-y-2">
                  {/* ハートを外すと、横にすべって消え、下の行が詰まる */}
                  <AnimatePresence initial={false}>
                    {g.ids.map((id) => (
                      <motion.div
                        key={id}
                        layout
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                      >
                        {g.row(id)}
                        <HeartButton type={g.type} id={id} />
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
