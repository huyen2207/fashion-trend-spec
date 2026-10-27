// 会員のログイン用パスワードを設定する（users.password_hash を書き換える）。
//   npm run user:set-password -- <メールアドレス> <パスワード>
// 例：DB の初期データを入れたあとで、ログイン機能を追加する前からいる会員にパスワードを付けるとき
import "dotenv/config";
import { checkPasswordRule, hashPassword } from "../lib/auth/password";
import { prisma } from "../lib/db";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) throw new Error("使い方：npm run user:set-password -- <メールアドレス> <パスワード>");
  const problem = checkPasswordRule(password);
  if (problem) throw new Error(problem);

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!user) throw new Error(`${email} の会員が見つかりません。`);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  console.log(`${user.email}（${user.role}）のパスワードを設定しました。`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
