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
                  ? 'bg-primary-active/30 border-primary text-primary-hover'
                  : 'bg-layer-2/40 border-edge/50 text-ink-muted hover:border-edge hover:text-ink'
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
          className="bg-layer-2/60 border-edge text-ink placeholder-ink-dim h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="border-edge text-ink hover:bg-layer-3 shrink-0"
        >
          Añadir
        </Button>
      </div>
      {regions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-ink-muted">Activos:</span>
          {regions.map(r => (
            <Badge key={r} className="bg-primary-active/20 text-primary-hover border-primary-active/40 pr-1 gap-1">
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
