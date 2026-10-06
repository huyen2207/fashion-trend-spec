"use client";

import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

// 最初の表示ではアニメーションしない（JavaScript の読み込み前でも内容が見えるように）
let firstLoad = true;

// ページを移動したときだけ、ふわっと切り替える
export default function Template({ children }: { children: ReactNode }) {
  const animate = !firstLoad;
  useEffect(() => {
    firstLoad = false;
  }, []);

  return (
    <motion.div initial={animate ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      {children}
    </motion.div>
  );
}
