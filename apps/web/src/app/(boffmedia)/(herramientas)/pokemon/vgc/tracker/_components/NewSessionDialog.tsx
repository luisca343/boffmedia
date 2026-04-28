'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, TrendingUp, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VgcService, ChampionsRegulation, LimitlessTournament } from '@/services/api/boffmedia/vgcService';
import type { MatchFormat, Session, SessionType, TeamPreset } from '@/features/vgc-tracker/types';

interface Props {
  presets: TeamPreset[];
  onConfirm: (session: Omit<Session, 'id' | 'startedAt'>) => void;
  onClose: () => void;
}

export function NewSessionDialog({ presets, onConfirm, onClose }: Props) {
  const t = useTranslations('vgc.tracker');
  const [sessionType, setSessionType] = useState<SessionType>('ladder');
  const [label, setLabel] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [format, setFormat] = useState<MatchFormat>('BO1');
  const [regulationId, setRegulationId] = useState('');
  const [activePresetId, setActivePresetId] = useState(presets[0]?.id ?? '');
  const [startElo, setStartElo] = useState('');
  const [regulations, setRegulations] = useState<ChampionsRegulation[]>([]);
  const [limitlessTournaments, setLimitlessTournaments] = useState<LimitlessTournament[]>([]);
  const [limitlessTournamentId, setLimitlessTournamentId] = useState<number | undefined>(undefined);

  // Tournament mode defaults to BO3
  useEffect(() => {
    if (sessionType === 'tournament') setFormat('BO3');
    else setFormat('BO1');
  }, [sessionType]);

  useEffect(() => {
    VgcService.getChampionsRegulations().then((res) => {
      if (res.success && res.data) {
        setRegulations(res.data);
        setRegulationId(res.data[0]?.id ?? '');
      }
    });
  }, []);

  // Fetch completed Limitless tournaments for the selected regulation (tournament mode only)
  useEffect(() => {
    if (sessionType !== 'tournament' || !regulationId) return;
    setLimitlessTournaments([]);
    setLimitlessTournamentId(undefined);
    VgcService.getLimitlessTournaments(regulationId).then((res) => {
      if (res.success && res.data) {
        const done = res.data.filter((t) => t.status === 'done');
        setLimitlessTournaments(done);
      }
    });
  }, [sessionType, regulationId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !regulationId) return;
    const parsed = parseFloat(startElo);
    onConfirm({
      type: sessionType,
      label: label.trim(),
      format,
      regulationId,
      activePresetId,
      startElo: sessionType === 'ladder' && !isNaN(parsed) ? parsed : undefined,
      tournamentName: sessionType === 'tournament' ? (tournamentName.trim() || undefined) : undefined,
      limitlessTournamentId: sessionType === 'tournament' ? limitlessTournamentId : undefined,
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
          {/* Type toggle */}
          <div className="flex rounded-lg border border-surface-700 bg-surface-950 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setSessionType('ladder')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sessionType === 'ladder'
                  ? 'bg-surface-800 text-surface-50'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              <TrendingUp size={13} /> {t('sessionType.ladder')}
            </button>
            <button
              type="button"
              onClick={() => setSessionType('tournament')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sessionType === 'tournament'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              <Trophy size={13} /> {t('sessionType.tournament')}
            </button>
          </div>

          {/* Tournament name (tournament only) */}
          {sessionType === 'tournament' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                {t('labels.tournamentName')}
              </label>
              <input
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder={t('placeholders.tournamentName')}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          )}

          {/* Limitless tournament link (tournament only, optional) */}
          {sessionType === 'tournament' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                {t('labels.limitlessTournament')}
                <span className="ml-1 text-surface-600 normal-case font-normal">({t('labels.optional')})</span>
              </label>
              <select
                value={limitlessTournamentId ?? ''}
                onChange={(e) => setLimitlessTournamentId(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 focus:outline-none focus:border-amber-500 text-sm"
              >
                <option value="">{t('labels.noTournamentLink')}</option>
                {limitlessTournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name ?? t.limitlessId}{t.date ? ` · ${t.date}` : ''}
                  </option>
                ))}
              </select>
              {limitlessTournaments.length === 0 && regulationId && (
                <p className="text-[11px] text-surface-600">{t('labels.noImportedTournaments')}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
              {t('labels.sessionLabel')}
            </label>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('placeholders.sessionLabel')}
              className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 text-sm"
            />
          </div>

          <div className={`grid gap-3 ${sessionType === 'ladder' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                {t('labels.format')}
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as MatchFormat)}
                className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-surface-50 focus:outline-none focus:border-primary-500 text-sm"
              >
                <option value="BO1">BO1</option>
                <option value="BO3">BO3</option>
              </select>
            </div>

            {sessionType === 'ladder' && (
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
              {t('labels.regulation')}
            </label>
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
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                {t('labels.teamPreset')}
              </label>
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
              className={`flex-1 py-2 rounded-lg disabled:opacity-40 text-white text-sm font-medium transition-colors ${
                sessionType === 'tournament'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-primary-600 hover:bg-primary-500'
              }`}
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
