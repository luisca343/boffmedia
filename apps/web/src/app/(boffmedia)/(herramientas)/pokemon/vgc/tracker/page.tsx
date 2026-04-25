'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Archive, Copy, Database, Layers, Plus, Swords, TrendingUp, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSessions, usePresets } from '@/features/vgc-tracker/hooks/useVgcDb';
import { NewSessionDialog } from './_components/NewSessionDialog';
import { PresetManager } from './_components/PresetManager';
import { DuplicateSessionDialog } from './_components/DuplicateSessionDialog';
import { ExportImportDialog } from './_components/ExportImportDialog';
import type { Session } from '@/features/vgc-tracker/types';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrackerPage() {
  const t = useTranslations('vgc.tracker');
  const {
    sessions,
    archivedSessions,
    loading,
    create: createSession,
    remove: removeSession,
    archive: archiveSession,
    unarchive: unarchiveSession,
    refresh: refreshSessions,
  } = useSessions();
  const { presets, save: savePreset, remove: removePreset } = usePresets();

  const [showNewSession, setShowNewSession] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [duplicating, setDuplicating] = useState<Session | null>(null);
  const [showExportImport, setShowExportImport] = useState(false);

  const handleCreateSession = async (data: Omit<Session, 'id' | 'startedAt'>) => {
    await createSession({ id: crypto.randomUUID(), startedAt: Date.now(), ...data });
    setShowNewSession(false);
  };

  const handleDuplicate = async (data: Omit<Session, 'id' | 'startedAt'>) => {
    await createSession({ id: crypto.randomUUID(), startedAt: Date.now(), ...data });
    setDuplicating(null);
  };

  const activeSessions = sessions;
  const showingArchived = showArchived && archivedSessions.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
              <Swords className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-50">{t('title')}</h1>
              <p className="text-surface-400 text-sm">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowExportImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-700 text-surface-400 hover:text-surface-50 hover:border-surface-600 text-sm transition-colors"
              title={t('exportImport.title')}
            >
              <Database size={14} />
            </button>
            <button
              onClick={() => setShowPresets(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-700 text-surface-300 hover:text-surface-50 hover:border-surface-600 text-sm transition-colors"
            >
              <Layers size={14} /> {t('buttons.presets', { count: presets.length })}
            </button>
            <button
              onClick={() => setShowNewSession(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} /> {t('buttons.newSession')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Active sessions */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeSessions.length === 0 && !showingArchived ? (
        <div className="rounded-xl border border-surface-800 bg-surface-950 p-12 text-center">
          <Swords size={36} className="mx-auto text-surface-700 mb-3" />
          <p className="text-surface-400 text-sm font-medium mb-1">{t('empty.noSessions')}</p>
          <p className="text-surface-600 text-xs">{t('empty.noSessionsHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              presetName={presets.find((p) => p.id === s.activePresetId)?.name}
              onDelete={() => removeSession(s.id)}
              onArchive={() => archiveSession(s.id)}
              onDuplicate={() => setDuplicating(s)}
            />
          ))}
        </div>
      )}

      {/* Archive toggle */}
      {archivedSessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            <Archive size={12} />
            {showArchived
              ? t('archive.hideArchived')
              : t('archive.showArchived', { count: archivedSessions.length })}
          </button>
          {showArchived && (
            <div className="flex flex-col gap-2">
              {archivedSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  presetName={presets.find((p) => p.id === s.activePresetId)?.name}
                  archived
                  onDelete={() => removeSession(s.id)}
                  onUnarchive={() => unarchiveSession(s.id)}
                  onDuplicate={() => setDuplicating(s)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {showNewSession && (
        <NewSessionDialog presets={presets} onConfirm={handleCreateSession} onClose={() => setShowNewSession(false)} />
      )}
      {showPresets && (
        <PresetManager presets={presets} onSave={savePreset} onDelete={removePreset} onClose={() => setShowPresets(false)} />
      )}
      {duplicating && (
        <DuplicateSessionDialog source={duplicating} onConfirm={handleDuplicate} onClose={() => setDuplicating(null)} />
      )}
      {showExportImport && (
        <ExportImportDialog onImportDone={refreshSessions} onClose={() => setShowExportImport(false)} />
      )}
    </div>
  );
}

function SessionCard({
  session,
  presetName,
  archived = false,
  onDelete,
  onArchive,
  onUnarchive,
  onDuplicate,
}: {
  session: Session;
  presetName?: string;
  archived?: boolean;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations('vgc.tracker');
  const isTournament = session.type === 'tournament';

  return (
    <Link
      href={`/pokemon/vgc/tracker/${session.id}`}
      className={`group flex items-start justify-between gap-3 rounded-xl border bg-surface-950 px-4 py-3 transition-all ${
        archived
          ? 'border-surface-800 opacity-60 hover:opacity-80'
          : isTournament
          ? 'border-amber-500/30 hover:border-amber-400/50'
          : 'border-surface-800 hover:border-primary-500/40'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
          isTournament ? 'bg-amber-500/15 text-amber-400' : 'bg-surface-800 text-surface-500'
        }`}>
          {isTournament ? <Trophy size={14} /> : <TrendingUp size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-surface-50 font-medium truncate">{session.label}</span>
            <span className="shrink-0 text-[11px] font-mono bg-surface-800 border border-surface-700 rounded px-1.5 py-px text-surface-400">
              {session.format}
            </span>
            {isTournament && (
              <span className="shrink-0 text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded px-1.5 py-px">
                {t('sessionType.tournament')}
              </span>
            )}
            {archived && (
              <span className="shrink-0 text-[11px] bg-surface-800 border border-surface-700 text-surface-500 rounded px-1.5 py-px">
                {t('archive.badge')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
            <span>{formatDate(session.startedAt)}</span>
            {isTournament && session.tournamentName && (
              <span className="flex items-center gap-1 text-amber-500/70">
                <Trophy size={10} />{session.tournamentName}
              </span>
            )}
            {!isTournament && presetName && (
              <span className="flex items-center gap-1"><Layers size={11} />{presetName}</span>
            )}
            {!isTournament && session.startElo && (
              <span className="flex items-center gap-1"><TrendingUp size={11} />ELO {session.startElo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); onDuplicate(); }}
          className="p-1.5 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          title={t('buttons.duplicate')}
        >
          <Copy size={13} />
        </button>
        {archived ? (
          <button
            onClick={(e) => { e.preventDefault(); onUnarchive?.(); }}
            className="px-2 py-1 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-800 text-xs transition-colors"
          >
            {t('buttons.unarchive')}
          </button>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); onArchive?.(); }}
            className="p-1.5 rounded text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            title={t('buttons.archive')}
          >
            <Archive size={13} />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="px-2 py-1 rounded text-surface-600 hover:text-red-400 hover:bg-surface-800 text-xs transition-colors"
        >
          {t('buttons.delete')}
        </button>
      </div>
    </Link>
  );
}
