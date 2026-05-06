'use client';

import { useState } from 'react';
import { SyncStatusBadge } from '@/app/(boffmedia)/(herramientas)/pokemon/vgc/tracker/_components/SyncStatusBadge';
import { TrackerSyncContext, type SyncStatus } from '@/features/vgc-tracker/context/TrackerSyncContext';

export default function TrackerSyncBadgeTestPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('conflict');
  const [refreshCount, setRefreshCount] = useState(0);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Tracker Sync Badge Test</h1>
      <TrackerSyncContext.Provider
        value={{
          pushChange: () => {},
          syncStatus,
          conflictMessage: 'Another tab/device has newer data. Refresh from cloud to continue.',
          refreshNow: async () => {
            setRefreshCount((prev) => prev + 1);
            setSyncStatus('idle');
            return true;
          },
          lastSyncAt: 0,
        }}
      >
        <SyncStatusBadge />
      </TrackerSyncContext.Provider>
      <p data-testid="refresh-count" className="mt-4 text-sm">
        refresh-count:{refreshCount}
      </p>
    </div>
  );
}
