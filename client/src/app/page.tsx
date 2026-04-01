"use client";

import React, { useState, useEffect } from "react";
import { AnalysisData } from "@/types/analysis";
import { analyzeUrl } from "@/lib/api";
import { Background, HUDCorners } from "@/components/Layout";
import { AnimatePresence, motion } from "motion/react";

import LandingScreen from "@/components/LandingScreen/LandingScreen";
import ResultsSection from "@/components/ResultsSection";

export default function Page() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<
    "connecting" | "online" | "offline"
  >("connecting");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => {
        if (res.ok) setServerStatus("online");
        else setServerStatus("offline");
      })
      .catch(() => setServerStatus("offline"));
  }, []);

  const startAnalysis = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Auto-scroll to results section so the user knows something is happening
    setTimeout(() => {
      document
        .getElementById("results-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const response = await analyzeUrl(url);
      if (response.status === "success" && response.data) {
        setResult(response.data);
      } else if (response.status === "partial" && response.data) {
        setResult(response.data);
        setError(response.error || "Analysis completed with partial data.");
      } else {
        setError(response.error || "Analysis failed");
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-[#ededfc] font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <Background />
      <HUDCorners />

      <LandingScreen
        url={url}
        setUrl={setUrl}
        onAnalyze={startAnalysis}
        error={error}
        clearError={() => setError(null)}
        serverStatus={serverStatus}
      />

      <AnimatePresence>
        {(isLoading || result) && (
          <motion.div
            id="results-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.8, ease: "easeOut" },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.5, ease: "easeIn" },
            }}
            className="overflow-hidden w-full"
          >
            <ResultsSection data={result} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full py-12 flex flex-col items-center gap-6 border-t border-white/5 bg-background/80 backdrop-blur-md relative z-20">
        <div className="text-[10px] font-black tracking-[0.4em] text-gradient font-display">
          LANDER AI
        </div>
        <div className="flex gap-10 text-white/40 font-sans text-[9px] tracking-[0.2em] uppercase">
          <a className="hover:text-primary transition-colors" href="#">
            Privacy Protocol
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Sector Map
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Support
          </a>
        </div>
        <p className="text-white/20 font-sans text-[8px] tracking-[0.3em] uppercase mt-2">
          © 2026 LANDER AI.
        </p>
      </footer>
    </div>
  );
}
