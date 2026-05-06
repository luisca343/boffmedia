import { TrackerSyncProvider } from '@/features/vgc-tracker/context/TrackerSyncContext';
import { SyncStatusBadge } from './_components/SyncStatusBadge';

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackerSyncProvider>
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <SyncStatusBadge />
        </div>
        {children}
      </div>
    </TrackerSyncProvider>
  );
}
