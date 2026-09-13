"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ReleaseEntity, ReleaseEntryEntity } from "@boffmedia/shared";
import { intlLocale } from "@boffmedia/ui/locale";
import {
  ReleasesService,
  type ReleaseLocale,
} from "@/services/api/boffmedia/releasesService";
import { useBoffSession } from "@/services/useBoffSession";

const ENTRY_TYPES: Record<
  ReleaseEntryEntity["type"],
  "new" | "improvement" | "fix" | "security" | "deprecated" | "removed"
> = {
  new: "new",
  improvement: "improvement",
  fix: "fix",
  security: "security",
  deprecated: "deprecated",
  removed: "removed",
};

const TYPE_STYLES: Record<keyof typeof ENTRY_TYPES, string> = {
  new: "border-accent/40 bg-accent/10 text-accent",
  improvement: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  fix: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  security: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  deprecated: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  removed: "border-red-400/40 bg-red-400/10 text-red-300",
};

function formatDate(value: string | null | undefined, locale: ReleaseLocale) {
  if (!value) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function EntryCard({
  entry,
  t,
}: {
  entry: ReleaseEntryEntity;
  t: ReturnType<typeof useTranslations>;
}) {
  const type = ENTRY_TYPES[entry.type];
  return (
    <li className="border-l-2 border-line-2 pl-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] ${TYPE_STYLES[type]}`}
        >
          {t(`types.${type}`)}
        </span>
        <h3 className="font-display text-base font-bold text-txt">
          {entry.title}
        </h3>
      </div>
      <p className="m-0 max-w-3xl whitespace-pre-line font-body text-sm leading-6 text-txt-muted">
        {entry.description}
      </p>
    </li>
  );
}

function ReleaseCard({
  release,
  t,
  locale,
}: {
  release: ReleaseEntity;
  t: ReturnType<typeof useTranslations>;
  locale: ReleaseLocale;
}) {
  return (
    <article className="cut-tag cut-tag-edge border border-line-2 bg-panel p-5 shadow-[0_20px_45px_-32px_rgba(0,0,0,0.8)] sm:p-7">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="mb-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent">
            {t("releaseLabel")}
          </p>
          <h2 className="m-0 font-display text-2xl font-extrabold tracking-tight text-txt sm:text-3xl">
            {release.version}
          </h2>
        </div>
        <time
          className="font-mono text-xs text-txt-muted"
          dateTime={release.publishedAt ?? undefined}
        >
          {formatDate(release.publishedAt, locale)}
        </time>
      </header>
      {release.withdrawn && (
        <p className="mb-6 border border-amber-400/40 bg-amber-400/10 p-3 font-body text-sm text-amber-200">
          {t("withdrawnNotice", {
            reason: release.withdrawalReason ?? t("withdrawnFallback"),
          })}
        </p>
      )}
      <ul className="m-0 grid list-none gap-6 p-0">
        {release.entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} t={t} />
        ))}
      </ul>
    </article>
  );
}

export function ReleaseFeed() {
  const t = useTranslations("releases");
  const locale = (
    useLocale().toLowerCase().startsWith("en") ? "en" : "es"
  ) as ReleaseLocale;
  const { status } = useBoffSession();
  const [releases, setReleases] = React.useState<ReleaseEntity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    ReleasesService.list(locale, status === "authenticated")
      .then((response) => {
        if (!alive) return;
        if (!response.success || !response.data) {
          setError(true);
          return;
        }
        setReleases(response.data);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [locale, status]);

  return (
    <main className="mx-auto min-h-[calc(100vh_-_var(--nav-h))] w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-accent">
          Boffmedia
        </p>
        <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight text-txt sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 mb-0 font-body text-base leading-7 text-txt-muted">
          {t("lead")}
        </p>
      </header>

      {loading && (
        <p className="font-body text-sm text-txt-muted" aria-live="polite">
          {t("loading")}
        </p>
      )}
      {error && (
        <p
          className="border border-bad/40 bg-bad/10 p-4 font-body text-sm text-bad"
          role="alert"
        >
          {t("error")}
        </p>
      )}
      {!loading && !error && releases.length === 0 && (
        <p className="border border-line bg-panel p-6 font-body text-sm text-txt-muted">
          {t("empty")}
        </p>
      )}
      <div className="grid gap-6">
        {releases.map((release) => (
          <ReleaseCard
            key={release.id}
            release={release}
            t={t}
            locale={locale}
          />
        ))}
      </div>
    </main>
  );
}
