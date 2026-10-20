// DB への接続確認（npm run db:check）。
// Prisma Client で簡単なクエリを投げ、接続先の情報を表示する。
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const [info] = await prisma.$queryRaw<
    { database: string; user: string; version: string; now: Date }[]
  >`SELECT current_database()::text AS database, current_user::text AS user, version() AS version, now() AS now`;

  console.log("✅ DB に接続できました");
  console.log(`  database: ${info.database}`);
  console.log(`  user    : ${info.user}`);
  console.log(`  version : ${info.version}`);
  console.log(`  now     : ${info.now.toISOString()}`);
}

main()
  .catch((error) => {
    console.error("❌ DB に接続できませんでした");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
