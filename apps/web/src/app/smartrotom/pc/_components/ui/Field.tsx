import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"

/**
 * The inset well every text field in the PC sits in. Shared by input, select and
 * textarea so a level range and a share code look like the same control.
 */
const WELL =
  "w-full rounded-[11px] border border-pc-line bg-pc-bg/60 px-[0.8125rem] py-[0.625rem] font-pc text-[0.84375rem] font-medium " +
  "text-pc-fg shadow-[inset_0_1px_0_rgb(255_255_255_/_.03),inset_0_2px_10px_-6px_rgb(0_0_0_/_.7)] " +
  "outline-none transition-[border-color,box-shadow,background-color] " +
  "placeholder:font-medium placeholder:text-pc-fg-subtle hover:border-pc-line-strong " +
  "focus:border-pc-accent focus:bg-pc-bg/[.88] focus:shadow-[0_0_0_3px_rgb(79_155_255_/_.16),inset_0_2px_10px_-6px_rgb(0_0_0_/_.7)]"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${WELL} ${className}`} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...rest }, ref) {
    return <textarea ref={ref} className={`${WELL} resize-y leading-[1.55] ${className}`} {...rest} />
  },
)

/**
 * The chevron is a background image because a real `<select>` cannot host a child
 * element — that is the one thing Tailwind genuinely cannot express here.
 */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7a99' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")"

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={`${WELL} cursor-pointer appearance-none pr-[2.125rem] [&>option]:bg-pc-panel-solid [&>option]:text-pc-fg ${className}`}
        style={{
          backgroundImage: CHEVRON,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "14px",
        }}
        {...rest}
      >
        {children}
      </select>
    )
  },
)

export interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-[1.375rem] w-[2.375rem] flex-none rounded-pc-pill transition-colors focus-visible:outline-none",
        checked ? "bg-pc-accent" : "bg-white/[.14]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-pc-pill bg-white transition-[left] duration-200",
          checked ? "left-[1.125rem]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  )
}

/** A keycap, for the shortcut hints. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-pc-line bg-white/5 px-[0.3125rem] font-pc-mono text-[0.6875rem] font-bold text-pc-fg-subtle">
      {children}
    </span>
  )
}
