import React from "react";

interface TableRowProps {
  name: string;
  status: string;
  impact: string;
  raw: string;
  statusColor: string;
}

export default function TableRow({
  name,
  status,
  impact,
  raw,
  statusColor,
}: TableRowProps) {
  return (
    <tr className="group hover:bg-white/5 transition-colors">
      <td className="py-5 font-display text-sm font-bold tracking-wider uppercase">
        {name}
      </td>
      <td className="py-5">
        <span
          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest ${statusColor}`}
        >
          {status}
        </span>
      </td>
      <td className="py-5 text-slate-300 text-xs">{impact}</td>
      <td className="py-5 text-right font-mono text-[10px] text-slate-500">
        {raw}
      </td>
    </tr>
  );
}
