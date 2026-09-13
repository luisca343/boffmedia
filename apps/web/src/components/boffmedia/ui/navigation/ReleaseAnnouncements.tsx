"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReleaseEntity } from "@boffmedia/shared";
import { Button } from "@boffmedia/ui";
import { useBoffSession } from "@/services/useBoffSession";
import {
  ReleasesService,
  type ReleaseLocale,
} from "@/services/api/boffmedia/releasesService";

const ANONYMOUS_LAST_SEEN_KEY = "boffmedia.lastSeenRelease";

interface ReleaseAnnouncementsContextValue {
  releases: ReleaseEntity[];
  unseen: ReleaseEntity[];
  hasUnread: boolean;
  acknowledging: boolean;
  acknowledge: () => Promise<void>;
}

const EMPTY_CONTEXT: ReleaseAnnouncementsContextValue = {
  releases: [],
  unseen: [],
  hasUnread: false,
  acknowledging: false,
  acknowledge: async () => undefined,
};

const ReleaseAnnouncementsContext =
  createContext<ReleaseAnnouncementsContextValue>(EMPTY_CONTEXT);

function releaseLocale(value: string): ReleaseLocale {
  return value.toLowerCase().startsWith("en") ? "en" : "es";
}

function anonymousUnseen(
  releases: ReleaseEntity[],
  lastSeenVersion: string | null,
): ReleaseEntity[] {
  if (!lastSeenVersion) return releases;
  const lastSeenIndex = releases.findIndex(
    (release) => release.version === lastSeenVersion,
  );
  return lastSeenIndex < 0 ? releases : releases.slice(0, lastSeenIndex);
}

export function ReleaseAnnouncementsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const locale = releaseLocale(useLocale());
  const { status } = useBoffSession();
  const [releases, setReleases] = useState<ReleaseEntity[]>([]);
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    let alive = true;
    if (status !== "authenticated") {
      try {
        setLastSeenVersion(
          window.localStorage.getItem(ANONYMOUS_LAST_SEEN_KEY),
        );
      } catch {
        setLastSeenVersion(null);
      }
    } else {
      setLastSeenVersion(null);
    }

    ReleasesService.list(locale, status === "authenticated")
      .then((response) => {
        if (alive && response.success) setReleases(response.data ?? []);
      })
      .catch(() => {
        if (alive) setReleases([]);
      });

    return () => {
      alive = false;
    };
  }, [locale, status]);

  const unseen = useMemo(
    () =>
      status === "authenticated"
        ? releases.filter((release) => release.seen !== true)
        : anonymousUnseen(releases, lastSeenVersion),
    [lastSeenVersion, releases, status],
  );

  const acknowledge = useCallback(async () => {
    if (unseen.length === 0) return;
    setAcknowledging(true);
    try {
      if (status === "authenticated") {
        const results = await Promise.allSettled(
          unseen.map((release) => ReleasesService.markSeen(release.id)),
        );
        const seenIds = new Set(
          results.flatMap((result, index) =>
            result.status === "fulfilled" && result.value.success
              ? [unseen[index].id]
              : [],
          ),
        );
        if (seenIds.size > 0) {
          setReleases((current) =>
            current.map((release) =>
              seenIds.has(release.id) ? { ...release, seen: true } : release,
            ),
          );
        }
      } else {
        const newest = releases[0]?.version;
        if (newest) {
          setLastSeenVersion(newest);
          try {
            window.localStorage.setItem(ANONYMOUS_LAST_SEEN_KEY, newest);
          } catch {
            // Memory state still acknowledges this session if storage is blocked.
          }
        }
      }
    } finally {
      setAcknowledging(false);
    }
  }, [releases, status, unseen]);

  const value = useMemo(
    () => ({
      releases,
      unseen,
      hasUnread: unseen.length > 0,
      acknowledging,
      acknowledge,
    }),
    [acknowledge, acknowledging, releases, unseen],
  );

  return (
    <ReleaseAnnouncementsContext.Provider value={value}>
      {children}
    </ReleaseAnnouncementsContext.Provider>
  );
}

export function useReleaseAnnouncements(): ReleaseAnnouncementsContextValue {
  return useContext(ReleaseAnnouncementsContext);
}

export function ReleaseAnnouncement() {
  const t = useTranslations("releases");
  const { unseen, hasUnread, acknowledging, acknowledge } =
    useReleaseAnnouncements();

  if (!hasUnread) return null;

  return (
    <aside
      aria-label={t("sinceLastVisit")}
      className="border-b border-accent/30 bg-panel px-5 py-4 sm:px-10"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="m-0 font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-accent">
            {t("sinceLastVisit")}
          </p>
          <p className="mt-1 mb-3 font-body text-sm text-txt-muted">
            {t("announcementLead", { count: unseen.length })}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unseen.map((release) => (
              <div
                key={release.id}
                className="min-w-0 border-l-2 border-accent/40 pl-3"
              >
                <p className="m-0 font-mono text-xs font-bold text-txt">
                  {release.version}
                </p>
                <p className="mt-1 mb-0 truncate font-body text-xs text-txt-muted">
                  {release.entries.map((entry) => entry.title).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href="/novedades"
            onClick={() => void acknowledge()}
            className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-txt-muted no-underline hover:text-accent"
          >
            {t("viewAll")}
          </Link>
          <Button
            variant="pri"
            size="sm"
            disabled={acknowledging}
            onClick={() => void acknowledge()}
          >
            {acknowledging ? t("acknowledging") : t("acknowledge")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
