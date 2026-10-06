import { Briefcase, Heart, House, Plane, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import type { SceneIcon } from "@/lib/data";

// シーンのアイコン（data.ts の icon 名 → lucide のアイコン）
export const SCENE_ICONS: Record<SceneIcon, LucideIcon> = {
  briefcase: Briefcase,
  bag: ShoppingBag,
  heart: Heart,
  sparkle: Sparkles,
  plane: Plane,
  home: House,
};

// SNS のロゴ（lucide にはブランドのロゴがないため、ここで持つ）
const SOCIAL_PATHS = {
  facebook: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M13.2 20v-6.3h2.1l.3-2.5h-2.4V9.7c0-.7.2-1.2 1.2-1.2h1.3V6.3c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3v1.8H8.5v2.5h2.1V20h2.6z" fill="#fff" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5M14 3c.4 2.6 2.1 4.2 4.8 4.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor" />
      <path d="M10 9.2v5.6l4.8-2.8L10 9.2z" fill="#fff" />
    </>
  ),
};

export function SocialIcon({ name, className }: { name: keyof typeof SOCIAL_PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {SOCIAL_PATHS[name]}
    </svg>
  );
}
