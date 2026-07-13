"use client";

import { useIssues } from "../../_hooks/queries";
import { longDateOf } from "../../_utils/article";
import { CardFlat, Meta, SectionHeader } from "../../_components/ui";

/**
 * The back-issue archive, derived server-side by grouping published news on
 * `issue`. The masthead's "Archivo" link deep-links straight to `#archivo`,
 * so this needs the anchor id and enough top offset to clear the sticky nav.
 */
export function IssueArchive() {
  const { data: issues } = useIssues();

  if (!issues || issues.length === 0) return null;

  const sorted = [...issues].sort((a, b) => b.issue - a.issue);

  return (
    <section
      id="archivo"
      className="mx-auto max-w-[1400px] scroll-mt-32 px-6 py-12"
    >
      <div className="mb-6">
        <SectionHeader
          eyebrow="NÚMEROS ANTERIORES"
          title="El Archivo"
          number="04"
          hint={`${sorted.length} ${sorted.length === 1 ? "número" : "números"}`}
        />
      </div>
      <div className="grid gap-3">
        {sorted.map((issue) => (
          <CardFlat
            key={issue.issue}
            className="flex items-center gap-5 p-4"
          >
            <span className="ft-stamp shrink-0" aria-hidden="true">
              {String(issue.issue).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-ft-display truncate text-xl leading-tight">
                {issue.headline}
              </div>
              <Meta className="mt-1 block">
                {longDateOf(new Date(issue.publishedAt))}
              </Meta>
            </div>
            <Meta className="shrink-0 text-ft-pink">
              {issue.articles} {issue.articles === 1 ? "artículo" : "artículos"}
            </Meta>
          </CardFlat>
        ))}
      </div>
    </section>
  );
}
