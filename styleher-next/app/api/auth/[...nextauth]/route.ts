// next-auth の入口（ログイン・ログアウト・セッションの取得など。/api/auth/...）
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
