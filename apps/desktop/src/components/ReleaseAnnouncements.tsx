import { Button } from "@boffmedia/ui";
import type { ReleaseEntity } from "@boffmedia/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLocale, useT } from "../i18n";
import { productReleaseMarkSeen, productReleasesList } from "../runtime";
import { useApp } from "../state/app";

const ANONYMOUS_LAST_SEEN_KEY = "boffmedia.lastSeenRelease";

interface ReleaseAnnouncementsContextValue {
  hasUnread: boolean;
  unseenCount: number;
  acknowledge: () => Promise<void>;
}

const ReleaseAnnouncementsContext =
  createContext<ReleaseAnnouncementsContextValue | null>(null);

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

export function ProductReleaseAnnouncementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const { booting, hasSession } = useApp();
  const [releases, setReleases] = useState<ReleaseEntity[]>([]);
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(null);

  useEffect(() => {
    if (booting) return;
    let alive = true;
    setReleases([]);
    if (!hasSession) {
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

    void productReleasesList(locale)
      .then((rows) => {
        if (alive) setReleases(rows);
      })
      .catch(() => {
        if (alive) setReleases([]);
      });

    return () => {
      alive = false;
    };
  }, [booting, hasSession, locale]);

  const unseen = useMemo(
    () =>
      hasSession
        ? releases.filter((release) => release.seen !== true)
        : anonymousUnseen(releases, lastSeenVersion),
    [hasSession, lastSeenVersion, releases],
  );

  const acknowledge = useCallback(async () => {
    if (unseen.length === 0) return;
    if (hasSession) {
      const results = await Promise.allSettled(
        unseen.map((release) => productReleaseMarkSeen(release.id)),
      );
      const seenIds = new Set(
        results.flatMap((result, index) =>
          result.status === "fulfilled" && result.value
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
      return;
    }

    const newest = releases[0]?.version;
    if (!newest) return;
    setLastSeenVersion(newest);
    try {
      window.localStorage.setItem(ANONYMOUS_LAST_SEEN_KEY, newest);
    } catch {
      // Memory state still acknowledges this session if storage is blocked.
    }
  }, [hasSession, releases, unseen]);

  const value = useMemo(
    () => ({
      hasUnread: unseen.length > 0,
      unseenCount: unseen.length,
      acknowledge,
    }),
    [acknowledge, unseen.length],
  );

  return (
    <ReleaseAnnouncementsContext.Provider value={value}>
      {children}
    </ReleaseAnnouncementsContext.Provider>
  );
}

export function useProductReleaseAnnouncements(): ReleaseAnnouncementsContextValue {
  const value = useContext(ReleaseAnnouncementsContext);
  return (
    value ?? {
      hasUnread: false,
      unseenCount: 0,
      acknowledge: async () => undefined,
    }
  );
}

export function ProductReleaseAnnouncement() {
  const t = useT("releases");
  const { go } = useApp();
  const { hasUnread, unseenCount, acknowledge } =
    useProductReleaseAnnouncements();
  if (!hasUnread) return null;

  return (
    <aside className="border-b border-accent/30 bg-surface px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            {t("sinceLastVisit")}
          </p>
          <p className="mt-1 mb-0 text-sm text-txt-muted">
            {t("announcementLead", { count: unseenCount })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void acknowledge();
              go("releases");
            }}
          >
            {t("viewAll")}
          </Button>
          <Button variant="pri" size="sm" onClick={() => void acknowledge()}>
            {t("acknowledge")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
