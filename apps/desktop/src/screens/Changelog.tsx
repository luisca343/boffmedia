import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChangelogListEntity } from "@boffmedia/shared";
import {
  Banner,
  Button,
  ChangelogFeed,
  Empty,
  Panel,
  Spinner,
  ToolHeader,
} from "@boffmedia/ui";

import { useLocale, useT } from "../i18n";
import { openUrl } from "../runtime";
import {
  cacheChangelog,
  loadChangelog,
  markChangelogSeen,
} from "../services/changelog";
import { useApp } from "../state/app";

export function Changelog() {
  const t = useT("changelog");
  const locale = useLocale();
  const { boffAccount, hasSession, offline } = useApp();
  const accountId = boffAccount?.id ?? null;
  const [result, setResult] = useState<ChangelogListEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState(false);
  const seenEntryRef = useRef<number | null>(null);
  const resultAccountRef = useRef<number | null | undefined>(undefined);
  const loadRequestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError(false);
    const response = await loadChangelog(locale, accountId ?? undefined);
    if (requestId !== loadRequestRef.current) return;
    resultAccountRef.current = accountId;
    setResult(response.data);
    setFromCache(response.fromCache);
    setError(!response.data);
    setLoading(false);
  }, [accountId, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const newest = result?.items[0];
    if (
      resultAccountRef.current !== accountId ||
      !hasSession ||
      offline ||
      !newest ||
      seenEntryRef.current === newest.id
    )
      return;
    seenEntryRef.current = newest.id;
    void markChangelogSeen({
      entryId: newest.id,
      product: "boffmedia",
      platform: "desktop",
    }).then((ok) => {
      if (!ok) {
        seenEntryRef.current = null;
        return;
      }
      const next = result
        ? { ...result, hasUnread: false, unreadCount: 0 }
        : result;
      setResult(next);
      if (next) void cacheChangelog(locale, next, accountId ?? undefined);
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("boffmedia:changelog-seen"));
    });
  }, [accountId, hasSession, offline, locale, result]);

  return (
    <div className="h-full overflow-y-auto bg-base px-8 py-7">
      <div className="mx-auto w-full max-w-5xl">
        <ToolHeader className="mb-6" title={t("title")} sub={t("description")} />
        {fromCache && (
          <Banner tone="warn" icon="database" className="mb-5">
            {t("offline")}
          </Banner>
        )}
        {loading && (
          <Panel flat bodyClassName="flex min-h-[18rem] items-center justify-center gap-3 font-mono text-sm uppercase tracking-[0.1em] text-txt-muted">
            <Spinner size={18} className="text-accent" />
            {t("loading")}
          </Panel>
        )}
        {!loading && error && (
          <Panel flat bodyClassName="p-6">
            <p className="font-display font-bold uppercase text-txt">{t("error")}</p>
            <Button size="sm" icon="refresh" onClick={() => void load()} className="mt-4">
              {t("retry")}
            </Button>
          </Panel>
        )}
        {!loading && !error && result && result.items.length === 0 && (
          <Panel flat>
            <Empty icon="book" title={t("empty")} lead={t("emptyDescription")} />
          </Panel>
        )}
        {!loading && !error && result && result.items.length > 0 && (
          <ChangelogFeed
            items={result.items.map((item) => ({
              id: item.id,
              title: item.translation.title,
              date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(item.publishedAt),
              ),
              version: item.version ? t("version", { version: item.version }) : undefined,
              platform: t(`platform.${item.platform}`),
              summary: item.translation.summary,
              body: item.translation.body,
              cta:
                item.cta && item.translation.ctaLabel
                  ? { label: item.translation.ctaLabel, url: item.cta.url }
                  : undefined,
            }))}
            onOpenCta={(url) => void openUrl(url)}
          />
        )}
      </div>
    </div>
  );
}
