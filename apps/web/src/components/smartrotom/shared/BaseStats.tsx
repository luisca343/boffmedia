"use client";

import React from "react";

interface BaseStatsProps {
  stats: { label: string; value: string | number; icon?: React.ComponentType<{className?: string}> }[];
  platform: "youtube" | "twitch";
}

export const BaseStats = ({ stats, platform }: BaseStatsProps) => {
  const iconColor = platform === "youtube" ? "text-red-500" : "text-purple-500";
  
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 text-surface-300">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex items-center">
          {stat.icon && <stat.icon className={`h-4 w-4 mr-1 ${iconColor}`} />}
          <span>{stat.value} {stat.label}</span>
        </div>
      ))}
    </div>
  );
};
