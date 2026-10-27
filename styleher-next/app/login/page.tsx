import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "ログイン", robots: { index: false } };

// ログイン後に戻る先。ほかのサイトへ飛ばされないよう、このサイトの中のパス（/ で始まり // で始まらない）だけを使う
function safePath(raw: string | string[] | undefined) {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const callbackUrl = safePath(sp.callbackUrl);
  // ログイン済みなら、戻る先へ
  if ((await auth())?.user) redirect(callbackUrl);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 md:py-16">
      <div className="mb-8 text-center">
        <p className="font-serif text-xs tracking-[0.3em] text-rose">LOGIN</p>
        <h1 className="text-3xl font-semibold">ログイン</h1>
        <p className="mt-2 text-sm text-muted-foreground">メールアドレスとパスワードを入力してください。</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
