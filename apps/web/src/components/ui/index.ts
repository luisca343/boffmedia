// ─── Layout (RSC-safe) ────────────────────────────────────────────────────────
// These are safe to import in server components — no createContext, no hooks.
export * from "./layout/container"
export * from "./layout/stack"
export * from "./layout/grid"
export * from "./layout/heading"
export * from "./layout/text"
export * from "./layout/divider"

// ─── Simple primitives (RSC-safe) ─────────────────────────────────────────────
// These are also safe: they use "use client" + CVA/Radix but do NOT call
// createContext at module-evaluation level in our own code.
export * from "./primitives/avatar"
export * from "./primitives/badge"
export * from "./primitives/button"
export * from "./primitives/checkbox"
export * from "./primitives/image-upload"
export * from "./primitives/input"
export * from "./primitives/label"
export * from "./primitives/progress"
export * from "./primitives/separator"
export * from "./primitives/skeleton"
export * from "./primitives/slider"
export * from "./primitives/switch"
export * from "./primitives/textarea"

// ─── Excluded from barrel (use createContext at module level) ─────────────────
// These must be imported directly from their file paths to avoid breaking
// server components. The barrel is imported by server components; any module
// here that calls React.createContext() at top level will fail in RSC.
//
//   accordion     → "@/components/ui/primitives/accordion"
//   alert         → "@/components/ui/primitives/alert"
//   alert-dialog  → "@/components/ui/primitives/alert-dialog"
//   calendar      → "@/components/ui/primitives/calendar"
//   card          → "@/components/ui/primitives/card"
//   collapsible   → "@/components/ui/primitives/collapsible"
//   command       → "@/components/ui/primitives/command"
//   dialog        → "@/components/ui/primitives/dialog"
//   dropdown-menu → "@/components/ui/primitives/dropdown-menu"
//   form          → "@/components/ui/primitives/form"
//   hover-card    → "@/components/ui/primitives/hover-card"
//   navigation-menu → "@/components/ui/primitives/navigation-menu"
//   popover       → "@/components/ui/primitives/popover"
//   scroll-area   → "@/components/ui/primitives/scroll-area"
//   select        → "@/components/ui/primitives/select"
//   sheet         → "@/components/ui/primitives/sheet"
//   table         → "@/components/ui/primitives/table"
//   tabs          → "@/components/ui/primitives/tabs"
//   tooltip       → "@/components/ui/primitives/tooltip"
