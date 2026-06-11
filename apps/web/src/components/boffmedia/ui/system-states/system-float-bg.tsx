"use client"

interface SystemFloatBgProps {
  variant?: "warm" | "accent" | "cool"
}

const orbColors = {
  warm: { a: "var(--orange-600)", b: "var(--rose-500)", c: "var(--amber-400)" },
  accent: { a: "var(--accent)", b: "var(--accent-bright)", c: "var(--purple-500)" },
  cool: { a: "var(--cyan-600)", b: "var(--purple-600)", c: "var(--cyan-400)" },
}

export function SystemFloatBg({ variant = "accent" }: SystemFloatBgProps) {
  const c = orbColors[variant]
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(var(--grid-dot) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          WebkitMaskImage: "radial-gradient(120% 90% at 50% 30%, #000 30%, transparent 75%)",
          maskImage: "radial-gradient(120% 90% at 50% 30%, #000 30%, transparent 75%)",
          opacity: 0.7,
        }}
      />
      <span
        className="floatbg__orb absolute rounded-full"
        style={{
          width: "38vmax", height: "38vmax", top: "-12vmax", left: "-8vmax",
          background: c.a, filter: "blur(60px)", opacity: 0.5,
          animation: "floatdrift 16s var(--ease) infinite alternate",
        }}
      />
      <span
        className="floatbg__orb absolute rounded-full"
        style={{
          width: "30vmax", height: "30vmax", bottom: "-14vmax", right: "-6vmax",
          background: c.b, filter: "blur(60px)", opacity: 0.5,
          animation: "floatdrift 20s var(--ease) infinite alternate",
          animationDelay: "-4s",
        }}
      />
      <span
        className="floatbg__orb absolute rounded-full"
        style={{
          width: "18vmax", height: "18vmax", top: "40%", left: "55%",
          background: c.c, filter: "blur(60px)", opacity: 0.35,
          animation: "floatdrift 13s var(--ease) infinite alternate",
          animationDelay: "-2s",
        }}
      />
    </div>
  )
}
