import React from "react";
import { Rocket } from "lucide-react";
import ResultsBackground from "./ResultsBackground";

export default function LoadingScreen() {
  return (
    <ResultsBackground className="min-h-[700px] flex items-center justify-center">
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
    </ResultsBackground>
  );
}
