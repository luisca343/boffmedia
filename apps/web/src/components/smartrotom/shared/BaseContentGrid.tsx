"use client";

import { LoadingSpinner } from "@/components/ui/display/LoadingSpinner";
import React from "react";

interface BaseContentGridProps {
  children: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  platform: "youtube" | "twitch";
  loadingMessage?: string;
}

export const BaseContentGrid = ({
  children,
  loading = false,
  emptyMessage = "No content available",
  title,
  platform,
  loadingMessage = "Loading content..."
}: BaseContentGridProps) => {
  
  if (loading) {
    return <LoadingSpinner message={loadingMessage} platform={platform} />;
  }

  const hasContent = React.Children.count(children) > 0;

  if (!hasContent) {
    return (
      <div className="text-center py-10 text-surface-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const themeColor = platform === "youtube" ? "bg-red-600" : "bg-purple-600";

  return (
    <div>
      {title && (
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className={`${themeColor} h-6 w-1 rounded-full mr-3`}></span>
          {title}
        </h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
};
