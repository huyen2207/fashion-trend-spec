"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { qs, useApi, useMasters, type List, type OutfitSummary } from "@/lib/client/api";
import { img, money } from "@/lib/utils";
import { FilterSelect } from "./FilterSelect";
import { SCENE_ICONS } from "./icons";
import { Stagger, StaggerItem } from "./motion";
import { ChipGroup, HeartButton, LoadError, LoadingGrid, OpenCard, Section, SectionHeading } from "./parts";
import { useStore } from "./StoreProvider";

export function OutfitSection() {
  const { outfitFilter: f, setOutfitFilter } = useStore();
  const set = (patch: Partial<typeof f>) => setOutfitFilter({ ...f, ...patch });
  const masters = useMasters();
  const SCENE_TABS = [{ id: "all", name: "すべて", icon: undefined }, ...(masters?.scenes ?? [])];
  const ages = masters?.ages ?? [];
  const tastes = masters?.tastes ?? [];

  // シーン・年代・テイストの絞り込みは API（A-04）で行う。シーンの初期値が決まるまでは取りに行かない
  const { data, lastData, error, reload } = useApi<List<OutfitSummary>>(
    f.scene ? `/outfits${qs({ scene: f.scene, age: f.age, taste: f.taste })}` : null
  );
  const list = (data ?? lastData)?.items;

  return (
    <Section id="outfits">
      <SectionHeading title="シーン別コーデ" en="COORDINATE">
        <Button variant="link" className="px-0 text-foreground" onClick={() => setOutfitFilter({ scene: "all", age: "all", taste: "all" })}>
          条件をリセット <ArrowRight />
        </Button>
      </SectionHeading>

      <Tabs value={f.scene} onValueChange={(scene) => set({ scene })}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList className="h-auto gap-1 bg-secondary p-1">
            {SCENE_TABS.map((s) => {
              const SceneIcon = s.icon && SCENE_ICONS[s.icon];
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className="rounded-full px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {s.id === f.scene && (
                    <motion.span
                      layoutId="scene-tab"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-background shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {SceneIcon && <SceneIcon />}
                    {s.name}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="my-4 flex flex-wrap items-center justify-between gap-3">
          <ChipGroup label="年代" options={[{ id: "all", name: "すべての年代" }, ...ages]} value={f.age} onChange={(age) => set({ age })} />
          <FilterSelect label="テイスト" value={f.taste} options={[{ id: "all", name: "すべて" }, ...tastes]} onChange={(taste) => set({ taste })} />
        </div>

        {SCENE_TABS.map((s) => (
          <TabsContent key={s.id} value={s.id}>
            {error ? (
              <LoadError error={error} onRetry={reload} />
            ) : !list ? (
              <LoadingGrid className="sm:grid-cols-2 lg:grid-cols-4" itemClassName="aspect-[4/4.6]" />
            ) : list.length ? (
              <Stagger className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {list.map((o) => (
                    <StaggerItem key={o.id}>
                      <OpenCard type="outfit" id={o.id} label={`コーデ「${o.title}」を見る`} className="h-full">
                        <div className="grid aspect-[4/3.6] grid-cols-[2fr_1fr] gap-1 p-1">
                          <img src={img(o.image, 420, 590)} alt={o.title} loading="lazy" className="size-full rounded-lg object-cover" />
                          <div className="grid grid-rows-3 gap-1">
                            {o.items.map((p) => (
                              <img key={p.id} src={img(p.image, 160, 160)} alt={p.name} loading="lazy" className="size-full rounded-md object-cover" />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-2 p-3">
                          <div>
                            <h3 className="font-sans text-sm leading-snug font-medium">{o.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">アイテム合計 {money(o.totalPrice)}〜</p>
                          </div>
                          <HeartButton type="outfit" id={o.id} />
                        </div>
                      </OpenCard>
                    </StaggerItem>
                  ))}
                </AnimatePresence>
              </Stagger>
            ) : (
              <p className="py-10 text-center text-muted-foreground">条件に合うコーデがありません。年代やテイストを変えてみてください。</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  );
}
