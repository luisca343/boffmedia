interface GridBackgroundProps {
  variant?: 'default' | 'warm' | 'cool';
  className?: string;
}

const variantColors = {
  default: {
    primary: '#ef4444',
    secondary: '#f97316',
    accent: '#f59e0b',
  },
  warm: {
    primary: '#ef4444',
    secondary: '#f97316',
    accent: '#f59e0b',
  },
  cool: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#14b8a6',
  },
};

export function GridBackground({ variant = 'default', className = '' }: GridBackgroundProps) {
  const { primary } = variantColors[variant];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${primary}20 1px, transparent 1px), linear-gradient(90deg, ${primary}20 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
