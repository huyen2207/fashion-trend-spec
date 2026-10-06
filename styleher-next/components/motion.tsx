"use client";

import { MotionConfig, motion, type HTMLMotionProps, type Variants } from "motion/react";
import type { ReactNode } from "react";

// アニメーションの共通設定（Framer Motion = motion ライブラリ）

export const EASE = [0.22, 1, 0.36, 1] as const;

// 端末で「視差効果を減らす」が有効なら、動き（移動・拡大）を止める
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

// 下からふわっと表示する（親の Stagger の中では、順番に表示される）
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// 画面に入ったら1回だけ表示する
export function Reveal({ delay = 0, className, children, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 子要素（StaggerItem）を順番に表示する
export function Stagger({ className, children, gap = 0.07, ...props }: HTMLMotionProps<"div"> & { gap?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 絞り込みで並びが変わるときは、新しい位置へなめらかに移動する（layout）
export function StaggerItem({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={fadeUp} exit="exit" layout="position" {...props}>
      {children}
    </motion.div>
  );
}
