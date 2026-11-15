// サーバーで起きた、処理しきれなかったエラー（画面の表示・next-auth など、lib/api/http.ts の api() の外）を
// エラーのログに残し、Discord に通知する（lib/logger.ts）
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logger } = await import("@/lib/logger");
  // クエリにトークンなどが入ることがあるため、パスだけ残す
  const path = request.path.split("?")[0];
  const requestId = request.headers["x-request-id"];
  await logger.error(
    "サーバーで予期しないエラーが発生しました",
    { method: request.method, path, routePath: context.routePath, routeType: context.routeType, requestId },
    err
  );
};
