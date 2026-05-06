'use client';

import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useTrackerSync } from '@/features/vgc-tracker/context/TrackerSyncContext';

export function SyncStatusBadge() {
  const { syncStatus, conflictMessage, refreshNow } = useTrackerSync();

  if (syncStatus === 'offline') return null;

  if (syncStatus === 'conflict') {
    return (
      <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400 shadow-sm">
        <p className="font-semibold">Sync conflict</p>
        <p className="mt-1">{conflictMessage ?? 'Another tab/device has newer tracker data.'}</p>
        <button
          type="button"
          onClick={() => { void refreshNow(); }}
          className="mt-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 transition-colors"
        >
          Refresh from cloud
        </button>
      </div>
    );
  }

  const badgeCls =
    syncStatus === 'idle'    ? 'bg-green-500/15 text-green-400' :
    syncStatus === 'syncing' ? 'bg-amber-500/15 text-amber-400' :
                               'bg-red-500/15 text-red-400';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium select-none ${badgeCls}`}
      title={syncStatus === 'idle' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Sync error'}
    >
      {syncStatus === 'idle' && <Cloud className="h-3.5 w-3.5" />}
      {syncStatus === 'syncing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {syncStatus === 'error' && <CloudOff className="h-3.5 w-3.5" />}
      <span>
        {syncStatus === 'idle' && 'Synced'}
        {syncStatus === 'syncing' && 'Syncing'}
        {syncStatus === 'error' && 'Sync error'}
      </span>
    </div>
  );
}
