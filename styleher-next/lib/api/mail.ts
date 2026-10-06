// メール送信（ダミー）。本番ではメール配信サービスで送る（docs/api.md 11章 #2）。
// ダミー版では、開発中だけリンクをサーバーのログに出す（本番ではログにトークンを書かない。3.11）
export function sendDummyMail(subject: string, lines: string[]) {
  if (process.env.NODE_ENV === "production") return;
  console.log(`\n[ダミーのメール送信] ${subject}\n${lines.map((l) => `  ${l}`).join("\n")}\n`);
}
