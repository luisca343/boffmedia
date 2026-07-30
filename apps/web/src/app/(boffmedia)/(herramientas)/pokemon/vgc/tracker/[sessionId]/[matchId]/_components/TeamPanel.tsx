'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Icon } from "@boffmedia/ui"
import { spriteUrl, handleSpriteError, SpeciesEntry, isLead, isBack } from '@/features/vgc-tracker/types';
import type { MatchSlot, SlotRole } from '@/features/vgc-tracker/types';
import { cssVars } from '@/components/boffmedia/ui/tools/datakit';
import { PokemonAutocomplete, PokemonAutocompleteHandle } from './PokemonAutocomplete';

interface Props {
  label: string;
  slots: MatchSlot[];
  editable?: boolean;
  /** Accent color (CSS value) for the panel top-border + labels. */
  tone?: string;
  search?: (query: string) => SpeciesEntry[];
  onSlotChange: (updated: MatchSlot[]) => void;
}

const ROLE_ORDER: Exclude<SlotRole, 'unknown'>[] = ['lead1', 'lead2', 'back1', 'back2'];

export function TeamPanel({ label, slots, editable = false, tone = 'var(--accent-bright)', search, onSlotChange }: Props) {
  const t = useTranslations('vgc.tracker');
  const leads = slots.filter((s) => isLead(s.role));
  const backs = slots.filter((s) => isBack(s.role));
  const autocompleteRefs = useRef<(PokemonAutocompleteHandle | null)[]>(Array(6).fill(null));

  const assign = (slotIndex: number) => {
    const slot = slots.find((s) => s.slotIndex === slotIndex);
    if (!slot?.speciesId || slot.role !== 'unknown') return;
    const usedRoles = new Set(slots.filter((s) => s.role !== 'unknown').map((s) => s.role));
    const nextRole = ROLE_ORDER.find((r) => !usedRoles.has(r)) ?? null;
    if (!nextRole) return;
    onSlotChange(slots.map((s) => (s.slotIndex === slotIndex ? { ...s, role: nextRole } : s)));
  };

  const unassign = (slotIndex: number) => {
    const removed = slots.find((s) => s.slotIndex === slotIndex);
    if (!removed || removed.role === 'unknown') return;
    const pos = ROLE_ORDER.indexOf(removed.role as Exclude<SlotRole, 'unknown'>);
    const updates = new Map<number, SlotRole>();
    updates.set(slotIndex, 'unknown');
    for (let i = pos + 1; i < ROLE_ORDER.length; i++) {
      const shiftedSlot = slots.find((s) => s.role === ROLE_ORDER[i]);
      if (shiftedSlot) updates.set(shiftedSlot.slotIndex, ROLE_ORDER[i - 1]);
    }
    onSlotChange(slots.map((s) => (updates.has(s.slotIndex) ? { ...s, role: updates.get(s.slotIndex)! } : s)));
  };

  const fillSpecies = (slotIndex: number, entry: SpeciesEntry) => {
    onSlotChange(slots.map((s) => (s.slotIndex === slotIndex ? { ...s, speciesId: entry.id, speciesName: entry.name } : s)));
    if (editable) {
      const next = slots.filter((s) => !s.speciesId && s.slotIndex !== slotIndex).sort((a, b) => a.slotIndex - b.slotIndex)[0];
      if (next !== undefined) setTimeout(() => autocompleteRefs.current[next.slotIndex]?.focusInput(), 0);
    }
  };

  const clearSpecies = (slotIndex: number) => {
    onSlotChange(
      slots.map((s) => (s.slotIndex === slotIndex ? { ...s, speciesId: null, speciesName: null, role: 'unknown' as const } : s)),
    );
  };

  const allAssigned = leads.length >= 2 && backs.length >= 2;
  const filledRoles = new Set(slots.filter((s) => s.role !== 'unknown').map((s) => s.role));

  return (
    <div
      style={cssVars({ '--trc': tone, borderTopColor: tone })}
      className="grid min-w-0 gap-[11px] border border-solid border-line border-t-[3px] bg-panel px-4 py-[14px]"
    >
      <span className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.14em]" style={{ color: tone }}>
        {label}
      </span>

      {/* Team pool (3 × 2 grid) */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <PoolCard
            key={slot.slotIndex}
            slot={slot}
            editable={editable}
            search={search}
            canAssign={!allAssigned && slot.role === 'unknown' && !!slot.speciesId && ROLE_ORDER.some((r) => !filledRoles.has(r))}
            onAssign={() => assign(slot.slotIndex)}
            onFill={(entry) => fillSpecies(slot.slotIndex, entry)}
            onClear={() => clearSpecies(slot.slotIndex)}
            autocompleteRef={(el) => {
              autocompleteRefs.current[slot.slotIndex] = el;
            }}
            onTabNext={
              editable
                ? () => {
                    const next = slots
                      .filter((s) => !s.speciesId && s.slotIndex > slot.slotIndex)
                      .sort((a, b) => a.slotIndex - b.slotIndex)[0];
                    if (next !== undefined) autocompleteRefs.current[next.slotIndex]?.focusInput();
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Assignment zones */}
      <div className="grid grid-cols-2 gap-2">
        <AssignmentZone
          role="lead"
          label={t('zones.leads')}
          filled={[slots.find((s) => s.role === 'lead1') ?? null, slots.find((s) => s.role === 'lead2') ?? null]}
          onRemove={unassign}
        />
        <AssignmentZone
          role="back"
          label={t('zones.backs')}
          filled={[slots.find((s) => s.role === 'back1') ?? null, slots.find((s) => s.role === 'back2') ?? null]}
          onRemove={unassign}
        />
      </div>
    </div>
  );
}

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
  const t = useTranslations('vgc.tracker');

  if (!slot.speciesId) {
    if (editable && search) {
      return (
        <div className="flex h-[76px] items-center justify-center overflow-visible border border-dashed border-line-2 p-2">
          <PokemonAutocomplete ref={autocompleteRef} search={search} onSelect={onFill} placeholder={t('placeholders.typeName')} onTabNext={onTabNext} />
        </div>
      );
    }
    return (
      <div className="flex h-[76px] items-center justify-center border border-dashed border-line-2">
        <span className="select-none text-xl text-txt-dim">?</span>
      </div>
    );
  }

  const isAssigned = slot.role !== 'unknown';

  return (
    <div className="relative h-[76px]">
      <button
        type="button"
        onClick={isAssigned ? undefined : canAssign ? onAssign : undefined}
        disabled={isAssigned || !canAssign}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-[2px] border border-solid border-line bg-base transition-all',
          isAssigned
            ? 'cursor-default opacity-35'
            : canAssign
              ? 'cursor-pointer hover:border-accent hover:opacity-90'
              : 'cursor-not-allowed opacity-50',
        )}
        title={isAssigned ? t('tooltips.assignedSlot', { role: slot.role }) : canAssign ? t('tooltips.assignSlot') : t('tooltips.slotsFull')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={spriteUrl(slot.speciesName!)} alt={slot.speciesName ?? ''} className="pointer-events-none h-10 w-10 object-contain" onError={handleSpriteError} />
        <span className="max-w-full truncate px-1 font-body text-[11px] leading-none text-txt">{slot.speciesName}</span>
      </button>

      {isAssigned && (
        <span
          className="pointer-events-none absolute right-1 top-1 border border-solid px-1 py-px font-mono text-[9px] font-bold leading-none"
          style={
            isLead(slot.role)
              ? { color: 'var(--accent-bright)', background: 'var(--accent-soft)', borderColor: 'var(--accent-line)' }
              : { color: 'var(--info)', background: 'var(--info-soft)', borderColor: 'color-mix(in srgb, var(--info) 40%, transparent)' }
          }
        >
          {isLead(slot.role) ? 'L' : 'B'}
        </span>
      )}

      {editable && !isAssigned && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center border border-solid border-line-2 bg-panel-2 text-[10px] font-bold leading-none text-txt transition-colors hover:border-bad hover:bg-bad hover:text-white"
          title={t('tooltips.removeFromTeam')}
        >
          ×
        </button>
      )}
    </div>
  );
}

