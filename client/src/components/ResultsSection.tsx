import React from "react";
import Image from "next/image";
import resultsBackground from "@/assets/resultsBackground.png";
import { motion } from "motion/react";
import { Rocket, Shield, Terminal, Download, Activity } from "lucide-react";
import { AnalysisData } from "@/types/analysis";
import ManeuverCard from "./ResultsScreen/ManeuverCard";
import DiagnosticStat from "./ResultsScreen/DiagnosticStat";
import TableRow from "./ResultsScreen/TableRow";

export default function ResultsSection({
  data,
  isLoading,
}: {
  data: AnalysisData | null;
  isLoading: boolean;
}) {
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
      <section className="w-full relative py-48 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
            <div className="absolute inset-2 border-l-2 border-secondary rounded-full animate-[spin_2s_linear_reverse]" />
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
  return (
    <section className="w-full relative min-h-screen py-24 text-white">
      {/* Cosmic Theme Background Elements specifically for this section */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
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
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight leading-none mb-2 uppercase">
              DEEP <span className="text-gradient">SCAN results</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 xl:col-span-5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden h-[400px] md:h-[500px]">
            <h2 className="font-display font-bold text-xs md:text-sm tracking-[0.2em] uppercase text-primary mb-8 md:mb-12 absolute top-10 left-10">
              Convergence Score
            </h2>
            <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-6 md:mb-8 mt-12">
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
                  className="text-primary drop-shadow-[0_0_15px_rgba(193,255,254,0.6)]"
                  cx="50%"
                  cy="50%"
                  fill="transparent"
                  r="42%"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="264%"
                  strokeDashoffset={`${264 - (264 * (data!.score ?? 0)) / 100}%`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-6xl md:text-8xl font-display font-black tracking-tighter text-white">
                  {data!.score ?? "--"}
                </span>
                <span className="text-[10px] md:text-xs font-display tracking-[0.3em] uppercase text-slate-500 mt-2">
                  / 100
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between pl-2">
              <h2 className="font-display font-bold text-base md:text-lg tracking-widest uppercase flex items-center gap-3">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_theme('colors.secondary')]" />
                Tactical Maneuvers
              </h2>
              <span className="text-[10px] md:text-xs font-display text-slate-500 uppercase tracking-widest">
                {data!.suggestions.length} Directives
              </span>
            </div>
            <div className="space-y-4 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {data!.suggestions.length > 0 ? (
                data!.suggestions.map((suggestion, idx) => (
                  <ManeuverCard
                    key={idx}
                    icon={
                      idx % 3 === 0 ? Rocket : idx % 3 === 1 ? Shield : Terminal
                    }
                    title={`Directive ${idx + 1}`}
                    description={suggestion}
                    action="Execute"
                    color={
                      idx % 3 === 0
                        ? "text-primary"
                        : idx % 3 === 1
                          ? "text-secondary"
                          : "text-tertiary"
                    }
                  />
                ))
              ) : (
                <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 text-slate-500">
                  Sector clear. No critical maneuvers required.
                </div>
              )}
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
                value={data!.design_signals.image_count.toString()}
                percentage={Math.min(
                  (data!.design_signals.image_count / 20) * 100,
                  100,
                )}
                color="bg-primary"
              />
              <DiagnosticStat
                label="Video Feeds"
                value={data!.design_signals.video_count.toString()}
                percentage={Math.min(
                  (data!.design_signals.video_count / 5) * 100,
                  100,
                )}
                color="bg-secondary"
              />
              <DiagnosticStat
                label="Media Sync"
                value={data!.design_signals.has_media ? "Active" : "Offline"}
                percentage={data!.design_signals.has_media ? 100 : 0}
                color="bg-primary"
              />
              <DiagnosticStat
                label="Motion Triggers"
                value={data!.design_signals.animation_keyword_count.toString()}
                percentage={Math.min(
                  (data!.design_signals.animation_keyword_count / 10) * 100,
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
                      data!.design_signals.has_animation_library
                        ? "Detected"
                        : "None"
                    }
                    impact="Performance"
                    raw={
                      data!.design_signals.detected_libraries.join(", ") ||
                      "Null"
                    }
                    statusColor={
                      data!.design_signals.has_animation_library
                        ? "text-primary bg-primary/20"
                        : "text-slate-500 bg-white/5"
                    }
                  />
                  <TableRow
                    name="Alpha Headers (H1)"
                    status={
                      data!.h1_headings.length > 0 ? "Present" : "Missing"
                    }
                    impact="Indexability"
                    raw={data!.h1_headings.length.toString()}
                    statusColor={
                      data!.h1_headings.length > 0
                        ? "text-primary bg-primary/20"
                        : "text-red-500 bg-red-500/20"
                    }
                  />
                  <TableRow
                    name="Beta Headers (H2)"
                    status={
                      data!.h2_headings.length > 0 ? "Present" : "Missing"
                    }
                    impact="Structure"
                    raw={data!.h2_headings.length.toString()}
                    statusColor={
                      data!.h2_headings.length > 0
                        ? "text-primary bg-primary/20"
                        : "text-secondary bg-secondary/20"
                    }
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
