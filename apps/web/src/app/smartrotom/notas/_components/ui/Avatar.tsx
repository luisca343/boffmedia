import type { CSSProperties } from "react";

// A colored initial disc — the single source of avatar truth for shares/authors.
export function Avatar({
  name,
  color,
  size = 18,
  ring = "var(--nt-bg-1)",
  className = "",
}: {
  name: string;
  color: string;
  size?: number;
  ring?: string;
  className?: string;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    background: color,
    borderColor: ring,
    fontSize: size * 0.5,
  };
  return (
    <span
      className={`grid flex-none place-items-center rounded-full border-[1.5px] font-bold text-white ${className}`}
      style={style}
      title={name}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
