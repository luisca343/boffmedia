'use client';

import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useTrackerSync } from '@/features/vgc-tracker/context/TrackerSyncContext';

export function SyncStatusBadge() {
  const { syncStatus } = useTrackerSync();

  if (syncStatus === 'offline') return null;

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
