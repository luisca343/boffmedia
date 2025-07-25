interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-700/50">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500/20 to-cyan-500/20 border border-primary-500/30">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-surface-100">{title}</h3>
    </div>
  );
}
