interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-edge/50">
      <div className="p-2 rounded-lg bg-layer-3/50 border border-edge/50 text-ink">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        {subtitle && (
          <p className="text-sm text-ink-muted">{subtitle}</p>
        )}
      </div>
    </div>
  );
}