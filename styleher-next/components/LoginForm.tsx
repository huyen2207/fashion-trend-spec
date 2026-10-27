"use client";

import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ログインフォーム（next-auth の Credentials でログインする。auth.ts）
export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (res?.error) {
        // どこが違ったかは教えない（メールアドレスの登録の有無が分からないように）
        setError(
          res.code === "too_many_attempts"
            ? "ログインの試行回数が多すぎます。しばらく時間をおいてから、もう一度お試しください。"
            : "メールアドレスまたはパスワードが正しくありません。"
        );
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("ログインできませんでした。時間をおいて、もう一度お試しください。");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="py-0">
      <CardContent className="p-6 md:p-8">
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">メールアドレス</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="例）hanako@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">パスワード</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={sending} className="w-full rounded-full">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            ログイン
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
