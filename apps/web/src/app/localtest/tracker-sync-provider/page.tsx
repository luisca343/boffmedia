'use client';

import { useTrackerSync, TrackerSyncProvider } from '@/features/vgc-tracker/context/TrackerSyncContext';
import { SessionProvider } from 'next-auth/react';

function TrackerSyncProbe() {
  const { syncStatus } = useTrackerSync();
  return <p data-testid="sync-status">{syncStatus}</p>;
}

export default function TrackerSyncProviderTestPage() {
  const session = {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      accessToken: 'fake-access-token',
      roles: ['USER'],
    },
    expires: '2099-01-01T00:00:00.000Z',
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Tracker Sync Provider Test</h1>
      <SessionProvider session={session as never} refetchInterval={0} refetchOnWindowFocus={false}>
        <TrackerSyncProvider>
          <TrackerSyncProbe />
        </TrackerSyncProvider>
      </SessionProvider>
    </div>
  );
}
