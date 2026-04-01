import React from "react";

export default function ManeuverCard({
  icon: Icon,
  title,
  description,
  action,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
  color: string;
}) {
  return (
    <div className="glass-panel p-4 md:p-6 rounded-xl hover:bg-white/10 transition-all group cursor-pointer flex items-center gap-4 md:gap-6">
      <div
        className={`w-12 h-12 md:w-16 md:h-16 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${color}`}
      >
        <Icon className="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-base md:text-lg uppercase tracking-wide mb-1 truncate">
          {title}
        </h3>
        <p className="text-slate-400 text-xs md:text-sm line-clamp-2">
          {description}
        </p>
      </div>
      <div
        className={`${color} font-display font-bold text-[10px] md:text-xs tracking-widest uppercase hidden sm:block group-hover:translate-x-2 transition-transform whitespace-nowrap`}
      >
        {action}
      </div>
    </div>
  );
}
