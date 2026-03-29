'use client';

import { CONSOLES, MANUFACTURER_COLORS, type ConsoleInfo, type Manufacturer } from './consoles';

interface Props {
  selected: string | null;
  onSelect: (key: string) => void;
}

export function ConsolePicker({ selected, onSelect }: Props) {
  const groups = (Object.keys(MANUFACTURER_COLORS) as Manufacturer[]).map(mfr => ({
    mfr,
    color: MANUFACTURER_COLORS[mfr],
    entries: Object.entries(CONSOLES).filter(([, v]) => v.manufacturer === mfr),
  }));

  const renderGroup = (label: string, entries: [string, ConsoleInfo][], color: string) => (
    <div key={label}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${color}`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, info]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-all duration-150
              ${selected === key
                ? 'bg-primary-600 border-primary-500 text-white shadow-md shadow-primary-900/40'
                : 'bg-surface-800/60 border-surface-600/50 text-surface-300 hover:border-surface-500 hover:text-surface-100'
              }`}
          >
            {info.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ mfr, color, entries }) => renderGroup(mfr, entries, color))}
    </div>
  );
}
