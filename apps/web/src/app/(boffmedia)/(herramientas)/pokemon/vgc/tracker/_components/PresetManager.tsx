'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Upload } from 'lucide-react';
import { parseShowdownPaste, isValidPaste } from '@/features/vgc-tracker/showdown-parse';
import { spriteUrl } from '@/features/vgc-tracker/types';
import type { TeamPreset } from '@/features/vgc-tracker/types';

interface Props {
  presets: TeamPreset[];
  onSave: (preset: TeamPreset) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function PresetManager({ presets, onSave, onDelete, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [paste, setPaste] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    if (!name.trim()) { setError('Give this preset a name.'); return; }
    const slots = parseShowdownPaste(paste);
    if (!slots.length) { setError('Could not parse the paste. Check the format.'); return; }
    const preset: TeamPreset = {
      id: crypto.randomUUID(),
      name: name.trim(),
      regulationId: 'vgc2026regma',
      exportString: paste.trim(),
      slots,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSave(preset);
    setName('');
    setPaste('');
    setError('');
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-surface-700 shrink-0">
          <h2 className="font-semibold text-surface-50">Team Presets</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {presets.length === 0 && !showForm && (
            <p className="text-surface-500 text-sm text-center py-6">
              No presets yet. Import a Showdown paste to get started.
            </p>
          )}

          {presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-surface-800 border border-surface-700 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="flex -space-x-3 shrink-0">
                {preset.slots.slice(0, 3).map((s) => (
                  <img
                    key={s.slotIndex}
                    src={spriteUrl(s.speciesName)}
                    alt={s.speciesName}
                    className="w-9 h-9 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-surface-50 text-sm font-medium truncate">{preset.name}</p>
                <p className="text-surface-500 text-xs truncate">
                  {preset.slots.map((s) => s.speciesName).join(', ')}
                </p>
              </div>
              <button
                onClick={() => onDelete(preset.id)}
                className="text-surface-500 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {showForm && (
            <div className="bg-surface-800 border border-surface-700 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">Preset name</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Reg H — April 2025"
                  className="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                  Showdown paste
                </label>
                <textarea
                  value={paste}
                  onChange={(e) => { setPaste(e.target.value); setError(''); }}
                  placeholder={"Incineroar @ Assault Vest\nAbility: Intimidate\n- Fake Out\n- Knock Off\n..."}
                  rows={6}
                  className="bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm font-mono resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 py-2 rounded-lg border border-surface-600 text-surface-300 hover:text-surface-50 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!paste.trim() || !isValidPaste(paste)}
                  className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} /> Import
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-700 shrink-0">
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 rounded-lg border border-surface-600 text-surface-300 hover:text-surface-50 hover:border-surface-500 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Import new preset
          </button>
        </div>
      </div>
    </div>
  );
}
