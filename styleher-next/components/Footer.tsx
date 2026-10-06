"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SPEC_URL } from "@/lib/links";
import { cn } from "@/lib/utils";
import { Logo } from "./Header";
import { SocialIcon } from "./icons";
import { useStore } from "./StoreProvider";

const SOCIALS = [
  { href: "https://www.facebook.com/", label: "Facebook", icon: "facebook" },
  { href: "https://www.instagram.com/", label: "Instagram", icon: "instagram" },
  { href: "https://www.tiktok.com/", label: "TikTok", icon: "tiktok" },
  { href: "https://www.youtube.com/", label: "YouTube", icon: "youtube" },
] as const;

const linkClass = "block py-1 text-sm text-muted-foreground hover:text-foreground";

export function Footer() {
  const { openFavorites } = useStore();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState({ text: "週に一度、人気のトレンドとコーデをお届けします。", kind: "" });

  // メール登録（デモ：形式チェックのみで、送信はしない）
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg({ text: "メールアドレスの形式が正しくありません。", kind: "err" });
      return;
    }
    setMsg({ text: "ご登録ありがとうございます！（デモ版のため実際には送信されません）", kind: "ok" });
    setEmail("");
  };

  return (
    <footer className="mt-8 border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.6fr]">
        <div>
          <Logo />
          <p className="mt-4 font-script text-2xl leading-tight text-rose" aria-hidden="true">
            More Than Fashion
            <br />A Better You
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-sans text-sm font-medium">StyleHerについて</h3>
          <a href={SPEC_URL} target="_blank" rel="noopener" className={linkClass}>
            プロジェクト概要
          </a>
          <Link href="/#community" className={linkClass}>
            コミュニティ
          </Link>
          <Link href="/#blog" className={linkClass}>
            コラム
          </Link>
        </div>
        <div>
          <h3 className="mb-2 font-sans text-sm font-medium">サポート</h3>
          <Link href="/#products" className={linkClass}>
            お買い物ガイド
          </Link>
          <button onClick={openFavorites} className={linkClass}>
            お気に入り
          </button>
          <Link href="/contact" className={linkClass}>
            お問い合わせ
          </Link>
        </div>
        <div>
          <h3 className="mb-2 font-sans text-sm font-medium">公式SNS</h3>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={s.label} className="text-muted-foreground hover:text-foreground">
                <SocialIcon name={s.icon} className="size-6" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-sans text-sm font-medium">最新トレンドをメールでお届け</h3>
          <form noValidate onSubmit={onSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="メールアドレスを入力"
              aria-label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={msg.kind === "err" || undefined}
              className="rounded-full bg-background"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="登録する">
              <ArrowRight />
            </Button>
          </form>
          <p className={cn("mt-2 text-xs", msg.kind === "err" ? "text-destructive" : msg.kind === "ok" ? "text-rose" : "text-muted-foreground")} role="status">
            {msg.text}
          </p>
        </div>
      </div>
      <Separator />
      <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
        © 2026 StyleHer. 掲載内容はデモ用のサンプルです · 写真:{" "}
        <a href="https://unsplash.com" target="_blank" rel="noopener" className="underline">
          Unsplash
        </a>
      </p>
    </footer>
  );
}
