import React from "react";
import { LucideIcon } from "lucide-react";

type BadgeState = "success" | "neutral" | "disabled";

const STATE_STYLES: Record<BadgeState, string> = {
  success:
    "text-primary bg-primary/15 border-primary/20",
  neutral:
    "text-secondary bg-secondary/10 border-secondary/20",
  disabled:
    "text-slate-500 bg-white/5 border-white/5 opacity-60",
};

export default function SignalBadge({
  label,
  state,
  icon: Icon,
}: {
  label: string;
  state: BadgeState;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-display font-bold tracking-widest uppercase transition-all ${STATE_STYLES[state]}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {label}
    </span>
  );
}
