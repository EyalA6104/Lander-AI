import React from "react";
import { motion } from "motion/react";

export default function DiagnosticStat({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-display text-slate-500 uppercase tracking-widest">
          {label}
        </span>
        <span className="font-display text-lg font-bold">{value}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
