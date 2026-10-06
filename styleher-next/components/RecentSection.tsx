"use client";

import { Button } from "@/components/ui/button";
import { OUTFITS, PRODUCTS, TRENDS } from "@/lib/utils";
import { OutfitResult, ProductResult, Section, SectionHeading, TrendResult } from "./parts";
import { useStore } from "./StoreProvider";

// 最近見たもの（F-19）
export function RecentSection() {
  const { recent, clearRecent } = useStore();
  const items = recent.flatMap((key) => {
    const [type, id] = key.split(":");
    if (type === "trend" && TRENDS[id]) return [<TrendResult key={key} t={TRENDS[id]} />];
    if (type === "outfit" && OUTFITS[id]) return [<OutfitResult key={key} o={OUTFITS[id]} />];
    if (type === "product" && PRODUCTS[id]) return [<ProductResult key={key} p={PRODUCTS[id]} />];
    return [];
  });
  if (!items.length) return null;

  return (
    <Section id="recent" className="py-8 md:py-10">
      <SectionHeading title="最近見たもの" en="RECENTLY VIEWED">
        <Button variant="link" className="px-0 text-muted-foreground" onClick={clearRecent}>
          履歴を消す
        </Button>
      </SectionHeading>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{items}</div>
    </Section>
  );
}
