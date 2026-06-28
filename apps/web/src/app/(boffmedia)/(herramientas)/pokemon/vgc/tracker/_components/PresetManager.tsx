'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Edit2, Plus, RotateCcw, Trash2, X, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseShowdownPaste, isValidPaste } from '@/features/vgc-tracker/showdown-parse';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';
import type { PresetSlot, TeamPreset } from '@/features/vgc-tracker/types';
import { VgcService, ChampionsRegulation, VgcPokemon } from '@/services/api/boffmedia/vgcService';

interface Props {
  presets: TeamPreset[];
  onSave: (preset: TeamPreset) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

type PanelMode = 'list' | 'create' | 'edit' | 'history';

export function PresetManager({ presets, onSave, onDelete, onClose }: Props) {
  const t = useTranslations('vgc.tracker');
  const [mode, setMode] = useState<PanelMode>('list');
  const [editingPreset, setEditingPreset] = useState<TeamPreset | null>(null);
  const [historyPreset, setHistoryPreset] = useState<TeamPreset | null>(null);

  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);
  const [pokemonList, setPokemonList] = useState<VgcPokemon[]>([]);
  const [name, setName] = useState('');
  const [regulationId, setRegulationId] = useState('');
  const [paste, setPaste] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data);
        setRegulationId(res.data[0]?.id ?? '');
      }
    });
  }, []);

  useEffect(() => {
    if (!regulationId) return;
    VgcService.getChampionsLegalPokemon(regulationId).then((res) => {
      if (res.success && res.data) setPokemonList(res.data);
    });
  }, [regulationId]);

  const toId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizeSlots = (rawSlots: PresetSlot[]): PresetSlot[] =>
    rawSlots.map((slot) => {
      const match = pokemonList.find((p) => toId(p.name) === toId(slot.speciesName));
      if (match) return { ...slot, speciesId: toId(match.name), speciesName: match.name };
      return slot;
    });

  const resetForm = () => {
    setName('');
    setPaste('');
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setMode('create');
  };

  const openEdit = (preset: TeamPreset) => {
    setEditingPreset(preset);
    setName(preset.name);
    setPaste(preset.exportString);
    setRegulationId(preset.regulationId);
    setError('');
    setMode('edit');
  };

  const openHistory = (preset: TeamPreset) => {
    setHistoryPreset(preset);
    setMode('history');
  };

  const handleCreate = () => {
    if (!name.trim()) { setError(t('errors.presetNameRequired')); return; }
    const rawSlots = parseShowdownPaste(paste);
    if (!rawSlots.length) { setError(t('errors.invalidPaste')); return; }

    const preset: TeamPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      regulationId,
      exportString: paste.trim(),
      slots: normalizeSlots(rawSlots),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentVersion: 1,
      versions: [],
    };
    onSave(preset);
    resetForm();
    setMode('list');
  };

  const handleEdit = () => {
    if (!editingPreset) return;
    if (!name.trim()) { setError(t('errors.presetNameRequired')); return; }
    const rawSlots = parseShowdownPaste(paste);
    if (!rawSlots.length) { setError(t('errors.invalidPaste')); return; }

    // onSave handles auto-versioning via the hook
    onSave({
      ...editingPreset,
      name: name.trim(),
      exportString: paste.trim(),
      slots: normalizeSlots(rawSlots),
      regulationId,
    });
    resetForm();
    setEditingPreset(null);
    setMode('list');
  };

  const handleRestoreVersion = (preset: TeamPreset, versionIndex: number) => {
    const v = preset.versions[versionIndex];
    // onSave will auto-version the current state before overwriting
    onSave({
      ...preset,
      name: v.name,
      exportString: v.exportString,
      slots: v.slots,
    });
    setMode('list');
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-layer-1 border border-edge rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-edge shrink-0">
          <div className="flex items-center gap-2">
            {mode !== 'list' && (
              <button
                onClick={() => { setMode('list'); resetForm(); }}
                className="text-ink-muted hover:text-ink transition-colors mr-1"
              >
                <X size={16} />
              </button>
            )}
            <h2 className="font-semibold text-ink">
              {mode === 'edit' ? t('preset.editTitle')
                : mode === 'history' ? t('preset.versionHistory')
                : t('modals.teamPresets')}
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          {/* ── List mode ─────────────────────────────────────────────── */}
          {mode === 'list' && (
            <>
              {presets.length === 0 && (
                <p className="text-ink-muted text-sm text-center py-6">{t('empty.noPresets')}</p>
              )}
              {presets.map((preset) => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  onEdit={() => openEdit(preset)}
                  onHistory={() => openHistory(preset)}
                  onDelete={() => onDelete(preset.id)}
                  t={t}
                />
              ))}
            </>
          )}

          {/* ── Create / Edit form ────────────────────────────────────── */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{t('labels.presetName')}</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('placeholders.presetName')}
                  className="bg-layer-2 border border-edge rounded-lg px-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{t('labels.regulation')}</label>
                <select
                  value={regulationId}
                  onChange={(e) => setRegulationId(e.target.value)}
                  className="bg-layer-2 border border-edge rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm"
                >
                  {regulations.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{t('labels.showdownPaste')}</label>
                <textarea
                  value={paste}
                  onChange={(e) => { setPaste(e.target.value); setError(''); }}
                  placeholder={"Incineroar @ Assault Vest\nAbility: Intimidate\n- Fake Out\n- Knock Off\n..."}
                  rows={6}
                  className="bg-layer-2 border border-edge rounded-lg px-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary text-sm font-mono resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('list'); resetForm(); }}
                  className="flex-1 py-2 rounded-lg border border-edge text-ink hover:text-ink text-sm transition-colors"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={mode === 'create' ? handleCreate : handleEdit}
                  disabled={!paste.trim() || !isValidPaste(paste)}
                  className="flex-1 py-2 rounded-lg bg-primary-active hover:bg-primary disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  {mode === 'create'
                    ? <><Upload size={14} /> {t('buttons.import')}</>
                    : <>{t('buttons.save')}</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Version history ───────────────────────────────────────── */}
          {mode === 'history' && historyPreset && (
            <div className="flex flex-col gap-2">
              {/* Current version */}
              <div className="bg-layer-2 border border-primary/40 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-primary/20 text-primary-hover border border-primary/30 rounded px-1.5 py-px">
                      {t('preset.versionN', { n: historyPreset.currentVersion })}
                    </span>
                    <span className="text-[10px] text-ink-muted">{t('preset.currentTag')}</span>
                  </div>
                  <div className="flex -space-x-2">
                    {historyPreset.slots.slice(0, 3).map((s) => (
                      <img key={s.slotIndex} src={spriteUrl(s.speciesName)} alt={s.speciesName} className="w-7 h-7 object-contain" onError={handleSpriteError} />
                    ))}
                  </div>
                </div>
                <p className="text-ink text-sm font-medium">{historyPreset.name}</p>
                <p className="text-ink-muted text-xs truncate">{historyPreset.slots.map((s) => s.speciesName).join(', ')}</p>
              </div>

              {/* Past versions (newest first) */}
              {[...historyPreset.versions].reverse().map((v, i) => (
                <div key={i} className="bg-layer-2 border border-edge rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-ink-muted border border-edge rounded px-1.5 py-px">
                      {t('preset.versionN', { n: v.version })}
                    </span>
                    <button
                      onClick={() => handleRestoreVersion(historyPreset, historyPreset.versions.length - 1 - i)}
                      className="flex items-center gap-1 text-xs text-ink-muted hover:text-primary-hover transition-colors"
                    >
                      <RotateCcw size={11} /> {t('buttons.restoreVersion')}
                    </button>
                  </div>
                  <p className="text-ink text-sm font-medium">{v.name}</p>
                  <p className="text-ink-muted text-xs truncate">{v.slots.map((s) => s.speciesName).join(', ')}</p>
                </div>
              ))}

              {historyPreset.versions.length === 0 && (
                <p className="text-ink-dim text-xs text-center py-4">No previous versions.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'list' && (
          <div className="p-4 border-t border-edge shrink-0">
            <button
              onClick={openCreate}
              className="w-full py-2 rounded-lg border border-edge text-ink hover:text-ink hover:border-edge text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {t('buttons.importNewPreset')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── Preset row ───────────────────────────────────────────────────────────────

function PresetRow({
  preset,
  onEdit,
  onHistory,
  onDelete,
  t,
}: {
  preset: TeamPreset;
  onEdit: () => void;
  onHistory: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<'vgc.tracker'>>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-layer-2 border border-edge rounded-lg overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <div className="flex -space-x-3 shrink-0">
          {preset.slots.slice(0, 3).map((s) => (
            <img key={s.slotIndex} src={spriteUrl(s.speciesName)} alt={s.speciesName} className="w-9 h-9 object-contain" onError={handleSpriteError} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-ink text-sm font-medium truncate">{preset.name}</p>
            <span className="shrink-0 text-[10px] font-mono text-ink-dim border border-edge rounded px-1 py-px">
              {t('preset.versionN', { n: preset.currentVersion })}
            </span>
          </div>
          <p className="text-ink-muted text-xs truncate">{preset.slots.map((s) => s.speciesName).join(', ')}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-ink-muted hover:text-primary-hover transition-colors" title={t('buttons.editPreset')}>
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-ink-muted hover:text-ink transition-colors"
            title={t('preset.versionHistory')}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onDelete} className="p-1.5 text-ink-muted hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-edge px-3 pb-3 pt-2">
          <button
            onClick={onHistory}
            className="text-xs text-ink-muted hover:text-primary-hover transition-colors flex items-center gap-1"
          >
            <RotateCcw size={11} /> {t('preset.versionHistory')} ({preset.versions.length})
          </button>
        </div>
      )}
    </div>
  );
}
