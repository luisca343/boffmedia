import { Suspense } from "react";
import { MetaLayoutClient } from "@boffmedia/tools-pokemon";
import { VgcRouted } from "../_components/VgcRouted";

/**
 * Meta is one client tool across two routes (`/meta` and `/meta/[speciesId]`),
 * so it is mounted by the LAYOUT and both pages return null. That was already
 * true before the port; what changed is only where the component comes from.
 */
export default function VgcMetaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <VgcRouted>
          <MetaLayoutClient />
        </VgcRouted>
      </Suspense>
      {/* Pages return null; children rendered to satisfy Next.js layout contract */}
      <div className="hidden">{children}</div>
    </>
  );
}
