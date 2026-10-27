// ===== 認証（next-auth / Auth.js v5） =====
// メールアドレスとパスワードでログインする。ログインの状態は、署名・暗号化した JWT を Cookie に入れて持つ。
// API は Cookie のセッションから本人を決める（lib/api/auth.ts）。管理者かどうかは DB の users.role で毎回確認する。
// 必要な環境変数：AUTH_SECRET（.env.example を参照）
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { clientIp, countHit } from "@/lib/api/rateLimit";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// ログインの試行回数の制限（パスワードの総当たりを防ぐ）：同じIPから10分に10回まで
const LOGIN_LIMIT = { limit: 10, windowSec: 600 };

class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email", label: "メールアドレス" },
        password: { type: "password", label: "パスワード" },
      },
      async authorize(credentials, request) {
        if (!countHit(`login:${clientIp(request)}`, LOGIN_LIMIT.limit, LOGIN_LIMIT.windowSec).ok) throw new TooManyAttempts();
        const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";
        if (!email || !password || email.length > 254) return null;

        // メールアドレスは大文字・小文字を区別しない（DB の uq_users_email）
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
        // 登録がない・パスワードが違う・パスワード未設定は、どれも同じ「ログインできません」にする
        if (!(await verifyPassword(password, user?.passwordHash))) return null;

        await prisma.user.update({ where: { id: user!.id }, data: { lastLoginAt: new Date() } });
        return { id: user!.id, email: user!.email };
      },
    }),
  ],
  callbacks: {
    // JWT の sub（ユーザーID）を、セッションの user.id として画面・API に渡す
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
