import React from "react";
import Image from "next/image";
import resultsBackground from "@/assets/resultsBackground.png";

interface ResultsBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResultsBackground({
  children,
  className = "",
}: ResultsBackgroundProps) {
  return (
    <section
      className={`w-full relative min-h-screen py-24 text-white overflow-hidden ${className}`}
      style={{ clipPath: "inset(0)" }}
    >
      {/* Cosmic Theme Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
        <div className="absolute top-[40%] left-[10%] w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen" />
        {/* Technical Star Map Background Element */}
        <div className="fixed inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
          <Image
            src={resultsBackground}
            alt="Technical star map display with glowing teal digital lines"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Smooth transition gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-background to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
