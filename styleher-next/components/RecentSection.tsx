"use client";

import { Button } from "@/components/ui/button";
import { useItems, type ItemRef, type ItemType } from "@/lib/client/useItems";
import { OutfitResult, ProductResult, Section, SectionHeading, TrendResult } from "./parts";
import { useStore } from "./StoreProvider";

// 最近見たもの（F-19）。ブラウザに保存したIDの内容を API から取る
export function RecentSection() {
  const { recent, clearRecent } = useStore();
  const refs: ItemRef[] = recent.map((key) => {
    const [type, id] = key.split(":");
    return { type: type as ItemType, id };
  });
  const { items, lastItems } = useItems(refs);
  const shown = refs.length ? (items ?? lastItems ?? []) : [];
  if (!shown.length) return null;

  return (
    <Section id="recent" className="py-8 md:py-10">
      <SectionHeading title="最近見たもの" en="RECENTLY VIEWED">
        <Button variant="link" className="px-0 text-muted-foreground" onClick={clearRecent}>
          履歴を消す
        </Button>
      </SectionHeading>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((x) =>
          x.type === "trend" ? (
            <TrendResult key={`trend:${x.id}`} t={x.data} />
          ) : x.type === "outfit" ? (
            <OutfitResult key={`outfit:${x.id}`} o={x.data} />
          ) : (
            <ProductResult key={`product:${x.id}`} p={x.data} />
          )
        )}
      </div>
    </Section>
  );
}
