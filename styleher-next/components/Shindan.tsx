"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiGet, nameOf, qs, useApi, useMasters, type List, type Masters, type OutfitSummary, type Recommendations } from "@/lib/client/api";
import { load, save } from "@/lib/utils";
import { fadeUp } from "./motion";
import { ChipGroup, chipClass, LoadError, LoadingGrid, OutfitResult, ResultList, Section, TrendResult } from "./parts";
import { useStore } from "./StoreProvider";

// かんたんスタイル診断（F-16）
type Profile = { age: string; tastes: string[]; scene: string };

const PROFILE_KEY = "styleher:profile";
const TASTE_TYPES: Record<string, string> = {
  kireime: "上品でちゃんと見える服が好きなあなた。ベーシックカラーと、きれいなシルエットを意識すると、さらに素敵に。",
  casual: "動きやすさと自分らしさを大切にするあなた。定番アイテムに、旬の色をひとつ足すのがおすすめ。",
  feminine: "やわらかく女性らしい雰囲気が似合うあなた。甘いアイテムは一点だけにすると、大人っぽくまとまります。",
  natural: "心地よさを大切にするあなた。リネンやニットなど、素材感のあるアイテムがよく似合います。",
  simple: "無駄のないすっきりした服が好きなあなた。モノトーンに素材感で奥行きを出すと、洗練された印象に。",
};

// 保存した結果が、今のマスタで使える答えか（使えなければ質問から）
const isValid = (p: Profile | null, m: Masters): p is Profile =>
  !!p &&
  m.ages.some((a) => a.id === p.age) &&
  m.scenes.some((s) => s.id === p.scene) &&
  Array.isArray(p.tastes) &&
  p.tastes.length > 0 &&
  p.tastes.every((x) => m.tastes.some((t) => t.id === x));

function Question({ no, title, note, children }: { no: string; title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 flex items-center gap-2 font-medium">
        <Badge variant="outline" className="border-rose font-serif text-rose">
          {no}
        </Badge>
        {title}
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

export function Shindan() {
  const { setOutfitFilter } = useStore();
  const masters = useMasters();
  const ages = masters?.ages ?? [];
  const tastes = masters?.tastes ?? [];
  const scenes = masters?.scenes ?? [];
  const [age, setAge] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [scene, setScene] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  // 保存した結果は、マスタを読み込んでから確かめる
  useEffect(() => {
    if (!masters) return;
    const saved = load<Profile | null>(PROFILE_KEY, null);
    if (isValid(saved, masters)) setProfile(saved);
  }, [masters]);

  const onTastes = (next: string[]) => {
    if (next.length > 2) toast("テイストは2つまで選べます");
    else setPicked(next);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!age || !picked.length || !scene) {
      toast("3つの質問すべてに答えてください");
      return;
    }
    const p = { age, tastes: picked, scene };
    save(PROFILE_KEY, p);
    setProfile(p);
  };

  const retry = () => {
    setAge("");
    setPicked([]);
    setScene("");
    setProfile(null);
    save(PROFILE_KEY, null);
  };

  const apply = async (p: Profile) => {
    // 結果が0件にならないテイストを選ぶ（なければテイストは「すべて」）。件数は API（A-04）で確かめる
    let taste = "all";
    for (const x of p.tastes) {
      const r = await apiGet<List<OutfitSummary>>(`/outfits${qs({ scene: p.scene, age: p.age, taste: x })}`).catch(() => null);
      if (r?.items.length) {
        taste = x;
        break;
      }
    }
    setOutfitFilter({ scene: p.scene, age: p.age, taste });
    document.getElementById("outfits")?.scrollIntoView({ behavior: "smooth" });
  };

  // おすすめは API（A-13）で決める（1つ目のテイストを重視する点数方式）
  const rec = useApi<Recommendations>(profile ? `/recommendations${qs({ age: profile.age, tastes: profile.tastes.join(","), scene: profile.scene })}` : null);
  const result = rec.data;

  return (
    <Section id="shindan">
      <Card className="overflow-hidden bg-gradient-to-br from-blush/60 to-card py-0 md:grid md:grid-cols-[1fr_1.6fr] md:gap-0">
        <CardHeader className="gap-3 p-6 md:p-10">
          <p className="font-serif text-xs tracking-[0.3em] text-rose">STYLE CHECK</p>
          <CardTitle className="font-serif text-2xl md:text-3xl">かんたんスタイル診断</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            3つの質問に答えるだけで、あなたに合うトレンドとコーデが見つかります。
          </CardDescription>
          <ul className="mt-2 space-y-1 text-sm">
            {["約30秒で完了", "結果はこのブラウザに保存"].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <Check className="size-4 text-rose" />
                {x}
              </li>
            ))}
          </ul>
        </CardHeader>

        <CardContent className="bg-card p-6 md:p-10">
          {/* 質問 ⇄ 結果 を切り替えるときに、ふわっと入れ替える */}
          <AnimatePresence mode="wait" initial={false}>
            {!profile ? (
              <motion.form
                key="form"
                noValidate
                onSubmit={onSubmit}
                className="space-y-7"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
              >
                <Question no="Q1" title="年代を教えてください">
                  <ChipGroup label="年代" options={ages} value={age} onChange={setAge} />
                </Question>
                <Question no="Q2" title="好きなテイストは？" note="（2つまで）">
                  <ToggleGroup type="multiple" spacing={2} value={picked} onValueChange={onTastes} aria-label="テイスト" className="flex-wrap">
                    {tastes.map((t) => (
                      <ToggleGroupItem key={t.id} value={t.id} className={chipClass}>
                        {t.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Question>
                <Question no="Q3" title="いちばん服に悩むシーンは？">
                  <ChipGroup label="シーン" options={scenes} value={scene} onChange={setScene} />
                </Question>
                <Button type="submit" size="lg" className="rounded-full">
                  診断する <ArrowRight />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="result"
                className="space-y-6"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, x: 16, transition: { duration: 0.2 } }}
                variants={{ show: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.div variants={fadeUp}>
                  <p className="font-serif text-xs tracking-[0.2em] text-rose">
                    RESULT · {nameOf(ages, profile.age)} · {nameOf(scenes, profile.scene)}
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold">あなたは「{profile.tastes.map((x) => nameOf(tastes, x)).join("×")}」タイプ</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{TASTE_TYPES[profile.tastes[0]]}</p>
                </motion.div>
                {rec.error ? (
                  <LoadError error={rec.error} onRetry={rec.reload} className="py-4" />
                ) : !result ? (
                  <LoadingGrid count={4} className="sm:grid-cols-2" itemClassName="h-[74px] rounded-lg" />
                ) : (
                  <>
                    <motion.div variants={fadeUp} initial="hidden" animate="show">
                      <h4 className="mb-2 text-sm font-medium">あなたにおすすめのトレンド</h4>
                      <ResultList>
                        {result.trends.map((t) => (
                          <TrendResult key={t.id} t={t} />
                        ))}
                      </ResultList>
                    </motion.div>
                    <motion.div variants={fadeUp} initial="hidden" animate="show">
                      <h4 className="mb-2 text-sm font-medium">あなたにおすすめのコーデ</h4>
                      <ResultList>
                        {result.outfits.map((o) => (
                          <OutfitResult key={o.id} o={o} />
                        ))}
                      </ResultList>
                    </motion.div>
                  </>
                )}
                <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                  <Button className="rounded-full" onClick={() => apply(profile)}>
                    この条件でコーデを見る <ArrowRight />
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={retry}>
                    もう一度診断する
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </Section>
  );
}
