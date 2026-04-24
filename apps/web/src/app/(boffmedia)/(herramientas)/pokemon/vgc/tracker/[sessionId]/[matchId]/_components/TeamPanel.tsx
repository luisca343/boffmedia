'use client';

import { X } from 'lucide-react';
import { spriteUrl, SpeciesEntry } from '@/features/vgc-tracker/types';
import type { MatchSlot } from '@/features/vgc-tracker/types';
import { PokemonAutocomplete } from './PokemonAutocomplete';

interface Props {
  label: string;
  slots: MatchSlot[];
  editable?: boolean;
  search?: (query: string) => SpeciesEntry[];
  onSlotChange: (updated: MatchSlot[]) => void;
}

export function TeamPanel({ label, slots, editable = false, search, onSlotChange }: Props) {
  const leads = slots.filter((s) => s.role === 'lead');
  const backs = slots.filter((s) => s.role === 'back');

  // Click on an unassigned pool pokemon → fills the next available slot.
  // Leads fill first (more time-critical), then backs.
  // Hard cap: no-op once 2 leads + 2 backs are filled.
  const assign = (slotIndex: number) => {
    const slot = slots.find((s) => s.slotIndex === slotIndex);
    if (!slot?.speciesId || slot.role !== 'unknown') return;

    const nextRole: 'lead' | 'back' | null =
      leads.length < 2 ? 'lead' : backs.length < 2 ? 'back' : null;
    if (!nextRole) return;

    onSlotChange(slots.map((s) => (s.slotIndex === slotIndex ? { ...s, role: nextRole } : s)));
  };

  // Click × on an assignment slot → returns that pokemon to the pool (role = unknown).
  const unassign = (slotIndex: number) => {
    onSlotChange(
      slots.map((s) => (s.slotIndex === slotIndex ? { ...s, role: 'unknown' as const } : s)),
    );
  };

  const fillSpecies = (slotIndex: number, entry: SpeciesEntry) => {
    onSlotChange(
      slots.map((s) =>
        s.slotIndex === slotIndex ? { ...s, speciesId: entry.id, speciesName: entry.name } : s,
      ),
    );
  };

  const clearSpecies = (slotIndex: number) => {
    onSlotChange(
      slots.map((s) =>
        s.slotIndex === slotIndex
          ? { ...s, speciesId: null, speciesName: null, role: 'unknown' as const }
          : s,
      ),
    );
  };

  const allAssigned = leads.length >= 2 && backs.length >= 2;

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">{label}</span>

      {/* ── Team pool (3 × 2 grid) ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <PoolCard
            key={slot.slotIndex}
            slot={slot}
            editable={editable}
            search={search}
            canAssign={!allAssigned && slot.role === 'unknown' && !!slot.speciesId}
            onAssign={() => assign(slot.slotIndex)}
            onFill={(entry) => fillSpecies(slot.slotIndex, entry)}
            onClear={() => clearSpecies(slot.slotIndex)}
          />
        ))}
      </div>

      {/* ── Assignment zones ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <AssignmentZone role="lead" filled={leads} onRemove={unassign} />
        <AssignmentZone role="back" filled={backs} onRemove={unassign} />
      </div>
    </div>
  );
}

// ─── Pool card ────────────────────────────────────────────────────────────────

function PoolCard({
  slot,
  editable,
  search,
  canAssign,
  onAssign,
  onFill,
  onClear,
}: {
  slot: MatchSlot;
  editable: boolean;
  search?: (q: string) => SpeciesEntry[];
  canAssign: boolean;
  onAssign: () => void;
  onFill: (entry: SpeciesEntry) => void;
  onClear: () => void;
}) {
  // Empty slot
  if (!slot.speciesId) {
    if (editable && search) {
      return (
        <div className="aspect-square rounded-lg border border-dashed border-surface-600 flex items-center justify-center p-1.5 overflow-visible">
          <PokemonAutocomplete search={search} onSelect={onFill} placeholder="Type name…" />
        </div>
      );
    }
    return (
      <div className="aspect-square rounded-lg border border-dashed border-surface-700 flex items-center justify-center">
        <span className="text-surface-600 text-xl select-none">?</span>
      </div>
    );
  }

  const isAssigned = slot.role !== 'unknown';

  return (
    <div className="relative aspect-square">
      <button
        onClick={isAssigned ? undefined : canAssign ? onAssign : undefined}
        disabled={isAssigned || !canAssign}
        className={[
          'w-full h-full rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all',
          isAssigned
            ? 'opacity-35 cursor-default bg-surface-800 ring-1 ring-surface-700'
            : canAssign
            ? 'cursor-pointer bg-surface-800 ring-1 ring-surface-700 hover:ring-2 hover:ring-primary-400/60 hover:bg-surface-750 hover:opacity-90'
            : 'opacity-50 cursor-not-allowed bg-surface-800 ring-1 ring-surface-700',
        ].join(' ')}
        title={
          isAssigned
            ? `${slot.role} — click × in zone below to remove`
            : canAssign
            ? 'Click to assign to next open slot'
            : 'All 4 slots are full'
        }
      >
        <img
          src={spriteUrl(slot.speciesName!)}
          alt={slot.speciesName ?? ''}
          className="w-11 h-11 object-contain pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://play.pokemonshowdown.com/sprites/dex/substitute.png';
          }}
        />
        <span className="text-[10px] text-surface-300 truncate max-w-full px-1 leading-none">
          {slot.speciesName}
        </span>
      </button>

      {/* Role badge on assigned cards */}
      {isAssigned && (
        <span
          className={[
            'absolute top-1 right-1 text-[9px] font-bold rounded px-1 py-px pointer-events-none',
            slot.role === 'lead'
              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
              : 'bg-blue-400/20 text-blue-300 border border-blue-400/30',
          ].join(' ')}
        >
          {slot.role === 'lead' ? 'L' : 'B'}
        </span>
      )}

      {/* Remove-from-team button (editable, unassigned only) */}
      {editable && !isAssigned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface-600 hover:bg-red-500 text-surface-200 hover:text-white flex items-center justify-center text-[10px] font-bold leading-none transition-colors"
          title="Remove from team"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Assignment zone (Leads / Backs) ─────────────────────────────────────────

const ZONE = {
  lead: {
    label: 'Leads',
    counter: 'text-yellow-400',
    ring: 'ring-yellow-400/50',
    emptyBorder: 'border-yellow-400/15',
    badge: 'bg-yellow-400/10 text-yellow-300/60',
  },
  back: {
    label: 'Backs',
    counter: 'text-blue-400',
    ring: 'ring-blue-400/50',
    emptyBorder: 'border-blue-400/15',
    badge: 'bg-blue-400/10 text-blue-300/60',
  },
} as const;

function AssignmentZone({
  role,
  filled,
  onRemove,
}: {
  role: 'lead' | 'back';
  filled: MatchSlot[];
  onRemove: (slotIndex: number) => void;
}) {
  const cfg = ZONE[role];
  const isFull = filled.length >= 2;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-0.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
          {cfg.label}
        </span>
        <span className={`text-[10px] font-mono ${isFull ? cfg.counter : 'text-surface-600'}`}>
          {filled.length}/2
        </span>
      </div>

      <div className="flex gap-2">
        {[0, 1].map((i) => {
          const slot = filled[i] ?? null;
          return slot ? (
            <div
              key={slot.slotIndex}
              className={`flex-1 relative rounded-lg bg-surface-800 ring-2 ${cfg.ring} flex flex-col items-center justify-center gap-0.5 py-2 min-h-[72px]`}
            >
              <img
                src={spriteUrl(slot.speciesName!)}
                alt={slot.speciesName ?? ''}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://play.pokemonshowdown.com/sprites/dex/substitute.png';
                }}
              />
              <span className="text-[9px] text-surface-400 truncate max-w-full px-1 leading-none">
                {slot.speciesName}
              </span>
              <button
                onClick={() => onRemove(slot.slotIndex)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface-700 hover:bg-red-500 text-surface-300 hover:text-white flex items-center justify-center transition-colors"
                title="Remove from slot"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <div
              key={`empty-${i}`}
              className={`flex-1 rounded-lg border border-dashed ${cfg.emptyBorder} flex items-center justify-center min-h-[72px]`}
            >
              <span className="text-surface-700 text-[10px]">—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
