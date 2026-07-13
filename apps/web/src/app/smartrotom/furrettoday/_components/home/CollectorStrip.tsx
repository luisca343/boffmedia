"use client";

import { accentFor, ACCENT_HEX } from "../../_utils/accents";
import { useIssues } from "../../_hooks/queries";
import { Card, FurretMascot, Pill, SectionHeader, Skeleton } from "../ui";

/**
 * Back issues — derived server-side by grouping news on `issue`. Every
 * pre-existing article has `issue: null`, so this renders nothing rather
 * than a fabricated archive until the newsroom actually starts numbering
 * issues.
 */
export function CollectorStrip() {
  const { data: issues, isLoading } = useIssues();

  if (isLoading) {
    return (
      <section className="ft-wrap-wide px-6 pb-8 pt-4">
        <SectionHeader
          eyebrow="ARCHIVO COLECCIONABLE"
          title="Números Anteriores"
          number="03"
        />
        <div className="mt-7 flex gap-[18px] overflow-hidden pb-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[280px] w-[220px] shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!issues || issues.length === 0) return null;

  return (
    <section className="ft-wrap-wide px-6 pb-8 pt-4">
      <SectionHeader
        eyebrow="ARCHIVO COLECCIONABLE"
        title="Números Anteriores"
        number="03"
        hint="↓ DESLIZA"
      />
      <div className="ft-scroll mt-7 grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-[18px] overflow-x-auto pb-3">
        {issues.map((iss) => {
          const accent = accentFor(String(iss.issue));
          return (
            <Card key={iss.issue} lift className="overflow-hidden">
              <div
                className="border-ft relative flex h-[220px] items-center justify-center border-x-0 border-t-0 border-b-ft-ink"
                style={{
                  background: ACCENT_HEX[accent],
                  backgroundImage: "radial-gradient(#0b0b0f 1.4px, transparent 1.6px)",
                  backgroundSize: "12px 12px",
                }}
              >
                <FurretMascot size={160} style={{ transform: "rotate(-6deg)" }} />
                <Pill tone="paper" className="absolute left-2.5 top-2.5">
                  Nº {iss.issue}
                </Pill>
              </div>
              <div className="p-3.5">
                <div className="font-ft-display text-[22px] leading-none">{iss.headline}</div>
                <div className="font-ft-ui mt-1 text-[13px] font-medium uppercase tracking-[0.04em] text-ft-ink/70">
                  {iss.articles} {iss.articles === 1 ? "artículo" : "artículos"}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
