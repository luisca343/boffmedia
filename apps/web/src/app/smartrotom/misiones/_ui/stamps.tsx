import React, { useMemo } from "react"

// ============ STAMP ============
export interface StampProps {
  children: React.ReactNode
  kind?: "completed" | "failed" | "active"
  animate?: boolean
}

export function Stamp({ children, kind = "completed", animate = false }: StampProps) {
  const cls = ["stamp"]
  if (kind === "failed") cls.push("stamp-failed")
  if (kind === "active") cls.push("stamp-active")
  if (animate) cls.push("stamp-anim")
  return <div className={cls.join(" ")}>{children}</div>
}

// ============ SPARKLES ============
export interface SparklesProps {
  count?: number
}

export function Sparkles({ count = 4 }: SparklesProps) {
  const positions = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 80 + 10 + "%",
        top: Math.random() * 80 + 10 + "%",
        delay: Math.random() * 3 + "s",
        size: Math.random() * 4 + 4,
      })),
    [count],
  )
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  )
}
