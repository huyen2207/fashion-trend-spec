import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "StyleHer へのご意見・ご質問・掲載のご相談はこちらから。3営業日以内にメールでお返事します。",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <nav aria-label="パンくずリスト" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              ホーム
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3" />
          </li>
          <li aria-current="page" className="text-foreground">
            お問い合わせ
          </li>
        </ol>
      </nav>

      <div className="mb-8">
        <p className="font-serif text-xs tracking-[0.3em] text-rose">CONTACT</p>
        <h1 className="text-3xl font-semibold md:text-4xl">お問い合わせ</h1>
        <p className="mt-2 text-sm text-muted-foreground">ご意見・ご質問・掲載のご相談など、お気軽にお寄せください。</p>
      </div>

      <ContactForm />
    </main>
  );
}
