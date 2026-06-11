'use client';

import { BSXBenchChip } from '@/components/boffmedia/primitives';

interface SwitchPanelProps {
  bench: Array<{ fnt: boolean; [key: string]: any }>;
  onSwitch: (index: number) => void;
  label?: string;
}

export function SwitchPanel({ bench, onSwitch, label = 'Switch' }: SwitchPanelProps) {
  if (bench.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {bench.map((mon, i) => (
          <BSXBenchChip
            key={i}
            mon={mon}
            hotkey={String(i + 1)}
            disabled={mon.fnt}
            onClick={mon.fnt ? undefined : () => onSwitch(i + 1)}
          />
        ))}
      </div>
    </div>
  );
}
