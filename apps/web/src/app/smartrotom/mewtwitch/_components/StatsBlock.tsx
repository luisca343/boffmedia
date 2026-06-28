"use client";

import React from "react";

interface StatsBlockProps {
  stats: { label: string; value: string | number }[];
}

export const StatsBlock = ({ stats }: StatsBlockProps) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-layer-2 rounded-lg shadow">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex flex-col items-center px-4 py-2 bg-layer-1 rounded-lg">
          <span className="text-xs text-purple-400 font-semibold">{stat.label}</span>
          <span className="text-lg text-white font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};
