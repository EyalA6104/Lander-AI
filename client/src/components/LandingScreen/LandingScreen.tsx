import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import heroImage from "@/assets/Lander_AI_hero_image.png";
import { Rocket, Menu, X, Globe, Send } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";

export default function LandingScreen({
  url,
  setUrl,
  onAnalyze,
  serverStatus,
  error,
  clearError,
}: {
  url: string;
  setUrl: (v: string) => void;
  onAnalyze: () => void;
  serverStatus: "connecting" | "online" | "offline";
  error: string | null;
  clearError: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-[100] flex flex-col min-h-screen pt-24 pb-8"
    >
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden h-screen">
        <Image
          src={heroImage}
          alt="Lander AI Background"
          className="w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background" />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-[200] transition-colors duration-300 ${
          isScrolled
            ? "bg-[#050505] border-b border-white/5 shadow-2xl opacity-90"
            : "bg-transparent"
        }`}
      >
        <div className="flex justify-between items-center px-6 md:px-8 py-4 md:py-6 max-w-7xl mx-auto w-full relative">
          <div className="flex items-center gap-2 z-100">
            <Rocket className="text-primary w-6 h-6" />
            <span className="font-display font-black tracking-widest text-xl md:text-2xl text-gradient">
              LANDER AI
            </span>
          </div>

          {/* Desktop Nav - Centered */}
          <div className="hidden md:flex items-center justify-center gap-10 font-display tracking-[0.12em] uppercase text-xs font-bold absolute left-1/2 -translate-x-1/2 z-10 w-full max-w-md">
            <a href="#" className="text-primary border-b-2 border-primary pb-1">
              Explorer
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Mission Log
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Tech Specs
            </a>
          </div>

          <div className="flex items-center gap-4 z-20">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 p-6 md:hidden flex flex-col gap-6 font-display tracking-[0.12em] uppercase text-sm font-bold items-center"
            >
              <a href="#" className="text-primary">
                Explorer
              </a>
              <a href="#" className="text-slate-400">
                Mission Log
              </a>
              <a href="#" className="text-slate-400">
                Tech Specs
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="flex-grow flex flex-col px-6 w-full relative z-20">
        <div className="relative z-20 flex flex-col items-center flex-grow sm:justify-top md:justify-top lg:justify-top text-center max-w-7xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-display tracking-widest uppercase mb-6 md:mb-8 backdrop-blur-md">
            <span
              className={`w-1.5 h-1.5 rounded-full ${serverStatus === "online" ? "bg-emerald-500" : serverStatus === "offline" ? "bg-red-500" : "bg-primary"} animate-pulse`}
            ></span>
            Neural Network Online
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-7xl font-display font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
            Illuminate Your <br className="hidden sm:block" />
            <span className="text-gradient">Conversion Strategy.</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12">
            Unleash the power of AI to analyze your landing pages. Gain
            actionable insights, optimize technical specs, and rocket your
            conversion rates to the stars.
          </p>

          <div className="w-full max-w-3xl mt-2 md:mt-4 mx-auto relative z-20">
            <div className="relative group w-full">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-50 transition-opacity" />
              <div className="relative flex items-center w-full shadow-2xl rounded-full">
                <div className="absolute left-6 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Globe className="w-5 h-5 text-cyan-500" />
                </div>
                <input
                  id="url-input"
                  className="w-full bg-black/40 border-0 focus:ring-1 focus:ring-primary/20 text-white placeholder:text-white/30 rounded-full py-5 md:py-6 pl-14 pr-48 text-sm md:text-base font-sans placeholder:text-slate-500 transition-all outline-none [&:-webkit-autofill]:bg-black [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
                  placeholder="Enter landing page URL for deep scanning..."
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    onClick={() => {
                      onAnalyze();
                      document
                        .getElementById("mission-report")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    disabled={serverStatus !== "online"}
                    className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white px-8 py-3 rounded-full font-headline font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/20"
                  >
                    Launch Scan
                    <Rocket className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 text-left absolute -bottom-16 w-full">
                <ErrorMessage
                  message={error}
                  type="error"
                  onDismiss={clearError}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.main>
  );
}
