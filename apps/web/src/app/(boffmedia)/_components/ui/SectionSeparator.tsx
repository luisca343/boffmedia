interface SectionSeparatorProps {
  variant?: 'default' | 'purple' | 'blue' | 'orange';
  className?: string;
}

export function SectionSeparator({ variant = 'purple', className = "" }: SectionSeparatorProps) {
  const gradientClasses: Record<NonNullable<SectionSeparatorProps["variant"]>, string> = {
    default: "from-transparent via-accent-500 to-transparent",
    purple: "from-transparent via-accent-500 to-transparent",
    blue: "from-transparent via-secondary-500 to-transparent",
    orange: "from-transparent via-amber-500 to-transparent",
  };

  const borderClasses: Record<NonNullable<SectionSeparatorProps["variant"]>, string> = {
    default: "border-accent-500/30",
    purple: "border-accent-500/30",
    blue: "border-secondary-500/30",
    orange: "border-amber-500/30",
  };

  const dotSets: Record<NonNullable<SectionSeparatorProps["variant"]>, string[]> = {
    default: ["bg-accent-400", "bg-cyan-400", "bg-pink-400"],
    purple: ["bg-accent-400", "bg-cyan-400", "bg-pink-400"],
    blue: ["bg-secondary-400", "bg-cyan-400", "bg-indigo-400"],
    orange: ["bg-amber-400", "bg-orange-400", "bg-yellow-400"],
  };

  return (
    <div className={`relative flex items-center justify-center my-10 ${className}`}>
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className={`w-full h-px bg-gradient-to-r ${gradientClasses[variant]}`} />
      </div>

      <div className={`relative bg-surface-900 px-6 py-3 rounded-full ${borderClasses[variant]} border shadow-sm`}>
        <div className="flex items-center gap-3">
          {dotSets[variant].map((dotClass, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${dotClass}`}
            >
              <span
                className={`block w-full h-full rounded-full ${dotClass} animate-ping`}
                style={{ animationDelay: `${i * 140}ms` }}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}