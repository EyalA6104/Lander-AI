import React from "react";
import { motion } from "motion/react";

export const Background = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Nebula Orbs */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full" />
      <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-tertiary/5 blur-[100px] rounded-full" />
    </div>
  );
};

export const HUDCorners = () => {
  return (
    <div className="fixed inset-0 z-101 pointer-events-none border-[10px] border-transparent">
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/30" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/30" />
    </div>
  );
};
