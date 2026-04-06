import React from "react";
import {
  Activity,
  CheckCircle2,
  LucideIcon,
  Sparkles,
  Zap,
  MousePointer,
} from "lucide-react";
import {
  ScoredSection,
  ExperienceSignals,
  DesignSignals,
} from "@/types/analysis";
import SignalBadge from "./SignalBadge";
import { useCountUp, scoreTone } from "./utils";

export default function InsightPanel({
  title,
  subtitle,
  section,
  icon: Icon,
  color,
  action,
  weight,
  panelClassName,
  experienceSignals,
  designSignals,
}: {
  title: string;
  subtitle: string;
  section: ScoredSection;
  icon: LucideIcon;
  color: string;
  action: string;
  weight: number;
  panelClassName?: string;
  experienceSignals?: ExperienceSignals | null;
  designSignals?: DesignSignals | null;
}) {
  const animatedScore = useCountUp(section.score);
  const displayScore = animatedScore ?? section.score;
  const isUnavailable = section.score === null;

  // ── Experience signal badges (Content / UX panels) ──────────────────────
  const showValuePropBadge = experienceSignals?.has_clear_value_prop === true;
  const heroTextLength = experienceSignals?.hero_text_length ?? null;
  const showLowImpactBadge =
    heroTextLength != null && heroTextLength > 0 && heroTextLength < 50;

  // ── Design signal badges ─────────────────────────────────────────────────
  const animationDensity = designSignals?.animation_density ?? null;
  const hasHoverFeedback = designSignals?.has_hover_feedback ?? null;
  const hasScrollAnimations = designSignals?.has_scroll_animations ?? null;

  const densityLabel =
    animationDensity === "high"
      ? "High Visual Energy"
      : animationDensity === "medium"
        ? "Medium Visual Energy"
        : animationDensity === "low"
          ? "Low Visual Energy"
          : null;

  const densityState =
    animationDensity === "high"
      ? "success"
      : animationDensity === "medium"
        ? "neutral"
        : "disabled";

  const hasSignalBadges =
    showValuePropBadge ||
    showLowImpactBadge ||
    densityLabel !== null ||
    hasHoverFeedback !== null ||
    hasScrollAnimations !== null;

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${panelClassName ?? ""}`}
    >
      {/* Main Analysis Column */}
      <div className="lg:col-span-8 flex flex-col gap-8">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden h-full">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(193,255,254,0.1)] shrink-0 border border-primary/20">
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2 uppercase text-white">
                  {title} Metrics
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none flex items-center border border-white/5 bg-white/5">
                    {subtitle}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none flex items-center ${isUnavailable ? "text-slate-500 bg-white/5" : scoreTone(section.score)}`}
                  >
                    Score:{" "}
                    {isUnavailable ? "--" : (displayScore?.toFixed(1) ?? "--")}
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Grid: Description & Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 flex-1">
            <div className="space-y-6">
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-light">
                Your current{" "}
                <span className="text-white font-medium">
                  {title.toLowerCase()}
                </span>{" "}
                trajectory shows{" "}
                <span className="text-primary font-bold">
                  {isUnavailable
                    ? "unknown"
                    : `${Math.round(section.score ?? 0)}%`}{" "}
                  alignment
                </span>{" "}
                with optimal standards.
                {isUnavailable
                  ? " Scan data is not available for this sector."
                  : section.suggestions.length === 0
                    ? " Sector clear. No directives required."
                    : " Review the directives to optimize performance."}
              </p>
              <div className="flex -space-x-3 pt-4 items-center">
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-primary/20 flex items-center justify-center relative z-20">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-secondary/20 flex items-center justify-center relative z-10">
                  <Zap className="w-4 h-4 text-secondary" />
                </div>
                <span className="ml-6 text-[10px] text-slate-400 font-display uppercase tracking-widest pl-3">
                  Verified by Strategy AI
                </span>
              </div>
            </div>

            {/* Directives */}
            <div className="space-y-4">
              {!isUnavailable && section.suggestions.length > 0 ? (
                <>
                  <div className="bg-white/5 border border-primary/20 p-5 rounded-2xl flex flex-col">
                    <div className="text-[10px] text-primary font-display font-black tracking-[0.2em] uppercase mb-2 shrink-0">
                      Directive: {action}
                    </div>
                    <p className="text-sm text-white/90 font-sans font-medium leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                      {section.suggestions[0]}
                    </p>
                  </div>
                  {section.suggestions[1] && (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col mt-4">
                      <div className="text-[10px] text-slate-400 font-display font-black tracking-[0.2em] uppercase mb-2 shrink-0">
                        Secondary Metric
                      </div>
                      <p className="text-sm text-white/90 font-sans font-medium leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                        {section.suggestions[1]}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl h-full flex items-center justify-center min-h-[140px]">
                  <p className="text-sm text-slate-400 text-center">
                    {isUnavailable ? "Data Unavailable" : "No directives."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Column */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white leading-tight">
              Conversion Hooks
            </h3>
          </div>

          <div className="flex-1 space-y-6 relative z-10 flex flex-col ">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3">
                <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[8px] font-black uppercase tracking-widest">
                  Active
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 pr-8">
                System weight alignment and impact status for this tactical
                sector.
              </p>
              <div className="h-[1px] w-full bg-white/10 mb-4" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-display uppercase tracking-widest text-slate-500">
                  Weight Impact
                </span>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
                  {weight}%
                </span>
              </div>
            </div>

            {/* Signal Badges Area */}
            {hasSignalBadges && (
              <div className="flex flex-col gap-3 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-display uppercase tracking-widest text-slate-500">Active Signals</span>
                <div className="flex flex-wrap gap-2">
                  {showValuePropBadge && (
                    <SignalBadge
                      label="Value Prop ✓"
                      state="success"
                      icon={CheckCircle2}
                    />
                  )}
                  {showLowImpactBadge && (
                    <SignalBadge
                      label="Low Impact Copy"
                      state="neutral"
                      icon={Sparkles}
                    />
                  )}
                  {densityLabel !== null && (
                    <SignalBadge
                      label={densityLabel}
                      state={densityState as "success" | "neutral" | "disabled"}
                      icon={Zap}
                    />
                  )}
                  {hasHoverFeedback !== null && (
                    <SignalBadge
                      label="Hover Feedback"
                      state={hasHoverFeedback ? "success" : "disabled"}
                      icon={MousePointer}
                    />
                  )}
                  {hasScrollAnimations !== null && (
                    <SignalBadge
                      label="Scroll Animations"
                      state={hasScrollAnimations ? "success" : "disabled"}
                      icon={Sparkles}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
