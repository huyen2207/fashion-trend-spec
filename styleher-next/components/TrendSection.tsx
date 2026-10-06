"use client";

import { TrendingUp } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ages, trends } from "@/lib/data";
import { img } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { ChipGroup, HeartButton, OpenCard, Section, SectionHeading } from "./parts";
import { useStore } from "./StoreProvider";

export function TrendSection() {
  const { todayText, todayTrendId } = useStore();
  const [age, setAge] = useState("all");

  // 日替わりで「今日の注目」を先頭にする
  const start = trends.findIndex((t) => t.id === todayTrendId);
  const list = [...trends.slice(start), ...trends.slice(0, start)].filter((t) => age === "all" || t.ages.includes(age));

  return (
    <Section id="trends">
      <SectionHeading title="注目のトレンド" en="TREND" sub={`毎日更新${todayText && ` · ${todayText}`}`}>
        <ChipGroup label="年代で絞り込む" options={[{ id: "all", name: "すべての年代" }, ...ages]} value={age} onChange={setAge} />
      </SectionHeading>
      {list.length ? (
        <Stagger className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {list.map((t) => (
              <StaggerItem key={t.id}>
                <OpenCard type="trend" id={t.id} label={`${t.name}のトレンドを見る`} className="h-full">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={img(t.img, 400, 530)} alt={t.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                    {t.id === todayTrendId && <Badge className="absolute top-2 left-2 bg-rose">今日の注目</Badge>}
                    <Badge variant="secondary" className="absolute bottom-2 left-2 bg-white/90">
                      <TrendingUp /> {t.hot}%
                    </Badge>
                    <HeartButton type="trend" id={t.id} className="absolute top-1 right-1 bg-white/80 hover:bg-white" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-base font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.sub}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t.posts}件のコーデ · {t.season}
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
