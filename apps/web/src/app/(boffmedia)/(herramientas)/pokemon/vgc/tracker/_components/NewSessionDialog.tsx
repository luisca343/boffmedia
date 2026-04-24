'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VgcService, ChampionsRegulation } from '@/services/api/boffmedia/vgcService';
import type { MatchFormat, Session, TeamPreset } from '@/features/vgc-tracker/types';

interface Props {
  presets: TeamPreset[];
  onConfirm: (session: Omit<Session, 'id' | 'startedAt'>) => void;
  onClose: () => void;
}

export function NewSessionDialog({ presets, onConfirm, onClose }: Props) {
  const t = useTranslations('vgc.tracker');
  const [label, setLabel] = useState('');
  const [format, setFormat] = useState<MatchFormat>('BO1');
  const [regulationId, setRegulationId] = useState('');
  const [activePresetId, setActivePresetId] = useState(presets[0]?.id ?? '');
  const [startElo, setStartElo] = useState('');
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data);
        setRegulationId(res.data[0]?.id ?? '');
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !regulationId) return;
    onConfirm({
      label: label.trim(),
      format,
      regulationId,
      activePresetId,
      startElo: startElo ? parseInt(startElo, 10) : undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="font-semibold text-surface-50">{t('modals.newSession')}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">Session label</label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ranked grind Apr 24"
              className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">{t('labels.format')}</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as MatchFormat)}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 focus:outline-none focus:border-primary-500 text-sm"
              >
                <option value="BO1">BO1</option>
                <option value="BO3">BO3</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">{t('labels.startingElo')}</label>
              <input
                type="number"
                value={startElo}
                onChange={(e) => setStartElo(e.target.value)}
                placeholder={t('placeholders.startingElo')}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">{t('labels.regulation')}</label>
            <select
              value={regulationId}
              onChange={(e) => setRegulationId(e.target.value)}
              className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 focus:outline-none focus:border-primary-500 text-sm"
            >
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {presets.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">{t('labels.teamPreset')}</label>
              <select
                value={activePresetId}
                onChange={(e) => setActivePresetId(e.target.value)}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 focus:outline-none focus:border-primary-500 text-sm"
              >
                <option value="">{t('labels.noPreset')}</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

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
              disabled={!label.trim() || !regulationId}
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {t('buttons.startSession')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
