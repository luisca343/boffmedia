'use client';

import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useTrackerSync } from '@/features/vgc-tracker/context/TrackerSyncContext';

export function SyncStatusBadge() {
  const { syncStatus, conflictMessage, refreshNow } = useTrackerSync();

  if (syncStatus === 'offline') return null;

  if (syncStatus === 'conflict') {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm">
        <p className="font-semibold">Sync conflict</p>
        <p className="mt-1">{conflictMessage ?? 'Another tab/device has newer tracker data.'}</p>
        <button
          type="button"
          onClick={() => { void refreshNow(); }}
          className="mt-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Refresh from cloud
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium select-none"
      title={syncStatus === 'idle' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing…' : 'Sync error'}
      style={{
        background:
          syncStatus === 'idle' ? 'rgba(34,197,94,0.15)' :
          syncStatus === 'syncing' ? 'rgba(234,179,8,0.15)' :
          'rgba(239,68,68,0.15)',
        color:
          syncStatus === 'idle' ? '#16a34a' :
          syncStatus === 'syncing' ? '#b45309' :
          '#dc2626',
      }}
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
