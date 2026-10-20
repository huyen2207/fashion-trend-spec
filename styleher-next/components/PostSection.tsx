"use client";

import { Badge } from "@/components/ui/badge";
import { nameOf, useApi, useMasters, type Page, type PostSummary } from "@/lib/client/api";
import { dateJa, img } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { LoadError, LoadingGrid, OpenCard, Section, SectionHeading } from "./parts";

export function PostSection() {
  const tags = useMasters()?.postTags;
  // 新着コラムは新しいものから4件（A-09）
  const { data, error, reload } = useApi<Page<PostSummary>>("/posts?limit=4");
  return (
    <Section id="blog">
      <SectionHeading title="新着コラム" en="COLUMN" />
      {error ? (
        <LoadError error={error} onRetry={reload} />
      ) : !data ? (
        <LoadingGrid className="sm:grid-cols-2 lg:grid-cols-4" itemClassName="aspect-[13/15]" />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((p) => (
            <StaggerItem key={p.id}>
              <OpenCard type="post" id={p.id} label={`コラム「${p.title}」を読む`} className="h-full">
                <div className="aspect-[13/9] overflow-hidden">
                  <img src={img(p.image, 520, 360)} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="font-sans text-sm leading-relaxed font-medium">{p.title}</h3>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <time dateTime={p.publishedOn}>{dateJa(p.publishedOn)}</time>
                    <Badge variant="secondary">{nameOf(tags, p.tagId)}</Badge>
                  </div>
                </div>
              </OpenCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Section>
  );
}
