"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Spinner, toast } from "@boffmedia/ui";
import { CreateReleaseDto } from "@boffmedia/shared";
import type { ReleaseEntity, ReleaseReadinessEntity } from "@boffmedia/shared";
import { ReleasesService } from "@/services/api/boffmedia/releasesService";
import {
  AvAlert,
  AvKpi,
  AvKpis,
  AvPanel,
  AvPill,
  AvSectionHead,
} from "../_components/ui/av-kit";

type Surface = "web" | "api" | "desktop";
const SURFACES: Surface[] = ["web", "api", "desktop"];

export function ProductReleasesAdmin() {
  const t = useTranslations("admin.productReleases");
  const [rows, setRows] = useState<ReleaseEntity[]>([]);
  const [readiness, setReadiness] = useState<
    Record<number, ReleaseReadinessEntity>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<number | "create" | null>(null);
  const [version, setVersion] = useState("");
  const [versionFileSha, setVersionFileSha] = useState("");
  const [surfaces, setSurfaces] = useState<Surface[]>(["web", "api"]);
  const [changelogMode, setChangelogMode] =
    useState<CreateReleaseDto.changelogMode>(
      CreateReleaseDto.changelogMode.ENTRIES,
    );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await ReleasesService.listAdmin();
      if (!response.success || !response.data) {
        setError(true);
        return;
      }
      setRows(response.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !version.trim() ||
      versionFileSha.trim().length !== 64 ||
      surfaces.length === 0
    )
      return;
    setBusy("create");
    const response = await ReleasesService.createManual({
      version: version.trim(),
      versionFileSha: versionFileSha.trim(),
      requiredSurfaces: surfaces,
      changelogMode,
    });
    setBusy(null);
    if (!response.success || !response.data) {
      toast({
        tone: "bad",
        title: t("createFailed"),
        msg: response.userMessage ?? response.message ?? t("tryAgain"),
      });
      return;
    }
    setRows((current) => [response.data!, ...current]);
    setVersion("");
    setVersionFileSha("");
    toast({ tone: "ok", title: t("created"), msg: t("createdLead") });
  };

  const approve = async (id: number) => {
    setBusy(id);
    const response = await ReleasesService.approve(id);
    setBusy(null);
    if (!response.success || !response.data) {
      toast({
        tone: "bad",
        title: t("approveFailed"),
        msg: response.userMessage ?? response.message ?? t("tryAgain"),
      });
      return;
    }
    setRows((current) =>
      current.map((row) => (row.id === id ? response.data! : row)),
    );
    toast({ tone: "ok", title: t("approved"), msg: t("approvedLead") });
  };

  const archive = async (id: number) => {
    if (!window.confirm(t("archivePrompt"))) return;
    setBusy(id);
    const response = await ReleasesService.archive(id);
    setBusy(null);
    if (!response.success || !response.data) {
      toast({
        tone: "bad",
        title: t("archiveFailed"),
        msg: response.userMessage ?? response.message ?? t("tryAgain"),
      });
      return;
    }
    setRows((current) =>
      current.map((row) => (row.id === id ? response.data! : row)),
    );
    toast({ tone: "ok", title: t("archived"), msg: t("archivedLead") });
  };

  const withdraw = async (id: number) => {
    const reason = window.prompt(t("withdrawPrompt"))?.trim();
    if (!reason) return;
    setBusy(id);
    const response = await ReleasesService.withdraw(id, { reason });
    setBusy(null);
    if (!response.success || !response.data) {
      toast({
        tone: "bad",
        title: t("withdrawFailed"),
        msg: response.userMessage ?? response.message ?? t("tryAgain"),
      });
      return;
    }
    setRows((current) =>
      current.map((row) => (row.id === id ? response.data! : row)),
    );
    toast({ tone: "ok", title: t("withdrawn"), msg: t("withdrawnLead") });
  };

  const loadReadiness = async (id: number) => {
    const response = await ReleasesService.readiness(id);
    if (response.success && response.data) {
      setReadiness((current) => ({ ...current, [id]: response.data! }));
    } else {
      toast({ tone: "bad", title: t("readinessFailed"), msg: t("tryAgain") });
    }
  };

  const published = rows.filter((row) => row.published).length;
  const drafts = rows.filter((row) => row.status === "draft").length;

  return (
    <div>
      <AvSectionHead
        title={t("title")}
        desc={t("desc")}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon="refresh"
            onClick={() => void reload()}
          >
            {t("refresh")}
          </Button>
        }
      />
      <AvAlert title={t("automationTitle")}>{t("automationLead")}</AvAlert>
      <AvKpis>
        <AvKpi label={t("kpiTotal")} value={rows.length} icon="sparkles" />
        <AvKpi label={t("kpiPublished")} value={published} icon="check" live />
        <AvKpi label={t("kpiDrafts")} value={drafts} icon="edit" />
      </AvKpis>

      <AvPanel title={t("manualTitle")} icon="plus">
        <p className="mb-4 text-sm text-txt-muted">{t("manualLead")}</p>
        <form
          className="grid gap-4 lg:grid-cols-[minmax(10rem,1fr)_minmax(15rem,1fr)_minmax(10rem,0.8fr)_minmax(16rem,1.2fr)_auto] lg:items-end"
          onSubmit={create}
        >
          <label className="grid gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
            {t("version")}
            <input
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="0.9.1"
              className="h-10 border border-line-2 bg-base px-3 font-mono text-sm normal-case tracking-normal text-txt outline-none focus:border-accent"
              required
            />
          </label>
          <label className="grid gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
            {t("versionFileSha")}
            <input
              value={versionFileSha}
              onChange={(event) =>
                setVersionFileSha(event.target.value.toLowerCase())
              }
              placeholder={t("versionFileShaPlaceholder")}
              minLength={64}
              maxLength={64}
              pattern="[a-f0-9]{64}"
              title={t("versionFileShaHint")}
              className="h-10 border border-line-2 bg-base px-3 font-mono text-xs normal-case tracking-normal text-txt outline-none focus:border-accent"
              required
            />
          </label>
          <fieldset className="grid gap-1.5 border-0 p-0">
            <legend className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
              {t("surfaces")}
            </legend>
            <div className="flex h-10 flex-wrap items-center gap-3">
              {SURFACES.map((surface) => (
                <label
                  key={surface}
                  className="inline-flex items-center gap-1.5 font-body text-sm text-txt"
                >
                  <input
                    type="checkbox"
                    checked={surfaces.includes(surface)}
                    onChange={(event) =>
                      setSurfaces((current) =>
                        event.target.checked
                          ? [...current, surface]
                          : current.filter((item) => item !== surface),
                      )
                    }
                  />
                  {t(`surface.${surface}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="grid gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-txt-muted">
            {t("changelogMode")}
            <select
              value={changelogMode}
              onChange={(event) =>
                setChangelogMode(
                  event.target.value as CreateReleaseDto.changelogMode,
                )
              }
              className="h-10 border border-line-2 bg-base px-3 font-body text-sm normal-case tracking-normal text-txt outline-none focus:border-accent"
            >
              <option value={CreateReleaseDto.changelogMode.ENTRIES}>
                {t("mode.entries")}
              </option>
              <option value={CreateReleaseDto.changelogMode.NONE}>
                {t("mode.none")}
              </option>
            </select>
          </label>
          <Button
            type="submit"
            variant="pri"
            size="sm"
            disabled={
              busy === "create" ||
              surfaces.length === 0 ||
              versionFileSha.trim().length !== 64
            }
          >
            {busy === "create" ? t("creating") : t("create")}
          </Button>
        </form>
      </AvPanel>

      <AvPanel title={t("listTitle")} icon="list">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size={28} className="text-accent" />
          </div>
        ) : error ? (
          <p className="text-sm text-bad">{t("loadFailed")}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-txt-muted">{t("empty")}</p>
        ) : (
          <div className="grid gap-3">
            {rows.map((row) => {
              const statusTone = row.published
                ? "green"
                : row.status === "archived"
                  ? "muted"
                  : "amber";
              const state = readiness[row.id];
              return (
                <div key={row.id} className="border border-line-2 bg-base p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 font-mono text-base font-bold text-txt">
                          {row.version}
                        </h3>
                        <AvPill tone={statusTone}>
                          {row.withdrawn
                            ? t("withdrawn")
                            : row.published
                              ? t("published")
                              : t(`status.${row.status}`)}
                        </AvPill>
                        <AvPill tone="muted">
                          {t(`source.${row.creationSource}`)}
                        </AvPill>
                      </div>
                      <p className="mt-2 mb-0 text-xs text-txt-muted">
                        {row.requiredSurfaces
                          .map((surface) => t(`surface.${surface}`))
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void loadReadiness(row.id)}
                      >
                        {t("readiness")}
                      </Button>
                      {!row.approved && row.status === "draft" && (
                        <Button
                          variant="pri"
                          size="sm"
                          disabled={busy === row.id}
                          onClick={() => void approve(row.id)}
                        >
                          {busy === row.id ? t("approving") : t("approve")}
                        </Button>
                      )}
                      {row.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy === row.id}
                          onClick={() => void archive(row.id)}
                        >
                          {t("archive")}
                        </Button>
                      )}
                      {row.published && !row.withdrawn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy === row.id}
                          onClick={() => void withdraw(row.id)}
                        >
                          {t("withdraw")}
                        </Button>
                      )}
                    </div>
                  </div>
                  {state && (
                    <p className="mt-3 mb-0 border-t border-line pt-3 font-mono text-xs text-txt-muted">
                      {state.eligible
                        ? t("ready")
                        : t("missing", {
                            surfaces: state.missingSurfaces
                              .map((surface) => t(`surface.${surface}`))
                              .join(", "),
                          })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AvPanel>
    </div>
  );
}
