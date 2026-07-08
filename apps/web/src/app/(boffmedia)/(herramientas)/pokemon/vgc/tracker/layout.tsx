import { TrackerSyncProvider } from '@/features/vgc-tracker/context/TrackerSyncContext';
import { SyncStatusBadge } from './_components/SyncStatusBadge';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackerSyncProvider>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 [&>*]:pointer-events-auto">
        <SyncStatusBadge />
      </div>
    </TrackerSyncProvider>
  );
}
