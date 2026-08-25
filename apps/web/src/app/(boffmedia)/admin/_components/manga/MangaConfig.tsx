"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Icon, Spinner, Toggle } from "@boffmedia/ui";
import { apiAuthedAutoGET, apiAuthedAutoPATCH, apiAuthedAutoPOST } from "@/services/boffAPI";
import { AvSectionHead, AvPanel, AvPill } from "../ui/av-kit";

type SeriesStatus = "ongoing" | "completed" | "hiatus";

interface SeriesConfig {
  sourceUrl?: string;
  status?: SeriesStatus;
  lastChecked?: string;
}

interface MangaConfigData {
  cron: { enabled: boolean; schedule: string };
  series: Record<string, SeriesConfig>;
}

const STATUSES: SeriesStatus[] = ["ongoing", "completed", "hiatus"];
const STATUS_TONE: Record<SeriesStatus, "green" | "accent" | "amber"> = {
  ongoing: "green",
  completed: "accent",
  hiatus: "amber",
};

export default function MangaConfig() {
  const t = useTranslations("admin.manga.config");
  const [config, setConfig] = useState<MangaConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cronSchedule, setCronSchedule] = useState("");
  const [savingCron, setSavingCron] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  useEffect(() => {
    apiAuthedAutoGET<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config").then((res) => {
      if (res.success && res.data) {
        setConfig(res.data);
        setCronSchedule(res.data.cron.schedule);
      }
      setLoading(false);
    });
  }, []);

  async function handleCronToggle() {
    if (!config) return;
    setSavingCron(true);
    const res = await apiAuthedAutoPATCH<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config", {
      cron: { ...config.cron, enabled: !config.cron.enabled },
    });
    if (res.success && res.data) setConfig(res.data);
    setSavingCron(false);
  }

  async function handleSaveSchedule() {
    if (!config || !cronSchedule.trim()) return;
    setSavingCron(true);
    const res = await apiAuthedAutoPATCH<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config", {
      cron: { ...config.cron, schedule: cronSchedule.trim() },
    });
    if (res.success && res.data) setConfig(res.data);
    setSavingCron(false);
  }

  async function handleRunNow() {
    setTriggering(true);
    setTriggerMessage(null);
    const res = await apiAuthedAutoPOST<{ message: string }>("/boffmedia/herramientas/scrape/manga/cron/run", {});
    setTriggerMessage(res.success && res.data ? res.data.message : t("runError"));
    setTriggering(false);
  }

  async function handleStatusChange(slug: string, status: SeriesStatus) {
    if (!config) return;
    const res = await apiAuthedAutoPATCH<{ slug: string; status: SeriesStatus }>(
      `/boffmedia/herramientas/scrape/manga/series/${encodeURIComponent(slug)}/status`,
      { status },
    );
    if (res.success) {
      setConfig((prev) =>
        prev ? { ...prev, series: { ...prev.series, [slug]: { ...(prev.series[slug] ?? {}), status } } } : prev,
      );
    }
  }

  const seriesEntries = Object.entries(config?.series ?? {});

  return (
    <div className="max-w-3xl">
      <AvSectionHead title={t("title")} desc={t("sub")} />

      {/* Auto-update / cron */}
      <AvPanel title={t("autoUpdate")} icon="refresh">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium text-txt">{t("cronTask")}</p>
              <p className="mt-0.5 text-[12px] text-txt-dim">{t("cronDesc")}</p>
            </div>
            {loading ? (
              <Spinner size={16} className="text-accent" />
            ) : (
              <Toggle
                on={!!config?.cron.enabled}
                onChange={handleCronToggle}
                ariaLabel={t("cronTask")}
              />
            )}
          </div>

          <div className="flex items-end gap-2">
            <Field label={t("cronExpr")} className="flex-1">
              <Input
                value={cronSchedule}
                onChange={(e) => setCronSchedule(e.target.value)}
                placeholder="0 3 * * *"
                disabled={loading}
                className="font-mono"
              />
            </Field>
            <Button onClick={handleSaveSchedule} loading={savingCron} disabled={savingCron || loading || !cronSchedule.trim()}>
              {t("save")}
            </Button>
          </div>
          <p className="-mt-2 font-mono text-[11px] text-txt-dim">
            {t("cronDefault")} <span className="text-accent">0 3 * * *</span>
          </p>

          <div className="flex items-center gap-3 border-t border-solid border-line pt-3">
            <Button variant="ghost" icon="play" onClick={handleRunNow} loading={triggering} disabled={triggering || loading}>
              {triggering ? t("running") : t("runNow")}
            </Button>
            {triggerMessage && <p className="text-[12px] text-txt-muted">{triggerMessage}</p>}
          </div>
        </div>
      </AvPanel>

      {/* Series status */}
      <AvPanel title={t("seriesStatus")} icon="book">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-[13px] text-txt-muted">
            <Spinner size={16} className="text-accent" />
            {t("loadingConfig")}
          </div>
        ) : seriesEntries.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-[13px] text-txt-muted">
            <Icon name="book" size={15} />
            <span>{t("noSeries")}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {seriesEntries.map(([slug, cfg]) => {
              const status = cfg.status ?? "ongoing";
              return (
                <div key={slug} className="flex items-center gap-3 border border-solid border-line bg-base-2 px-3 py-2.5">
                  <Icon name="book" size={14} className="shrink-0 text-txt-dim" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-txt">{slug}</p>
                    {cfg.lastChecked && (
                      <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-txt-dim">
                        <Icon name="clock" size={11} />
                        {t("checked", { date: new Date(cfg.lastChecked).toLocaleString() })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {STATUSES.map((s) => (
                      <button key={s} type="button" onClick={() => handleStatusChange(slug, s)} className={status === s ? "" : "opacity-45 transition-opacity hover:opacity-80"}>
                        <AvPill tone={status === s ? STATUS_TONE[s] : "default"}>{t(`status_${s}`)}</AvPill>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AvPanel>
    </div>
  );
}
