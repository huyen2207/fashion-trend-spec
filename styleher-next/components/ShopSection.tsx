"use client";

import { useApi, type List, type Shop } from "@/lib/client/api";
import { Stagger, StaggerItem } from "./motion";
import { LoadError, LoadingGrid, Section, SectionHeading } from "./parts";

// 人気ショップ（F-17）。API（A-08）から読む
export function ShopSection() {
  const { data, error, reload } = useApi<List<Shop>>("/shops");
  return (
    <Section className="pt-0 md:pt-0">
      <SectionHeading title="人気ショップ" en="SHOP" sub="定番ブランドから通販サイトまで。公式サイトへすぐ移動できます。" />
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingGrid count={10} className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" itemClassName="h-20" />
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" gap={0.04}>
          {data.items.map((s) => (
            <StaggerItem key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                aria-label={`${s.name}（公式サイトを開く）`}
                className="flex h-full flex-col items-center justify-center gap-1 rounded-xl border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="font-serif text-lg font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.shopType}</span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}
