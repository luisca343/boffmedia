'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Layers, Swords, TrendingUp } from 'lucide-react';
import { useSessions, usePresets } from '@/features/vgc-tracker/hooks/useVgcDb';
import { NewSessionDialog } from './_components/NewSessionDialog';
import { PresetManager } from './_components/PresetManager';
import type { Session } from '@/features/vgc-tracker/types';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrackerPage() {
  const { sessions, loading, create: createSession, remove: removeSession } = useSessions();
  const { presets, save: savePreset, remove: removePreset } = usePresets();
  const [showNewSession, setShowNewSession] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleCreateSession = async (data: Omit<Session, 'id' | 'startedAt'>) => {
    await createSession({ id: crypto.randomUUID(), startedAt: Date.now(), ...data });
    setShowNewSession(false);
  };

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
              <h1 className="text-2xl font-bold text-surface-50">VGC Tracker</h1>
              <p className="text-surface-400 text-sm">Log your ranked matches</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPresets(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-700 text-surface-300 hover:text-surface-50 hover:border-surface-600 text-sm transition-colors"
            >
              <Layers size={14} /> Presets ({presets.length})
            </button>
            <button
              onClick={() => setShowNewSession(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} /> New session
            </button>
          </div>
        </div>
      </motion.div>

      {/* Sessions */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-surface-800 bg-surface-950 p-12 text-center">
          <Swords size={36} className="mx-auto text-surface-700 mb-3" />
          <p className="text-surface-400 text-sm font-medium mb-1">No sessions yet</p>
          <p className="text-surface-600 text-xs">Import a team preset, then start a session.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              presetName={presets.find((p) => p.id === s.activePresetId)?.name}
              onDelete={() => removeSession(s.id)}
            />
          ))}
        </div>
      )}

      {showNewSession && (
        <NewSessionDialog presets={presets} onConfirm={handleCreateSession} onClose={() => setShowNewSession(false)} />
      )}
      {showPresets && (
        <PresetManager presets={presets} onSave={savePreset} onDelete={removePreset} onClose={() => setShowPresets(false)} />
      )}
    </div>
  );
}

function SessionCard({
  session,
  presetName,
  onDelete,
}: {
  session: Session;
  presetName?: string;
  onDelete: () => void;
}) {
  return (
    <Link
      href={`/pokemon/vgc/tracker/${session.id}`}
      className="group flex items-start justify-between gap-3 rounded-xl border border-surface-800 bg-surface-950 hover:border-primary-500/40 px-4 py-3 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-surface-50 font-medium truncate">{session.label}</span>
          <span className="shrink-0 text-[11px] font-mono bg-surface-800 border border-surface-700 rounded px-1.5 py-px text-surface-400">
            {session.format}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500">
          <span>{formatDate(session.startedAt)}</span>
          {presetName && (
            <span className="flex items-center gap-1"><Layers size={11} />{presetName}</span>
          )}
          {session.startElo && (
            <span className="flex items-center gap-1"><TrendingUp size={11} />ELO {session.startElo}</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); onDelete(); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 text-xs px-2 py-1 rounded transition-all"
      >
        Delete
      </button>
    </Link>
  );
}
