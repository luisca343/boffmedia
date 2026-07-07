import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string
  label: string
  size?: number
}

export function IconButton({ name, label, size = 18, className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-grid place-items-center h-10 w-10 border border-solid border-line bg-panel text-txt-muted",
        "[clip-path:polygon(0_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%)]",
        "transition-[color,border-color,background] duration-[140ms]",
        "hover:text-accent-bright hover:border-accent-line",
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={name} size={size} />
    </button>
  )
}
