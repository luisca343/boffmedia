import * as React from "react";
import { cn } from "@/lib/utils";

/** Shimmer placeholder shaped like the real layout. */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-sb-sm bg-sb-surface-3", className)} style={style} />;
}
