import React, { useEffect, useState } from "react";
import Image from "next/image";
import resultsBackground from "@/assets/resultsBackground.png";
import {
  Activity,
  CheckCircle2,
  LucideIcon,
  MousePointer,
  MousePointer2,
  Palette,
  Rocket,
  Search,
  Sparkles,
  Type,
  Workflow,
  Zap,
} from "lucide-react";
import { animate } from "motion/react";
import {
  AnalysisData,
  DesignSignals,
  ExperienceSignals,
  ScoredSection,
  SECTION_WEIGHTS,
} from "@/types/analysis";
import ManeuverCard from "./ResultsScreen/ManeuverCard";
import DiagnosticStat from "./ResultsScreen/DiagnosticStat";
import TableRow from "./ResultsScreen/TableRow";
import SignalBadge from "./ResultsScreen/SignalBadge";

function clampScore(score: number | null) {
  return Math.max(0, Math.min(100, score ?? 0));
}

function formatScore(score: number | null) {
  return score == null ? "--" : score.toFixed(1);
}

function truncate(value: string | null, maxLength = 48) {
  if (!value) return "Null";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

// Truncates at a word boundary to avoid mid-word cuts.
// Used as the sole truncation strategy where CSS line-clamp is not present.
function truncateSuggestion(text: string, maxChars = 200): string {
  if (text.length <= maxChars) return text;
  const lastSpace = text.lastIndexOf(" ", maxChars);
  const cutAt = lastSpace > 0 ? lastSpace : maxChars;
  return text.slice(0, cutAt).trimEnd() + "\u2026";
}

function useCountUp(target: number | null, duration = 1.2): number | null {
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

function scoreTone(score: number | null) {
  if (score == null) return "text-slate-500 bg-white/5";
  if (score >= 80) return "text-primary bg-primary/20";
  if (score >= 60) return "text-secondary bg-secondary/20";
  return "text-red-400 bg-red-500/20";
}

function ScoreDial({
  label,
  value,
  toneClass,
  strokeClass,
  suggestions,
}: {
  label: string;
  value: number | null;
  toneClass: string;
  strokeClass: string;
  suggestions?: string[];
}) {
  const animatedValue = useCountUp(value);
  const displayValue = animatedValue ?? value;
  const normalizedScore = clampScore(displayValue);

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden min-h-[240px]">
      <h2
        className={`font-display font-bold text-xs md:text-sm tracking-[0.2em] uppercase mb-6 self-start ${toneClass}`}
      >
        {label}
      </h2>
      <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle
            className="text-white/5"
            cx="50%"
            cy="50%"
            fill="transparent"
            r="42%"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className={strokeClass}
            cx="50%"
            cy="50%"
            fill="transparent"
            r="42%"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray="264%"
            strokeDashoffset={`${264 - (264 * normalizedScore) / 100}%`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl md:text-6xl font-display font-black tracking-tighter text-white">
            {displayValue == null ? "--" : displayValue.toFixed(1)}
          </span>
          <span className="text-[10px] md:text-xs font-display tracking-[0.3em] uppercase text-slate-500 mt-2">
            / 100
          </span>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="w-full space-y-2">
          {suggestions.slice(0, 2).map((suggestion, index) => (
            <div
              key={`${label}-${index}`}
              className="text-xs text-slate-400 border border-white/5 bg-white/5 rounded-xl px-4 py-3"
            >
              {truncateSuggestion(suggestion)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightPanel({
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
      className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl ${panelClassName ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-display font-bold text-base md:text-lg tracking-widest uppercase text-white">
            {title}
          </h3>
          <p className="text-[10px] md:text-xs font-display text-slate-500 uppercase tracking-widest mt-2">
            {subtitle}&nbsp;·&nbsp;{weight}%
          </p>
        </div>
        <div
          className={`text-[10px] px-3 py-1 rounded-full font-display font-bold tracking-widest uppercase ${isUnavailable ? "text-slate-500 bg-white/5" : scoreTone(section.score)}`}
        >
          {isUnavailable
            ? "--"
            : displayScore == null
              ? "--"
              : displayScore.toFixed(1)}
        </div>
      </div>

      {/* Signal Badges */}
      {hasSignalBadges && (
        <div className="flex flex-wrap gap-2 mb-4">
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
      )}

      <div className="space-y-4">
        {isUnavailable ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-500 text-sm">
            Data Unavailable
          </div>
        ) : section.suggestions.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/5 text-slate-500 text-sm">
            Sector clear. No direct actions detected.
          </div>
        ) : (
          section.suggestions
            .slice(0, 2)
            .map((suggestion, idx) => (
              <ManeuverCard
                key={`${title}-${idx}`}
                icon={Icon}
                title={`Directive ${idx + 1}`}
                description={suggestion}
                action={action}
                color={color}
              />
            ))
        )}
      </div>
    </div>
  );
}

export default function ResultsSection({
  data,
  isLoading,
  isPartial,
  partialError,
}: {
  data: AnalysisData | null;
  isLoading: boolean;
  isPartial?: boolean;
  partialError?: string | null;
}) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Reset banner whenever a new result comes in
  useEffect(() => {
    setBannerDismissed(false);
  }, [data]);
  // Empty State Placeholder
  if (!data && !isLoading) {
    return (
      <section className="w-full relative py-24 flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto px-6 relative z-20">
          <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-12 md:p-24 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[20%] bg-primary/10 blur-[60px] rounded-full" />

            <div className="w-20 h-20 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Activity className="w-8 h-8 text-primary relative z-10" />
            </div>

            <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-widest mb-4">
              Mission Report Placeholder
            </h2>
            <p className="text-slate-400 font-sans max-w-md mx-auto text-sm md:text-base leading-relaxed mb-12">
              Enter a URL above and launch your scan to populate this sector
              with real-time architectural diagnostics and strategic maneuvers.
            </p>

            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl opacity-50">
              <div className="h-40 rounded-xl bg-white/5 border border-white/5" />
              <div className="h-40 rounded-xl bg-white/5 border border-white/5 hidden sm:block" />
              <div className="h-40 rounded-xl bg-white/5 border border-white/5 hidden sm:block" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <section className="w-full relative py-24 min-h-[700px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
            <div className="absolute inset-2 border-l-2 border-secondary rounded-full animate-spin [animation-direction:reverse]" />
            <Rocket className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="font-display font-bold text-xl tracking-[0.2em] text-gradient uppercase animate-pulse">
            Analyzing Neural Pathways...
          </div>
        </div>
      </section>
    );
  }

  // Data Results State
  const designSignals = data?.design?.signals ?? {
    has_animations: false,
    animation_keyword_count: 0,
    has_animation_library: false,
    detected_libraries: [],
    image_count: 0,
    video_count: 0,
    has_media: false,
  };

  const insightPanels = [
    {
      title: "Content",
      subtitle: "Messaging, clarity, and conversion copy",
      section: data!.content,
      icon: Type,
      color: "text-primary",
      action: "Refine",
      weight: SECTION_WEIGHTS.content,
      // Pass experience signals to content panel
      experienceSignals: data!.content.experienceSignals ?? null,
    },
    {
      title: "UX",
      subtitle: "Flow, trust, and interaction confidence",
      section: data!.ux,
      icon: MousePointer2,
      color: "text-primary",
      action: "Improve",
      weight: SECTION_WEIGHTS.ux,
      // UX panel also shows hero/CTA signals
      experienceSignals: data!.content.experienceSignals ?? null,
    },
    {
      title: "Design",
      subtitle: "Motion, media, and visual hierarchy",
      section: data!.design,
      icon: Palette,
      color: "text-tertiary",
      action: "Polish",
      weight: SECTION_WEIGHTS.design,
      // Pass the extended design signals to the design panel
      designSignals: data!.design.signals,
    },
    {
      title: "Structure",
      subtitle: "Heading hierarchy and scan patterns",
      section: data!.structure,
      icon: Workflow,
      color: "text-secondary",
      action: "Reorder",
      weight: SECTION_WEIGHTS.structure,
    },
    {
      title: "SEO",
      subtitle: "Discoverability and search visibility",
      section: data!.seo,
      icon: Search,
      color: "text-secondary",
      action: "Optimize",
      weight: SECTION_WEIGHTS.seo,
      panelClassName: "lg:col-span-2",
    },
  ];

  return (
    <section className="w-full relative min-h-screen py-24 text-white">
      {/* Cosmic Theme Background Elements specifically for this section */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
        {/* Results Background image */}
        <Image
          src={resultsBackground}
          alt="Results background theme"
          fill
          className="object-cover mix-blend-screen opacity-40 pointer-events-none"
        />
      </div>

      {/* Smooth transition gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-background to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight leading-none mb-2 uppercase">
              DEEP <span className="text-gradient">SCAN results</span>
            </h1>
          </div>
        </div>

        {/* ── Partial Analysis Warning Banner ──────────────────────────── */}
        {isPartial && !bannerDismissed && (
          <div className="mb-8 flex items-start gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4">
            <span className="text-amber-400 text-lg leading-none mt-0.5">
              ⚠
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 font-display font-bold text-xs tracking-widest uppercase mb-1">
                Partial Analysis
              </p>
              <p className="text-amber-200/70 text-xs font-sans leading-relaxed">
                {partialError ??
                  "Some sections could not be fully evaluated. Scores may be incomplete."}
              </p>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-amber-400/60 hover:text-amber-300 transition-colors text-lg leading-none flex-shrink-0"
              aria-label="Dismiss partial analysis warning"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <ScoreDial
              label="Convergence Score"
              value={data!.overallScore}
              toneClass="text-primary"
              strokeClass="text-primary drop-shadow-[0_0_5px_rgba(193,255,254,0.6)]"
            />
          </div>

          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between pl-2">
              <h2 className="font-display font-bold text-base md:text-lg tracking-widest uppercase flex items-center gap-3">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_var(--color-secondary)]" />
                Tactical Maneuvers
              </h2>
              <span className="text-[10px] md:text-xs font-display text-slate-500 uppercase tracking-widest">
                {insightPanels.reduce(
                  (count, panel) =>
                    count + Math.min(2, panel.section.suggestions.length),
                  0,
                )}{" "}
                Directives
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insightPanels.map((panel) => (
                <InsightPanel key={panel.title} {...panel} />
              ))}
            </div>
          </div>

          <div className="col-span-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl overflow-hidden relative">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12 relative z-10">
              <div>
                <h2 className="font-display font-bold text-xl md:text-2xl tracking-tight uppercase italic text-white flex items-center gap-3">
                  <Activity className="w-5 h-5 text-tertiary" />
                  Telemetry Data
                </h2>
                <p className="text-slate-500 text-[10px] md:text-xs font-display uppercase tracking-widest mt-2">
                  Structural and visual node signals
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12 relative z-10">
              <DiagnosticStat
                label="Image Nodes"
                value={designSignals.image_count.toString()}
                percentage={Math.min(
                  (designSignals.image_count / 20) * 100,
                  100,
                )}
                color="bg-primary"
              />
              <DiagnosticStat
                label="Video Feeds"
                value={designSignals.video_count.toString()}
                percentage={Math.min(
                  (designSignals.video_count / 5) * 100,
                  100,
                )}
                color="bg-secondary"
              />
              <DiagnosticStat
                label="Media Sync"
                value={designSignals.has_media ? "Active" : "Offline"}
                percentage={designSignals.has_media ? 100 : 0}
                color="bg-primary"
              />
              <DiagnosticStat
                label="Motion Triggers"
                value={designSignals.animation_keyword_count.toString()}
                percentage={Math.min(
                  (designSignals.animation_keyword_count / 10) * 100,
                  100,
                )}
                color="bg-tertiary"
              />
            </div>

            <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 relative z-10">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="border-b border-white/10">
                  <tr className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-500">
                    <th className="pb-4 font-bold">Signal Parameter</th>
                    <th className="pb-4 font-bold">Node Status</th>
                    <th className="pb-4 font-bold">System Impact</th>
                    <th className="pb-4 font-bold text-right">Raw Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <TableRow
                    name="Kinetic Drivers"
                    status={
                      designSignals.has_animation_library ? "Detected" : "None"
                    }
                    impact="Performance"
                    raw={designSignals.detected_libraries.join(", ") || "Null"}
                    statusColor={
                      designSignals.has_animation_library
                        ? "text-primary bg-primary/20"
                        : "text-slate-500 bg-white/5"
                    }
                  />
                  <TableRow
                    name="Page Title"
                    status={data!.content.title ? "Present" : "Missing"}
                    impact="Content"
                    raw={truncate(data!.content.title)}
                    statusColor={
                      data!.content.title
                        ? "text-primary bg-primary/20"
                        : "text-red-500 bg-red-500/20"
                    }
                  />
                  <TableRow
                    name="Meta Description"
                    status={
                      data!.content.metaDescription ? "Present" : "Missing"
                    }
                    impact="SEO"
                    raw={truncate(data!.content.metaDescription)}
                    statusColor={
                      data!.content.metaDescription
                        ? "text-primary bg-primary/20"
                        : "text-secondary bg-secondary/20"
                    }
                  />
                  <TableRow
                    name="Alpha Headers (H1)"
                    status={
                      data!.structure.h1Headings.length > 0
                        ? "Present"
                        : "Missing"
                    }
                    impact="Indexability"
                    raw={data!.structure.h1Headings.length.toString()}
                    statusColor={
                      data!.structure.h1Headings.length > 0
                        ? "text-primary bg-primary/20"
                        : "text-red-500 bg-red-500/20"
                    }
                  />
                  <TableRow
                    name="Beta Headers (H2)"
                    status={
                      data!.structure.h2Headings.length > 0
                        ? "Present"
                        : "Missing"
                    }
                    impact="Structure"
                    raw={data!.structure.h2Headings.length.toString()}
                    statusColor={
                      data!.structure.h2Headings.length > 0
                        ? "text-primary bg-primary/20"
                        : "text-secondary bg-secondary/20"
                    }
                  />
                  <TableRow
                    name="Overall Score"
                    status={data!.overallScore == null ? "Pending" : "Scored"}
                    impact="Mission Readiness"
                    raw={formatScore(data!.overallScore)}
                    statusColor={scoreTone(data!.overallScore)}
                  />
                  <TableRow
                    name="SEO Score"
                    status={data!.seo.score == null ? "Pending" : "Scored"}
                    impact="Discoverability"
                    raw={formatScore(data!.seo.score)}
                    statusColor={scoreTone(data!.seo.score)}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
