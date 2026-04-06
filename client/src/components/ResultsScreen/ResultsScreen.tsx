"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  LucideIcon,
  MousePointer2,
  Palette,
  Search,
  Type,
  Workflow,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  AnalysisData,
  DesignSignals,
  ExperienceSignals,
  ScoredSection,
  SECTION_WEIGHTS,
} from "@/types/analysis";
import ManeuverCard from "./ManeuverCard";
import DiagnosticStat from "./DiagnosticStat";
import TableRow from "./TableRow";
import LoadingScreen from "./LoadingScreen";
import ResultsBackground from "./ResultsBackground";
import InsightPanel from "./InsightPanel";

// ── Utility helpers ──────────────────────────────────────────────────────────

function truncate(value: string | null, maxLength = 48) {
  if (!value) return "Null";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatScore(score: number | null) {
  return score == null ? "--" : score.toFixed(1);
}

function scoreTone(score: number | null) {
  if (score == null) return "text-slate-500 bg-white/5";
  if (score >= 80) return "text-primary bg-primary/20";
  if (score >= 60) return "text-secondary bg-secondary/20";
  return "text-red-400 bg-red-500/20";
}

// ── Radial Conic Score Dial (hero, inline) ───────────────────────────────────

function HeroScoreDial({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  const pct = score == null ? 0 : Math.min(Math.max(score, 0), 100);
  // conic-gradient sweeps pct% of the circle
  const conicStyle: React.CSSProperties = {
    background: `conic-gradient(from 0deg, #c1fffe 0%, #c37fff ${pct * 3.6}deg, transparent ${pct * 3.6}deg)`,
  };

  return (
    <div className=" relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center shrink-0">
      {/* Track ring */}
      <div className="absolute inset-0 rounded-full border-4 border-white/10" />
      {/* Conic progress */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={conicStyle}
      />
      {/* Inner face */}
      <div className="absolute inset-3 rounded-full bg-[#0c0e18] flex flex-col items-center justify-center shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
        <span className="font-display text-4xl md:text-5xl font-black text-primary leading-none">
          {score == null ? "--" : Math.round(score)}
        </span>
        <span className="font-display text-[9px] text-slate-500 tracking-[0.3em] uppercase mt-1">
          Convergence
        </span>
      </div>
    </div>
  );
}

// ── Grade Card Tab ────────────────────────────────────────────────────────────

interface GradeCardProps {
  label: string;
  score: number | null;
  isActive: boolean;
  onClick: () => void;
}

function GradeCard({ label, score, isActive, onClick }: GradeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-5 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-2
        backdrop-blur-2xl border transition-colors duration-300 group
        ${
          isActive
            ? "border-transparent bg-white/5"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20"
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabBorder"
          className="absolute inset-0 rounded-2xl border border-primary/60 shadow-[0_0_30px_rgba(193,255,254,0.18),inset_0_0_15px_rgba(193,255,254,0.08)] pointer-events-none"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div
        className={`relative z-10 text-3xl md:text-4xl font-display font-black transition-colors ${
          isActive ? "text-primary" : "text-white group-hover:text-primary/80"
        }`}
      >
        {score == null ? "--" : Math.round(score)}
      </div>
      <div
        className={`relative z-10 text-[9px] md:text-[10px] font-display tracking-widest uppercase transition-colors ${
          isActive
            ? "text-primary"
            : "text-slate-500 group-hover:text-secondary"
        }`}
      >
        {label}
      </div>
      {isActive && (
        <motion.div
          layoutId="activeTabDot"
          className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#c1fffe]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResultsScreen({
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
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(1);

  // Reset state whenever a new result comes in
  useEffect(() => {
    setBannerDismissed(false);
    setActiveTab(0);
    setDirection(1);
  }, [data]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (!data) {
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

  // ── Data Results State ─────────────────────────────────────────────────────
  const designSignals = data.design.signals ?? {
    has_animations: false,
    animation_keyword_count: 0,
    has_animation_library: false,
    detected_libraries: [],
    image_count: 0,
    video_count: 0,
    has_media: false,
  };

  const categories: Array<{
    label: string;
    score: number | null;
    subtitle: string;
    section: ScoredSection;
    icon: LucideIcon;
    color: string;
    action: string;
    weight: number;
    experienceSignals?: ExperienceSignals | null;
    designSignals?: DesignSignals | null;
  }> = [
    {
      label: "Content",
      score: data.content.score,
      subtitle: "Messaging, clarity, and conversion copy",
      section: data.content,
      icon: Type,
      color: "text-primary",
      action: "Refine",
      weight: SECTION_WEIGHTS.content,
      experienceSignals: data.content.experienceSignals ?? null,
    },
    {
      label: "UX",
      score: data.ux.score,
      subtitle: "Flow, trust, and interaction confidence",
      section: data.ux,
      icon: MousePointer2,
      color: "text-primary",
      action: "Improve",
      weight: SECTION_WEIGHTS.ux,
      experienceSignals: data.content.experienceSignals ?? null,
    },
    {
      label: "Design",
      score: data.design.score,
      subtitle: "Motion, media, and visual hierarchy",
      section: data.design,
      icon: Palette,
      color: "text-tertiary",
      action: "Polish",
      weight: SECTION_WEIGHTS.design,
      designSignals: data.design.signals,
    },
    {
      label: "Structure",
      score: data.structure.score,
      subtitle: "Heading hierarchy and scan patterns",
      section: data.structure,
      icon: Workflow,
      color: "text-secondary",
      action: "Reorder",
      weight: SECTION_WEIGHTS.structure,
    },
    {
      label: "SEO",
      score: data.seo.score,
      subtitle: "Discoverability and search visibility",
      section: data.seo,
      icon: Search,
      color: "text-secondary",
      action: "Optimize",
      weight: SECTION_WEIGHTS.seo,
    },
  ];

  const activeCategory = categories[activeTab];

  function handleTabClick(idx: number) {
    if (idx === activeTab) return;
    setDirection(idx > activeTab ? 1 : -1);
    setActiveTab(idx);
  }

  function handleNext() {
    setDirection(1);
    setActiveTab((prev) => (prev + 1) % categories.length);
  }

  return (
    <ResultsBackground>
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full pb-20">
        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row items-center lg:items-start text-center lg:text-left justify-between gap-10 mb-12 relative">
          <div className="flex-1 flex flex-col items-center lg:items-start">
            {/* Sector label */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <span className="h-[2px] w-12 bg-primary inline-block" />
              <span className="font-display text-primary text-xs font-bold tracking-[0.4em] uppercase">
                Sector Alpha Reporting
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tighter mb-6 uppercase">
              DEEP <span className="text-gradient">SCAN results</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-base md:text-lg max-w-2xl font-light leading-relaxed">
              Artificial intelligence analysis for your landing page .
              We&apos;ve synthesized cross-spectrum telemetry to identify
              critical maneuvers.
            </p>
          </div>

          {/* Inline score dial */}
          <HeroScoreDial className="mt-10" score={data.overallScore} />
        </header>

        {/* ── Partial Analysis Warning Banner ─────────────────────────────── */}
        {isPartial && !bannerDismissed && (
          <div className="mb-10 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4">
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

        {/* ── Grade Card Tabs ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
          {categories.map((cat, idx) => (
            <GradeCard
              key={cat.label}
              label={cat.label}
              score={cat.score}
              isActive={activeTab === idx}
              onClick={() => handleTabClick(idx)}
            />
          ))}
        </section>

        {/* ── Tactical Maneuvers ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 md:gap-8">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.05em] flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-5 flex-1 uppercase text-white text-center md:text-left">
            <span className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#c1fffe] hidden md:block" />
            <span className="hidden sm:inline">Tactical Maneuvers:</span>
            <span className="sm:hidden">Sector:</span>
            <span className="text-primary ml-1 md:ml-2">
              {activeCategory.label}
            </span>
            <span className="hidden md:block h-[1px] flex-1 bg-gradient-to-r from-white/30 to-transparent ml-4" />
          </h2>
          <button
            onClick={handleNext}
            className="flex items-center justify-center h-14 md:h-16 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 text-primary hover:bg-primary/20 transition-all group shrink-0 px-6 md:px-8 shadow-[0_0_20px_rgba(193,255,254,0.05)] hover:shadow-[0_0_30px_rgba(193,255,254,0.15)] w-full md:w-auto"
          >
            <span className="font-display text-xs font-black tracking-[0.3em] uppercase mr-3 md:mr-4">
              Next Sector
            </span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="relative mb-24 min-h-[400px]">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 60 : -60,
                  opacity: 0,
                  scale: 0.98,
                }),
                center: {
                  zIndex: 1,
                  x: 0,
                  opacity: 1,
                  scale: 1,
                },
                exit: (dir: number) => ({
                  zIndex: 0,
                  x: dir < 0 ? 60 : -60,
                  opacity: 0,
                  scale: 0.98,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.3 },
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <InsightPanel
                title={activeCategory.label}
                subtitle={activeCategory.subtitle}
                section={activeCategory.section}
                icon={activeCategory.icon}
                color={activeCategory.color}
                action={activeCategory.action}
                weight={activeCategory.weight}
                experienceSignals={activeCategory.experienceSignals}
                designSignals={activeCategory.designSignals}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Telemetry Data ───────────────────────────────────────────────── */}
        <section className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

          {/* Table header */}
          <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center md:items-start gap-6 bg-black/20 backdrop-blur-md text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
              <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight uppercase flex items-center justify-center md:justify-start gap-3 text-white">
                <Activity className="w-5 h-5 text-tertiary" />
                Telemetry Data
              </h2>
              <p className="text-slate-500 text-[10px] font-display uppercase tracking-widest mt-1">
                Structural and visual node signals
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">
                v2.4.0
              </span>
            </div>
          </div>

          {/* Diagnostic Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 p-8 md:p-10 border-b border-white/5">
            <DiagnosticStat
              label="Image Nodes"
              value={designSignals.image_count.toString()}
              percentage={Math.min((designSignals.image_count / 20) * 100, 100)}
              color="bg-primary"
            />
            <DiagnosticStat
              label="Video Feeds"
              value={designSignals.video_count.toString()}
              percentage={Math.min((designSignals.video_count / 5) * 100, 100)}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-8 md:px-10 py-5 text-[10px] text-slate-500 font-display uppercase tracking-[0.2em] font-bold">
                    Signal Parameter
                  </th>
                  <th className="px-8 md:px-10 py-5 text-[10px] text-slate-500 font-display uppercase tracking-[0.2em] font-bold">
                    Node Status
                  </th>
                  <th className="px-8 md:px-10 py-5 text-[10px] text-slate-500 font-display uppercase tracking-[0.2em] font-bold">
                    System Impact
                  </th>
                  <th className="px-8 md:px-10 py-5 text-[10px] text-slate-500 font-display uppercase tracking-[0.2em] font-bold text-right">
                    Raw Output
                  </th>
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
                  status={data.content.title ? "Present" : "Missing"}
                  impact="Content"
                  raw={truncate(data.content.title)}
                  statusColor={
                    data.content.title
                      ? "text-primary bg-primary/20"
                      : "text-red-500 bg-red-500/20"
                  }
                />
                <TableRow
                  name="Meta Description"
                  status={data.content.metaDescription ? "Present" : "Missing"}
                  impact="SEO"
                  raw={truncate(data.content.metaDescription)}
                  statusColor={
                    data.content.metaDescription
                      ? "text-primary bg-primary/20"
                      : "text-secondary bg-secondary/20"
                  }
                />
                <TableRow
                  name="Alpha Headers (H1)"
                  status={
                    data.structure.h1Headings.length > 0 ? "Present" : "Missing"
                  }
                  impact="Indexability"
                  raw={data.structure.h1Headings.length.toString()}
                  statusColor={
                    data.structure.h1Headings.length > 0
                      ? "text-primary bg-primary/20"
                      : "text-red-500 bg-red-500/20"
                  }
                />
                <TableRow
                  name="Beta Headers (H2)"
                  status={
                    data.structure.h2Headings.length > 0 ? "Present" : "Missing"
                  }
                  impact="Structure"
                  raw={data.structure.h2Headings.length.toString()}
                  statusColor={
                    data.structure.h2Headings.length > 0
                      ? "text-primary bg-primary/20"
                      : "text-secondary bg-secondary/20"
                  }
                />
                <TableRow
                  name="Overall Score"
                  status={data.overallScore == null ? "Pending" : "Scored"}
                  impact="Mission Readiness"
                  raw={formatScore(data.overallScore)}
                  statusColor={scoreTone(data.overallScore)}
                />
                <TableRow
                  name="SEO Score"
                  status={data.seo.score == null ? "Pending" : "Scored"}
                  impact="Discoverability"
                  raw={formatScore(data.seo.score)}
                  statusColor={scoreTone(data.seo.score)}
                />
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-white/[0.02] text-center border-t border-white/5">
            <span className="text-[10px] font-display font-bold text-slate-600 uppercase tracking-[0.3em]">
              End of Telemetry Log
            </span>
          </div>
        </section>
      </div>
    </ResultsBackground>
  );
}
