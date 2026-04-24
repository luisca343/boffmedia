'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';
import { spriteUrl, handleSpriteError, SpeciesEntry, isLead, isBack } from '@/features/vgc-tracker/types';
import type { MatchSlot, SlotRole } from '@/features/vgc-tracker/types';
import { PokemonAutocomplete, PokemonAutocompleteHandle } from './PokemonAutocomplete';

interface Props {
  label: string;
  slots: MatchSlot[];
  editable?: boolean;
  search?: (query: string) => SpeciesEntry[];
  onSlotChange: (updated: MatchSlot[]) => void;
}

// Ordered role sequence for the 4 assignment slots
const ROLE_ORDER: Exclude<SlotRole, 'unknown'>[] = ['lead1', 'lead2', 'back1', 'back2'];

export function TeamPanel({ label, slots, editable = false, search, onSlotChange }: Props) {
  const leads = slots.filter((s) => isLead(s.role));
  const backs = slots.filter((s) => isBack(s.role));

  // Click on an unassigned pool pokemon → fills the next available ordered position.
  const assign = (slotIndex: number) => {
    const slot = slots.find((s) => s.slotIndex === slotIndex);
    if (!slot?.speciesId || slot.role !== 'unknown') return;

    const usedRoles = new Set(slots.filter(s => s.role !== 'unknown').map(s => s.role));
    const nextRole = ROLE_ORDER.find(r => !usedRoles.has(r)) ?? null;
    if (!nextRole) return;

    onSlotChange(slots.map((s) => (s.slotIndex === slotIndex ? { ...s, role: nextRole } : s)));
  };

  // Click × on an assignment slot → shift-down: positions after the removed one move up by 1.
  // e.g. remove lead1 → lead2 becomes lead1, back1 becomes lead2, back2 becomes back1
  const unassign = (slotIndex: number) => {
    const removed = slots.find((s) => s.slotIndex === slotIndex);
    if (!removed || removed.role === 'unknown') return;

    const pos = ROLE_ORDER.indexOf(removed.role as Exclude<SlotRole, 'unknown'>);

    // Build map: slotIndex → new role after shift
    const updates = new Map<number, SlotRole>();
    updates.set(slotIndex, 'unknown');

    // Slots at positions after `pos` shift down by 1
    for (let i = pos + 1; i < ROLE_ORDER.length; i++) {
      const shiftedSlot = slots.find(s => s.role === ROLE_ORDER[i]);
      if (shiftedSlot) updates.set(shiftedSlot.slotIndex, ROLE_ORDER[i - 1]);
    }

    onSlotChange(slots.map((s) => updates.has(s.slotIndex) ? { ...s, role: updates.get(s.slotIndex)! } : s));
  };

  const fillSpecies = (slotIndex: number, entry: SpeciesEntry) => {
    onSlotChange(
      slots.map((s) =>
        s.slotIndex === slotIndex ? { ...s, speciesId: entry.id, speciesName: entry.name } : s,
      ),
    );
    // Auto-advance: focus the first remaining empty slot after filling
    if (editable) {
      const next = slots
        .filter((s) => !s.speciesId && s.slotIndex !== slotIndex)
        .sort((a, b) => a.slotIndex - b.slotIndex)[0];
      if (next !== undefined) {
        setTimeout(() => autocompleteRefs.current[next.slotIndex]?.focusInput(), 0);
      }
    }
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
  const filledRoles = new Set(slots.filter(s => s.role !== 'unknown').map(s => s.role));
  const autocompleteRefs = useRef<(PokemonAutocompleteHandle | null)[]>(Array(6).fill(null));

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
            canAssign={!allAssigned && slot.role === 'unknown' && !!slot.speciesId && ROLE_ORDER.some(r => !filledRoles.has(r))}
            onAssign={() => assign(slot.slotIndex)}
            onFill={(entry) => fillSpecies(slot.slotIndex, entry)}
            onClear={() => clearSpecies(slot.slotIndex)}
            autocompleteRef={(el) => { autocompleteRefs.current[slot.slotIndex] = el; }}
            onTabNext={editable ? () => {
              const next = slots
                .filter((s) => !s.speciesId && s.slotIndex > slot.slotIndex)
                .sort((a, b) => a.slotIndex - b.slotIndex)[0];
              if (next !== undefined) autocompleteRefs.current[next.slotIndex]?.focusInput();
            } : undefined}
          />
        ))}
      </div>

      {/* ── Assignment zones ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <AssignmentZone
          role="lead"
          filled={[
            slots.find(s => s.role === 'lead1') ?? null,
            slots.find(s => s.role === 'lead2') ?? null,
          ]}
          onRemove={unassign}
        />
        <AssignmentZone
          role="back"
          filled={[
            slots.find(s => s.role === 'back1') ?? null,
            slots.find(s => s.role === 'back2') ?? null,
          ]}
          onRemove={unassign}
        />
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
  autocompleteRef,
  onTabNext,
}: {
  slot: MatchSlot;
  editable: boolean;
  search?: (q: string) => SpeciesEntry[];
  canAssign: boolean;
  onAssign: () => void;
  onFill: (entry: SpeciesEntry) => void;
  onClear: () => void;
  autocompleteRef?: (el: PokemonAutocompleteHandle | null) => void;
  onTabNext?: () => void;
}) {
  // Empty slot
  if (!slot.speciesId) {
    if (editable && search) {
      return (
        <div className="h-[76px] rounded-lg border border-dashed border-surface-600 flex items-center justify-center p-2 overflow-visible">
          <PokemonAutocomplete ref={autocompleteRef} search={search} onSelect={onFill} placeholder="Type name…" onTabNext={onTabNext} />
        </div>
      );
    }
    return (
      <div className="h-[76px] rounded-lg border border-dashed border-surface-700 flex items-center justify-center">
        <span className="text-surface-600 text-xl select-none">?</span>
      </div>
    );
  }

  const isAssigned = slot.role !== 'unknown';

  return (
    <div className="relative h-[76px]">
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
          className="w-10 h-10 object-contain pointer-events-none"
          onError={handleSpriteError}
        />
        <span className="text-xs text-surface-300 truncate max-w-full px-1 leading-none">
          {slot.speciesName}
        </span>
      </button>

      {/* Role badge on assigned cards */}
      {isAssigned && (
        <span
          className={[
            'absolute top-1 right-1 text-[9px] font-bold rounded px-1 py-px pointer-events-none',
            isLead(slot.role)
              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
              : 'bg-blue-400/20 text-blue-300 border border-blue-400/30',
          ].join(' ')}
        >
          {isLead(slot.role) ? 'L' : 'B'}
        </span>
      )}

      {/* Remove-from-team button (editable, unassigned only) */}
      {editable && !isAssigned && (
        <button
          tabIndex={-1}
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
  filled: [MatchSlot | null, MatchSlot | null];
  onRemove: (slotIndex: number) => void;
}) {
  const cfg = ZONE[role];
  const isFull = filled.filter(Boolean).length >= 2;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-0.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
          {cfg.label}
        </span>
        <span className={`text-[10px] font-mono ${isFull ? cfg.counter : 'text-surface-600'}`}>
          {filled.filter(Boolean).length}/2
        </span>
      </div>

      <div className="flex gap-2">
        {[0, 1].map((i) => {
          const slot = filled[i] ?? null;
          return slot ? (
            <div
              key={slot.slotIndex}
              className={`flex-1 relative rounded-lg bg-surface-800 ring-2 ${cfg.ring} flex flex-col items-center justify-center gap-0.5 py-1 min-h-[56px]`}
            >
              <img
                src={spriteUrl(slot.speciesName!)}
                alt={slot.speciesName ?? ''}
                className="w-8 h-8 object-contain"
                onError={handleSpriteError}
              />
              <span className="text-[9px] text-surface-400 truncate max-w-full px-1 leading-none">
                {slot.speciesName}
              </span>
              <button
                tabIndex={-1}
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
              className={`flex-1 rounded-lg border border-dashed ${cfg.emptyBorder} flex items-center justify-center min-h-[56px]`}
            >
              <span className="text-surface-700 text-[10px]">—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
