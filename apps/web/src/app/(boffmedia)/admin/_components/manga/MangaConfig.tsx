"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Loader2, Pause, Play, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Input } from "@/components/ui/primitives/input";
import { apiGET, apiPATCH, apiPOST } from "@/services/boffAPI";

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

const STATUS_LABELS: Record<SeriesStatus, string> = {
  ongoing: "En curso",
  completed: "Completado",
  hiatus: "En pausa",
};

const STATUS_STYLES: Record<SeriesStatus, string> = {
  ongoing: "text-green-400 border-green-800/60 bg-green-900/20",
  completed: "text-[var(--orange-500)] border-[color-mix(in_srgb,var(--orange-500)_30%,transparent)] bg-[color-mix(in_srgb,var(--orange-500)_10%,transparent)]",
  hiatus: "text-yellow-400 border-yellow-800/60 bg-yellow-900/20",
};

export default function MangaConfig() {
  const [config, setConfig] = useState<MangaConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cronSchedule, setCronSchedule] = useState("");
  const [savingCron, setSavingCron] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  useEffect(() => {
    apiGET<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config").then((res) => {
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
    const res = await apiPATCH<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config", {
      cron: { ...config.cron, enabled: !config.cron.enabled },
    });
    if (res.success && res.data) setConfig(res.data);
    setSavingCron(false);
  }

  async function handleSaveSchedule() {
    if (!config || !cronSchedule.trim()) return;
    setSavingCron(true);
    const res = await apiPATCH<MangaConfigData>("/boffmedia/herramientas/scrape/manga/config", {
      cron: { ...config.cron, schedule: cronSchedule.trim() },
    });
    if (res.success && res.data) setConfig(res.data);
    setSavingCron(false);
  }

  async function handleRunNow() {
    setTriggering(true);
    setTriggerMessage(null);
    const res = await apiPOST<{ message: string }>("/boffmedia/herramientas/scrape/manga/cron/run", {});
    setTriggerMessage(res.success && res.data ? res.data.message : "Error al iniciar la tarea.");
    setTriggering(false);
  }

  async function handleStatusChange(slug: string, status: SeriesStatus) {
    if (!config) return;
    const res = await apiPATCH<{ slug: string; status: SeriesStatus }>(
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
    <div className="max-w-3xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-[var(--orange-500)] shrink-0" />
        <h2 className="text-xl font-bold text-[var(--text)]">Configuración de Manga</h2>
      </div>

      {/* Cron settings */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[var(--text)] flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[var(--orange-500)]" />Auto-actualización
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">

          {/* Enable/disable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text)] font-medium">Tarea programada</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Comprueba nuevos capítulos en series marcadas como &quot;En curso&quot;
              </p>
            </div>
            {loading ? (
              <div className="w-9 h-5 rounded-full bg-[color-mix(in_srgb,var(--text)_7%,transparent)] animate-pulse" />
            ) : (
              <button
                onClick={handleCronToggle}
                disabled={savingCron}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${config?.cron.enabled ? "bg-[var(--accent)]" : "bg-[color-mix(in_srgb,var(--text)_10%,transparent)]"}`}
                aria-checked={config?.cron.enabled}
                role="switch"
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                  ${config?.cron.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            )}
          </div>

          {/* Schedule input */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-dim)] mb-1.5 block">Expresión cron (UTC)</label>
              <Input
                value={cronSchedule}
                onChange={(e) => setCronSchedule(e.target.value)}
                placeholder="0 3 * * *"
                disabled={loading}
                className="font-mono bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--text)] placeholder-[var(--text-dim)] disabled:opacity-40"
              />
              <p className="text-[11px] text-[var(--text-dim)] mt-1">
                Predeterminado: <code className="text-[var(--orange-500)]">0 3 * * *</code> = todos los días a las 3:00 UTC
              </p>
            </div>
            <Button
              onClick={handleSaveSchedule}
              disabled={savingCron || loading || !cronSchedule.trim()}
              variant="outline"
              size="sm"
              className="border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--text)_5%,transparent)] text-[var(--text)] shrink-0"
            >
              Guardar
            </Button>
          </div>

          {/* Run now */}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
            <Button
              onClick={handleRunNow}
              disabled={triggering || loading}
              variant="outline"
              size="sm"
              className="border-surface-600 hover:bg-surface-700 text-[var(--text)]"
            >
              {triggering
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Iniciando…</>
                : <><Play className="w-3.5 h-3.5 mr-1.5" />Ejecutar ahora</>}
            </Button>
            {triggerMessage && (
              <p className="text-xs text-[var(--text-muted)]">{triggerMessage}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Series status */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[var(--text)] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--orange-500)]" />Estado de series
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />Cargando configuración…
            </div>
          ) : seriesEntries.length === 0 ? (
            <div className="flex items-center gap-2 text-[var(--text-dim)] text-sm py-4">
              <BookOpen className="w-4 h-4" />
              <span>No hay series registradas. Descarga una serie para verla aquí.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {seriesEntries.map(([slug, cfg]) => {
                const status = cfg.status ?? "ongoing";
                return (
                  <div
                    key={slug}
                    className="flex items-center gap-3 px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[color-mix(in_srgb,var(--surface)_96%,transparent)]"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[var(--text-dim)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text)] truncate font-medium">{slug}</p>
                      {cfg.lastChecked && (
                        <p className="text-[10px] text-[var(--text-dim)] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Revisado: {new Date(cfg.lastChecked).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(["ongoing", "completed", "hiatus"] as SeriesStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(slug, s)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium transition-all
                            ${status === s ? STATUS_STYLES[s] : "text-[var(--text-dim)] border-[var(--border)] bg-transparent hover:border-[var(--border-strong)]"}`}
                        >
                          {s === "ongoing" && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {s === "completed" && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {s === "hiatus" && <Pause className="w-2.5 h-2.5" />}
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
