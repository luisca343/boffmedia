'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/primitives/input';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';

const COMMON_REGIONS = ['USA', 'Europe', 'Japan', 'World', 'Korea', 'Australia'];

interface Props {
  regions: string[];
  onAdd: (region: string) => void;
  onRemove: (region: string) => void;
}

export function RegionFilter({ regions, onAdd, onRemove }: Props) {
  const [custom, setCustom] = useState('');

  const addCustom = () => {
    const t = custom.trim();
    if (t && !regions.includes(t)) onAdd(t);
    setCustom('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {COMMON_REGIONS.map(r => {
          const active = regions.includes(r);
          return (
            <button
              key={r}
              onClick={() => active ? onRemove(r) : onAdd(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150
                ${active
                  ? 'bg-primary-600/30 border-primary-500 text-primary-200'
                  : 'bg-surface-800/40 border-surface-600/50 text-surface-400 hover:border-surface-500 hover:text-surface-200'
                }`}
            >
              {r}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Región personalizada..."
          className="bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400 h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="border-surface-600 text-surface-300 hover:bg-surface-700 shrink-0"
        >
          Añadir
        </Button>
      </div>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-surface-500">Activos:</span>
          {regions.map(r => (
            <Badge key={r} className="bg-primary-600/20 text-primary-300 border-primary-600/40 pr-1 gap-1">
              {r}
              <button onClick={() => onRemove(r)} className="hover:text-white transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
