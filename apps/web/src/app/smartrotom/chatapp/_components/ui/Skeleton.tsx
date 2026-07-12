import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const SHIMMER =
  "linear-gradient(90deg, rgb(var(--ca-500) / .12) 25%, rgb(var(--ca-500) / .22) 37%, rgb(var(--ca-500) / .12) 63%)";

/** Shimmer placeholder shaped like the real content (replaces spinners). */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("animate-ca-shimmer rounded-ca-md motion-reduce:animate-none", className)}
      style={{ backgroundImage: SHIMMER, backgroundSize: "400% 100%", ...style }}
    />
  );
}