function AssignmentZone({
  role,
  label,
  filled,
  onRemove,
}: {
  role: 'lead' | 'back';
  label: string;
  filled: [MatchSlot | null, MatchSlot | null];
  onRemove: (slotIndex: number) => void;
}) {
  const t = useTranslations('vgc.tracker');
  const tone = role === 'lead' ? 'var(--accent-bright)' : 'var(--info)';
  const count = filled.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-[2px]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: tone }}>
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: count >= 2 ? tone : 'var(--dim)' }}>
          {count}/2
        </span>
      </div>
      <div className="flex gap-2">
        {[0, 1].map((i) => {
          const slot = filled[i] ?? null;
          return slot ? (
            <div
              key={slot.slotIndex}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[2px] border border-solid bg-base py-1"
              style={{ borderColor: tone }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteUrl(slot.speciesName!)} alt={slot.speciesName ?? ''} className="h-8 w-8 object-contain" onError={handleSpriteError} />
              <span className="max-w-full truncate px-1 font-body text-[9px] leading-none text-txt-muted">{slot.speciesName}</span>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onRemove(slot.slotIndex)}
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center border border-solid border-line-2 bg-panel-2 text-txt transition-colors hover:border-bad hover:bg-bad hover:text-white"
                title={t('tooltips.removeFromSlot')}
              >
                <Icon name="x" size={11} />
              </button>
            </div>
          ) : (
            <div key={`empty-${i}`} className="flex min-h-[56px] flex-1 items-center justify-center border border-dashed border-line-2">
              <span className="text-[10px] text-txt-dim">—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
