'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Session } from '@/features/vgc-tracker/types';

interface Props {
  source: Session;
  onConfirm: (session: Omit<Session, 'id' | 'startedAt'>) => void;
  onClose: () => void;
}

export function DuplicateSessionDialog({ source, onConfirm, onClose }: Props) {
  const t = useTranslations('vgc.tracker');
  const [label, setLabel] = useState(`${source.label} (2)`);
  const [startElo, setStartElo] = useState(
    source.startElo !== undefined ? String(source.startElo) : '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    const parsed = parseFloat(startElo);
    onConfirm({
      type: source.type,
      label: label.trim(),
      format: source.format,
      regulationId: source.regulationId,
      activePresetId: source.activePresetId,
      tournamentName: source.tournamentName,
      startElo: source.type === 'ladder' && !isNaN(parsed) ? parsed : undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="font-semibold text-surface-50">{t('duplicate.title')}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
              {t('duplicate.newLabel')}
            </label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('placeholders.sessionLabel')}
              className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
            />
          </div>

          {source.type === 'ladder' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                {t('labels.startingElo')}
              </label>
              <input
                type="number"
                value={startElo}
                onChange={(e) => setStartElo(e.target.value)}
                placeholder={t('placeholders.startingElo')}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
          )}

          {/* Inherited settings — read only summary */}
          <div className="rounded-lg bg-surface-800 border border-surface-700 px-3 py-2 flex flex-col gap-1">
            <span className="text-[10px] text-surface-500 uppercase tracking-wide font-medium">Inherits</span>
            <div className="flex flex-wrap gap-2 text-xs text-surface-400">
              <span className="font-mono bg-surface-700 rounded px-1.5 py-px">{source.format}</span>
              <span>{source.regulationId}</span>
              {source.tournamentName && <span className="text-amber-400">{source.tournamentName}</span>}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-surface-600 text-surface-300 hover:text-surface-50 text-sm transition-colors"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={!label.trim()}
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {t('buttons.duplicate')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
