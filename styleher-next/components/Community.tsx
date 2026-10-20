"use client";

import { ArrowRight, Flower2, HelpCircle, Images, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApi, type CommunityImage, type List } from "@/lib/client/api";
import { img } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { LoadingGrid, Section } from "./parts";

const PERKS = [
  { icon: Images, text: "コーデをシェア" },
  { icon: HelpCircle, text: "コーデの相談" },
  { icon: MessageCircle, text: "みんなのアドバイス" },
  { icon: Flower2, text: "もっと私らしいおしゃれへ" },
];

export function Community() {
  // ギャラリーの画像は API（A-12）から読む。読み込めなかったときは画像なしで表示する
  const images = useApi<List<CommunityImage>>("/community-images").data?.items;
  return (
    <Section id="community">
      <Reveal>
        <Card className="overflow-hidden bg-gradient-to-br from-blush/70 to-secondary py-0 md:grid md:grid-cols-[1fr_1.4fr] md:gap-0">
          <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
            <p className="font-serif text-xs tracking-[0.3em] text-rose">COMMUNITY</p>
            <h2 className="text-2xl font-semibold md:text-3xl">StyleHer コミュニティ</h2>
            <p className="text-sm text-muted-foreground">毎日のコーデをシェアして、おしゃれのヒントを見つけよう。</p>
            {/* コミュニティ機能は今後の拡張（今回のMVPの対象外） */}
            <Button
              className="w-fit rounded-full"
              onClick={() => toast("コミュニティ機能は近日公開予定です。ページ下部のメール登録でお知らせします！")}
            >
              参加する <ArrowRight />
            </Button>
          </div>
          {!images ? (
            <LoadingGrid count={8} className="grid-cols-4 gap-1 p-1" itemClassName="aspect-[6/7] rounded-lg" />
          ) : (
          <Stagger className="grid grid-cols-4 gap-1 p-1" gap={0.05}>
            {images.map((c) => (
              <StaggerItem key={c.id}>
                <img src={img(c.image, 240, 280)} alt="StyleHerコミュニティのコーデ" loading="lazy" className="aspect-[6/7] size-full rounded-lg object-cover" />
              </StaggerItem>
            ))}
          </Stagger>
          )}
        </Card>
      </Reveal>
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {PERKS.map(({ icon: PerkIcon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
            <PerkIcon className="size-5 text-rose" />
            {text}
          </li>
        ))}
      </ul>
    </Section>
  );
}
