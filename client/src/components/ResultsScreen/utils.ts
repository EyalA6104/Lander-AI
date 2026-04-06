import React, { useEffect, useState } from "react";
import { animate } from "motion/react";

export function useCountUp(target: number | null, duration = 1.2): number | null {
  const [displayed, setDisplayed] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) {
      setDisplayed(null);
      return;
    }
    setDisplayed(0);
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v: number) => setDisplayed(v),
    });
    return () => controls.stop();
  }, [target, duration]);

  return displayed;
}

export function clampScore(score: number | null) {
  return Math.max(0, Math.min(100, score ?? 0));
}

export function scoreTone(score: number | null) {
  if (score == null) return "text-slate-500 bg-white/5";
  if (score >= 80) return "text-primary bg-primary/20";
  if (score >= 60) return "text-secondary bg-secondary/20";
  return "text-red-400 bg-red-500/20";
}
