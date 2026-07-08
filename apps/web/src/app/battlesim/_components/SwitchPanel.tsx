'use client';

import { BxBench } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import type { BSXMon } from '@/components/boffmedia-v2/primitives';

interface SwitchPanelProps {
  bench: BSXMon[];
  onSwitch: (index: number) => void;
  label?: string;
  /** Display offset for hotkey chips (move phase reserves 1-4 for moves). */
  hotkeyOffset?: number;
}

export function SwitchPanel({ bench, onSwitch, label = 'Switch', hotkeyOffset = 0 }: SwitchPanelProps) {
  if (bench.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="mono-label">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        {bench.map((mon, i) => {
          const hotkeyNum = i + 1 + hotkeyOffset;
          const isLast = i === bench.length - 1;
          return (
            <BxBench
              key={mon.id ?? i}
              mon={mon}
              hotkey={isLast && hotkeyNum > 9 ? '0' : String(hotkeyNum)}
              disabled={mon.fnt}
              onClick={mon.fnt ? undefined : () => onSwitch(i + 1)}
            />
          );
        })}
      </div>
    </div>
  );
}
