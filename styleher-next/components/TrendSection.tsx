"use client";

import { TrendingUp } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { qs, useApi, useMasters, type List, type TrendSummary } from "@/lib/client/api";
import { img } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { ChipGroup, HeartButton, LoadError, LoadingGrid, OpenCard, Section, SectionHeading } from "./parts";
import { useStore } from "./StoreProvider";

export function TrendSection() {
  const { todayText, todayTrendId } = useStore();
  const ages = useMasters()?.ages ?? [];
  const [age, setAge] = useState("all");
  // 年代の絞り込みは API（A-02 の age）で行う
  const { data, lastData, error, reload } = useApi<List<TrendSummary>>(`/trends${qs({ age })}`);
  const all = useApi<List<TrendSummary>>("/trends").data?.items ?? [];
  const trends = (data ?? lastData)?.items;

  // 日替わりで「今日の注目」を先頭にする（全トレンドの並び順で、今日の注目から一周させる）
  const order = new Map(all.map((t, i) => [t.id, i]));
  const start = order.get(todayTrendId) ?? 0;
  const pos = (id: string) => ((order.get(id) ?? 0) - start + all.length) % Math.max(all.length, 1);
  const list = trends && [...trends].sort((a, b) => pos(a.id) - pos(b.id));

  return (
    <Section id="trends">
      <SectionHeading title="注目のトレンド" en="TREND" sub={`毎日更新${todayText && ` · ${todayText}`}`}>
        <ChipGroup label="年代で絞り込む" options={[{ id: "all", name: "すべての年代" }, ...ages]} value={age} onChange={setAge} />
      </SectionHeading>
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !list ? (
        <LoadingGrid count={6} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" itemClassName="aspect-[3/5]" />
      ) : list.length ? (
        <Stagger className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {list.map((t) => (
              <StaggerItem key={t.id}>
                <OpenCard type="trend" id={t.id} label={`${t.name}のトレンドを見る`} className="h-full">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={img(t.image, 400, 530)} alt={t.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    {t.id === todayTrendId && <Badge className="absolute top-2 left-2 bg-rose">今日の注目</Badge>}
                    <Badge variant="secondary" className="absolute bottom-2 left-2 bg-white/90">
                      <TrendingUp /> {t.hotScore}%
                    </Badge>
                    <HeartButton type="trend" id={t.id} className="absolute top-1 right-1 bg-white/80 hover:bg-white" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-base font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.subtitle}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t.postCount}件のコーデ · {t.season}
                    </p>
                  </div>
                </OpenCard>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </Stagger>
      ) : (
        <p className="py-10 text-center text-muted-foreground">条件に合うトレンドがありません。</p>
      )}
    </Section>
  );
}
