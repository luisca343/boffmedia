import { Banner, Panel, Spinner } from "@boffmedia/ui";
import type { ReleaseEntity, ReleaseEntryEntity } from "@boffmedia/shared";
import { useEffect, useState } from "react";

import { useLocale, useT } from "../i18n";
import { productReleaseMarkSeen, productReleasesList } from "../runtime";
import { useApp } from "../state/app";
import { intlLocale } from "@boffmedia/ui/locale";

const TYPE_STYLES: Record<ReleaseEntryEntity["type"], string> = {
  new: "border-accent/40 bg-accent/10 text-accent",
  improvement: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  fix: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  security: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  deprecated: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  removed: "border-red-400/40 bg-red-400/10 text-red-300",
};

function Entry({
  entry,
  t,
}: {
  entry: ReleaseEntryEntity;
  t: ReturnType<typeof useT>;
}) {
  return (
    <li className="border-l-2 border-line pl-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] ${TYPE_STYLES[entry.type]}`}
        >
          {t(`types.${entry.type}`)}
        </span>
        <h3 className="m-0 text-sm font-semibold text-txt">{entry.title}</h3>
      </div>
      <p className="m-0 whitespace-pre-line text-xs leading-5 text-txt-muted">
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
  t: ReturnType<typeof useT>;
  locale: "en" | "es";
}) {
  const date = release.publishedAt
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(release.publishedAt))
    : "";
  return (
    <article className="border border-line bg-surface p-4">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h2 className="m-0 font-mono text-lg font-bold text-txt">
          {release.version}
        </h2>
        <time
          className="text-[0.6875rem] text-txt-muted"
          dateTime={release.publishedAt ?? undefined}
        >
          {date}
        </time>
      </header>
      {release.withdrawn && (
        <p className="mb-4 border border-amber-400/40 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
          {t("withdrawnNotice", {
            reason: release.withdrawalReason ?? t("withdrawnFallback"),
          })}
        </p>
      )}
      <ul className="m-0 grid list-none gap-4 p-0">
        {release.entries.map((entry) => (
          <Entry key={entry.id} entry={entry} t={t} />
        ))}
      </ul>
    </article>
  );
}

export function Releases() {
  const t = useT("releases");
  const locale = useLocale();
  const { hasSession } = useApp();
  const [releases, setReleases] = useState<ReleaseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    void productReleasesList(locale)
      .then((rows) => {
        if (live) setReleases(rows);
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!hasSession) return;
    const unseen = releases.filter((release) => release.seen === false);
    if (unseen.length === 0) return;
    void Promise.all(
      unseen.map(async (release) => ({
        id: release.id,
        ok: await productReleaseMarkSeen(release.id),
      })),
    ).then((results) => {
      const seen = new Set(
        results.filter((result) => result.ok).map((result) => result.id),
      );
      if (seen.size > 0)
        setReleases((current) =>
          current.map((release) =>
            seen.has(release.id) ? { ...release, seen: true } : release,
          ),
        );
    });
  }, [hasSession, releases]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-extrabold text-txt">{t("title")}</h1>
        <p className="mb-6 text-sm leading-6 text-txt-muted">{t("lead")}</p>
        {loading && (
          <div className="flex items-center gap-2 py-8 text-sm text-txt-muted">
            <Spinner size={14} />
            {t("loading")}
          </div>
        )}
        {failed && <Banner tone="error" title={t("error")} />}
        {!loading && !failed && releases.length === 0 && (
          <Panel>
            <p className="m-0 text-sm text-txt-muted">{t("empty")}</p>
          </Panel>
        )}
        <div className="grid gap-4">
          {releases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
