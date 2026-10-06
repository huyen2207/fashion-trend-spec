"use client";

import { Badge } from "@/components/ui/badge";
import { posts } from "@/lib/data";
import { dateJa, img } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { OpenCard, Section, SectionHeading } from "./parts";

export function PostSection() {
  return (
    <Section id="blog">
      <SectionHeading title="新着コラム" en="COLUMN" />
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p) => (
          <StaggerItem key={p.id}>
            <OpenCard type="post" id={p.id} label={`コラム「${p.title}」を読む`} className="h-full">
              <div className="aspect-[13/9] overflow-hidden">
                <img src={img(p.img, 520, 360)} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-sans text-sm leading-relaxed font-medium">{p.title}</h3>
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <time dateTime={p.date}>{dateJa(p.date)}</time>
                  <Badge variant="secondary">{p.tag}</Badge>
                </div>
              </div>
            </OpenCard>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
