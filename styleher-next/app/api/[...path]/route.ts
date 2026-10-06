// どのAPIにも当てはまらないパスは、共通のエラー形式で 404 を返す
import { api, errors, route } from "@/lib/api/http";

const notFound = api(() => {
  throw errors.notFound("APIが見つかりません。URLを確認してください。");
});
export const { GET, POST, PUT, PATCH, DELETE } = route({ GET: notFound, POST: notFound, PUT: notFound, PATCH: notFound, DELETE: notFound });
