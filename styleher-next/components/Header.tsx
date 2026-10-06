"use client";

import { Heart, Menu, Search } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useStore } from "./StoreProvider";

// section: トップページ内のセクションの id（表示中のものを強調する）
const NAV = [
  { href: "/", label: "ホーム", section: "top" },
  { href: "/#trends", label: "トレンド", section: "trends" },
  { href: "/#shindan", label: "スタイル診断", section: "shindan" },
  { href: "/#outfits", label: "コーデ提案", section: "outfits" },
  { href: "/#products", label: "アイテム", section: "products" },
  { href: "/#blog", label: "コラム", section: "blog" },
  { href: "/#community", label: "コミュニティ", section: "community" },
  { href: "/contact", label: "お問い合わせ" },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-serif text-2xl font-semibold tracking-wide">StyleHer</span>
      <span className="mt-1 text-[10px] tracking-[0.2em] text-muted-foreground">毎日、もっと私らしく</span>
    </span>
  );
}

export function Header() {
  const { favs, openSearch, openFavorites } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [section, setSection] = useState("top");
  const [query, setQuery] = useState("");
  // 少しスクロールしたら、ヘッダーに影をつける
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));
  const favCount = favs.trend.length + favs.outfit.length + favs.product.length;

  // トップページでは、表示中のセクションに合わせてメニューを強調
  useEffect(() => {
    if (pathname !== "/") return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    NAV.forEach(({ section }) => {
      const el = section && section !== "top" && document.getElementById(section);
      if (el) observer.observe(el);
    });
    const onScroll = () => window.scrollY < 300 && setSection("top");
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  const isActive = (item: (typeof NAV)[number]) =>
    pathname === "/" ? item.section === section : item.href === pathname;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    openSearch(query.trim());
    setQuery("");
  };

  const navLink = (item: (typeof NAV)[number], extra?: string) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMenuOpen(false)}
      aria-current={isActive(item) ? "page" : undefined}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        isActive(item) ? "font-medium text-foreground" : "text-muted-foreground",
        extra
      )}
    >
      {item.label}
    </Link>
  );

  return (
    <header
      id="top"
      className={cn(
        "sticky top-0 z-40 border-b bg-background/85 backdrop-blur transition-shadow duration-300",
        scrolled ? "shadow-[0_6px_24px_rgba(60,35,30,0.08)]" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* スマホ用メニュー */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="メニューを開く">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle asChild>
                <div>
                  <Logo />
                </div>
              </SheetTitle>
              <SheetDescription className="sr-only">メインメニュー</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col px-4" aria-label="メインメニュー">
              {NAV.map((item) => navLink(item, "border-b py-3 text-base"))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="StyleHer ホーム">
          <Logo />
        </Link>

        {/* PCではロゴがホームへのリンクになるので「ホーム」は出さない */}
        <nav className="ml-4 hidden gap-4 lg:flex" aria-label="メインメニュー">
          {NAV.slice(1).map((item) => navLink(item))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <form role="search" onSubmit={onSearch} className="relative hidden xl:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="トレンド・アイテム・ショップを検索"
              aria-label="サイト内検索"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56 rounded-full bg-card pl-9"
            />
          </form>
          <Button variant="ghost" size="icon" className="xl:hidden" aria-label="検索" onClick={() => openSearch("")}>
            <Search className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label={`お気に入り（${favCount}件）`} onClick={openFavorites}>
            <Heart className="size-5" />
            {/* 件数が変わるたびに、バッジがはずむ */}
            <AnimatePresence>
              {favCount > 0 && (
                <motion.span
                  key="badge"
                  className="absolute -top-0.5 -right-0.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <motion.span
                    key={favCount}
                    className="block"
                    initial={{ scale: 1.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 15 }}
                  >
                    <Badge className="h-4 min-w-4 bg-rose px-1 text-[10px] tabular-nums">{favCount}</Badge>
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </header>
  );
}
