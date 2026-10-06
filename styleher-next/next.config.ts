import path from "node:path";
import type { NextConfig } from "next";

// API（app/api）を動かすため、静的サイトとしての書き出し（output: "export"）はしない。
// 公開するときは Node.js が動く環境（Vercel など）に置く（docs/api.md 2.1）
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // ホームフォルダにある別の package-lock.json を見に行かないよう、このフォルダを基準にする
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
