"use client"

interface BSWinProbProps {
  a: number
  b: number
  nameA: string
  nameB: string
}

export function BSWinProb({ a, b, nameA, nameB }: BSWinProbProps) {
  return (
    <div className="flex flex-col gap-[.4rem]">
      <div className="flex justify-between font-mono text-[.66rem] font-bold">
        <span style={{ color: "var(--cyan-400)" }}>{nameA} {a}%</span>
        <span style={{ color: "var(--orange-400)" }}>{b}% {nameB}</span>
      </div>
      <div className="flex h-[14px] rounded-[var(--radius-pill)] overflow-hidden border border-solid border-edge-strong">
        <span className="transition-[width] duration-[.8s] ease-[var(--ease)]" style={{ width: `${a}%`, background: "linear-gradient(90deg, var(--cyan-500), var(--cyan-400))" }} />
        <span className="transition-[width] duration-[.8s] ease-[var(--ease)]" style={{ width: `${b}%`, background: "linear-gradient(90deg, var(--orange-400), var(--orange-600))" }} />
      </div>
    </div>
  )
}
