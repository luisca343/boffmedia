import type { ReactNode } from "react";

import { AppQueryProvider as FurretQueryProvider } from "@/components/smartrotom/behavior/QueryProvider";
import { FurretNav } from "./_components/FurretNav";
import { FurretFooter } from "./_components/FurretFooter";
import { ToastHost } from "./_components/ui";

/**
 * The `ft-*` scope root. Light-only by design — the warm
 * newsprint paper IS the product — so unlike Starbank/ChatApp/Notas there is no
 * `data-theme` here and the app does not read `useRotomMode()`; Pokédex, Arcade
 * and Misiones do the same. The dark "ink" cover is a section, not a theme.
 */
export default function FurretTodayLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FurretQueryProvider>
      <div className="ft-app font-ft ft-scroll min-h-full overflow-auto text-ft-ink">
        <FurretNav />
        <main>{children}</main>
        <FurretFooter />
        <ToastHost />
      </div>
    </FurretQueryProvider>
  );
}
