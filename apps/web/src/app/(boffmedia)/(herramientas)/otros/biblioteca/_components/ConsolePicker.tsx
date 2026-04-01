'use client';

import { CONSOLES, MANUFACTURER_COLORS, type ConsoleInfo, type Manufacturer } from './consoles';

interface Props {
  selected: string | null;
  onSelect: (key: string) => void;
  compact?: boolean;
}

export function ConsolePicker({ selected, onSelect, compact = false }: Props) {
  const groups = (Object.keys(MANUFACTURER_COLORS) as Manufacturer[]).map(mfr => ({
    mfr,
    color: MANUFACTURER_COLORS[mfr],
    entries: Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === mfr),
  }));

  const renderGroup = (label: string, entries: [string, ConsoleInfo][], color: string) => (
    <div key={label} className={compact ? 'flex items-start gap-2' : undefined}>
      <p className={`
        font-semibold uppercase tracking-widest shrink-0
        ${compact ? 'text-[10px] mt-1.5 w-16 text-right' : 'text-xs mb-2'}
        ${color}
      `}>
        {label}
      </p>
      <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-2'}`}>
        {entries.map(([key, info]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`rounded border font-medium transition-all duration-150
              ${compact
                ? 'px-1.5 py-0.5 text-xs'
                : 'px-3 py-1.5 text-sm'
              }
              ${selected === key
                ? 'bg-primary-600 border-primary-500 text-white shadow-sm shadow-primary-900/40'
                : 'bg-surface-800/60 border-surface-600/50 text-surface-300 hover:border-surface-500 hover:text-surface-100'
              }`}
          >
            {compact ? info.shortLabel : info.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-5'}`}>
      {groups.map(({ mfr, color, entries }) => renderGroup(mfr, entries, color))}
    </div>
  );
}
