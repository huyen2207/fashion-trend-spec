import { ArrowRight, Shirt, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Community } from "@/components/Community";
import { Hero } from "@/components/Hero";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { OutfitSection } from "@/components/OutfitSection";
import { Section, SectionHeading } from "@/components/parts";
import { PostSection } from "@/components/PostSection";
import { ProductSection } from "@/components/ProductSection";
import { RecentSection } from "@/components/RecentSection";
import { Shindan } from "@/components/Shindan";
import { TrendSection } from "@/components/TrendSection";
import { shops } from "@/lib/data";
import { SPEC_URL } from "@/lib/links";

const FEATURES = [
  { icon: TrendingUp, title: "トレンドを毎日更新", text: "最新の流行をすぐチェック" },
  { icon: Shirt, title: "シーン別コーデ提案", text: "年代・テイストで選べる" },
  { icon: ShoppingBag, title: "人気ショップをまとめて", text: "購入ページへすぐ移動" },
  { icon: Users, title: "おしゃれコミュニティ", text: "コーデをシェアしよう" },
];

export default function Home() {
  return (
    <main>
      
      <Hero />

      {/* 4つの特徴 */}
      <div className="mx-auto max-w-6xl px-4">
        <Stagger className="-mt-8 relative grid grid-cols-2 gap-3 md:grid-cols-4">
          {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
            <StaggerItem key={title}>
              <Card className="h-full flex-row items-center gap-3 p-4 shadow-md">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-rose">
                  <FeatureIcon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <TrendSection />
      <Shindan />
      <OutfitSection />

      {/* ブランドメッセージ */}
      <Reveal className="mx-auto max-w-6xl px-4">
        <Card className="overflow-hidden bg-secondary py-0 md:grid md:grid-cols-2 md:gap-0">
          <div className="flex flex-col justify-center gap-4 p-8 md:p-12">
            <p className="font-serif text-2xl leading-relaxed md:text-3xl">
              おしゃれは、
              <br />
              自分を好きになるための
              <br />
              小さな魔法。
            </p>
            <p className="font-script text-3xl text-rose">StyleHer</p>
            <Button asChild variant="outline" className="w-fit rounded-full">
              <a href={SPEC_URL} target="_blank" rel="noopener">
                StyleHerについて <ArrowRight />
              </a>
            </Button>
          </div>
          <img
            src="https://images.unsplash.com/photo-1498090890888-3df9298e7b84?w=900&h=700&fit=crop&auto=format&q=70"
            alt="白いブラウスの女性"
            loading="lazy"
            className="aspect-[9/7] size-full object-cover"
          />
        </Card>
      </Reveal>

      <ProductSection />

      {/* 人気ショップ */}
      <Section className="pt-0 md:pt-0">
        <SectionHeading title="人気ショップ" en="SHOP" sub="定番ブランドから通販サイトまで。公式サイトへすぐ移動できます。" />
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" gap={0.04}>
          {shops.map((s) => (
            <StaggerItem key={s.name}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                aria-label={`${s.name}（公式サイトを開く）`}
                className="flex h-full flex-col items-center justify-center gap-1 rounded-xl border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="font-serif text-lg font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.type}</span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <RecentSection />
      <PostSection />
      <Community />
    </main>
  );
}
