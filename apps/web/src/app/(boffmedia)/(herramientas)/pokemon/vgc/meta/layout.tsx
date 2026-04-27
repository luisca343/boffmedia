import { Suspense } from "react";
import { MetaLayoutClient } from "./_components/MetaLayoutClient";

export default function VgcMetaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <MetaLayoutClient />
      </Suspense>
      {/* Pages return null; children rendered to satisfy Next.js layout contract */}
      <div className="hidden">{children}</div>
    </>
  );
}
