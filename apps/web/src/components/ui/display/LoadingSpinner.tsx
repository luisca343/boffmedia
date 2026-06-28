"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
  platform?: "youtube" | "twitch";
}

export const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "medium",
  platform = "youtube"
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: "h-4 w-4 mb-1",
    medium: "h-8 w-8 mb-2",
    large: "h-10 w-10 mb-4"
  };

  const colorClass = platform === "youtube" ? "text-red-500" : "text-purple-500";

  return (
    <div className="flex flex-col items-center py-6">
      <Loader2 className={`${sizeClasses[size]} animate-spin ${colorClass}`} />
      <p className="text-ink">{message}</p>
    </div>
  );
};
