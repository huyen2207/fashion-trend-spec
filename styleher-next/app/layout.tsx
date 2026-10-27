import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MotionProvider } from "@/components/motion";
import { Overlays } from "@/components/Overlays";
import { StoreProvider } from "@/components/StoreProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  // 各ページの title は「お問い合わせ｜StyleHer」のように表示する
  title: { default: "StyleHer｜毎日のトレンドとコーデ提案", template: "%s｜StyleHer" },
  description:
    "StyleHer（スタイルハー）は、20〜40代の女性のためのファッション情報サイト。毎日更新のトレンド、シーン別コーデ、人気ショップの購入リンクをまとめてお届けします。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ページ移動のときはなめらかスクロールを止め、目的の位置へ確実に移動させる
    <html lang="ja" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:wght@500;600&family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* ヘッダー・フッター・詳細ダイアログ・お気に入りは全ページ共通。ログインの状態は SessionProvider で画面に渡す */}
        <SessionProvider>
          <MotionProvider>
            <StoreProvider>
              <Header />
              {children}
              <Footer />
              <Overlays />
              <Toaster position="bottom-center" />
            </StoreProvider>
          </MotionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
