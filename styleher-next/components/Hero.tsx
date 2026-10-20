"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi, type HeroSlide, type List } from "@/lib/client/api";
import { cn, img } from "@/lib/utils";
import { useStore } from "./StoreProvider";

const heroLine = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  const { todayText } = useStore();
  const [index, setIndex] = useState(0);
  // 手動で切り替えたあとは、自動送りの間隔を長くする
  const [manual, setManual] = useState(false);
  // スライドは API（A-11）から読む。読み込むまでは背景色だけを出す
  const heroSlides = useApi<List<HeroSlide>>("/hero-slides").data?.items ?? [];
  const n = heroSlides.length;
  const slide = heroSlides[index];

  useEffect(() => {
    if (!n) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % n), manual ? 9000 : 6000);
    return () => clearInterval(timer);
  }, [index, manual, n]);

  const show = (i: number) => {
    setIndex((i + n) % n);
    setManual(true);
  };

  return (
    <section aria-label="メインビジュアル" className="mx-auto max-w-6xl px-4 pt-4">
      <div className="relative isolate flex min-h-[480px] items-end overflow-hidden rounded-3xl bg-primary md:min-h-[560px] md:items-center">
        {heroSlides.map((s, i) => (
          <motion.img
            key={s.id}
            src={img(s.image, 1800)}
            alt=""
            style={{ objectPosition: s.imagePosition }}
            className="absolute inset-0 -z-10 size-full object-cover"
            initial={false}
            animate={i === index ? { opacity: 1, scale: 1.08 } : { opacity: 0, scale: 1 }}
            transition={{ opacity: { duration: 1.2, ease: "easeInOut" }, scale: { duration: i === index ? 9 : 1.2, ease: "linear" } }}
            loading={i === 0 ? undefined : "lazy"}
          />
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/25 to-transparent md:bg-gradient-to-r" />

        <div className="max-w-xl p-6 pb-20 text-white md:p-12">
          {todayText && (
            <Badge variant="outline" className="mb-4 border-white/40 bg-white/15 text-white backdrop-blur">
              {todayText} 更新
            </Badge>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {slide && (
            <motion.div
              key={index}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ show: { transition: { staggerChildren: 0.12 } }, exit: { opacity: 0, y: -12, transition: { duration: 0.3 } } }}
            >
              <h1 className="text-4xl leading-tight font-semibold md:text-5xl">
                {slide.title.split("\n").map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    <motion.span className="inline-block" variants={heroLine}>
                      {line}
                    </motion.span>
                  </Fragment>
                ))}
              </h1>
              <motion.p className="mt-4 text-sm text-white/85 md:text-base" variants={heroLine}>
                {slide.body}
              </motion.p>
            </motion.div>
            )}
          </AnimatePresence>
          <Button asChild size="lg" className="mt-6 rounded-full bg-white text-foreground hover:bg-white/90">
            <a href="#trends">
              トレンドを見る <ArrowRight />
            </a>
          </Button>
        </div>

        <p aria-hidden="true" className="absolute top-8 right-8 hidden text-right font-script text-5xl leading-none text-white/80 md:block">
          Good
          <br />
          Outfit
          <br />
          Brighter
          <br />
          Mood
        </p>

        <div className="absolute right-4 bottom-4 flex items-center gap-2 md:right-8 md:bottom-8">
          <Button variant="outline" size="icon" className="rounded-full border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/30 hover:text-white" aria-label="前の画像" onClick={() => show(index - 1)}>
            <ChevronLeft />
          </Button>
          <div className="flex gap-1.5">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`画像 ${i + 1}`}
                aria-current={i === index}
                onClick={() => show(i)}
                className={cn("h-1.5 rounded-full bg-white transition-all", i === index ? "w-6" : "w-1.5 opacity-50")}
              />
            ))}
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-white/40 bg-white/15 text-white backdrop-blur hover:bg-white/30 hover:text-white" aria-label="次の画像" onClick={() => show(index + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
