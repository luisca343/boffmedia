interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-600/50">
      <div className="p-2 rounded-lg bg-surface-700/50 border border-surface-600/50 text-surface-200">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-surface-50">{title}</h3>
        {subtitle && (
          <p className="text-sm text-surface-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}