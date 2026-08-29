import { useCallback, useEffect, useState } from "react"

import { Badge, Button, Divider, Empty, Icon, Panel, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  type Backup,
  type World,
  type RetainedVersion,
  backupCreate,
  backupDelete,
  backupList,
  backupRestore,
  instanceWorlds,
  instanceVersions,
  instanceRevert,
} from "../../runtime"
import { formatBytes } from "../../utils/format"

// Snapshots of this instance. The restore side is the reason the confirmations
// here are blunt rather than polite: restoring a world DELETES the current one
// (a merge would leave region files from two different worlds, which the game
// reads as corruption), and that is not something to discover afterwards.

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function BackupsTab({ slug, packName }: { slug: string; packName: string }) {
  const t = useT("backups")
  const tis = useT("instanceSpace")
  const [backups, setBackups] = useState<Backup[]>([])
  const [worlds, setWorlds] = useState<World[]>([])
  const [versions, setVersions] = useState<RetainedVersion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [list, saves, versionList] = await Promise.all([
      backupList(slug),
      instanceWorlds(slug).catch(() => []),
      instanceVersions(slug).catch(() => []),
    ])
    setBackups(list)
    setWorlds(saves)
    setVersions(versionList)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = async (world?: World) => {
    setBusy(world ? `world:${world.folder}` : "instance")
    try {
      await backupCreate(slug, world ? world.name : packName, world?.folder)
      toast.success(world ? t("worldSuccess", { name: world.name }) : t("packSuccess"))
      await reload()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("error"))
    } finally {
      setBusy(null)
    }
  }

  const restore = async (backup: Backup) => {
    const warning =
      backup.kind === "world"
        ? t("restoreWarningWorld", { name: backup.label })
        : t("restoreWarningPack")
    // window.confirm rather than a Modal: this is the one action in the tab
    // that destroys player data, and it must not be possible to trigger it by
    // clicking through a dialog that looks like every other dialog.
    if (!window.confirm(`${warning}\n\n${t("restoreConfirm", { date: formatWhen(backup.createdAt) })}`)) {
      return
    }
    setBusy(backup.id)
    try {
      await backupRestore(slug, backup.id)
      toast.success(t("restoreSuccess"))
      await reload()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("restoreError"))
    } finally {
      setBusy(null)
    }
  }

  const remove = async (backup: Backup) => {
    setBusy(backup.id)
    try {
      await backupDelete(slug, backup.id)
      await reload()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("deleteError"))
    } finally {
      setBusy(null)
    }
  }

  const revert = async (version: RetainedVersion) => {
    setBusy(version.versionId)
    try {
      await instanceRevert(slug, version.versionId)
      await reload()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? tis("revertError"))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("reading")}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="pri"
          icon="plus"
          loading={busy === "instance"}
          disabled={busy !== null}
          onClick={() => void create()}
        >
          Copiar el pack entero
        </Button>
        {worlds.map((world) => (
          <Button
            key={world.folder}
            size="sm"
            variant="ghost"
            icon="plus"
            loading={busy === `world:${world.folder}`}
            disabled={busy !== null}
            onClick={() => void create(world)}
          >
            Copiar «{world.name}»
          </Button>
        ))}
      </div>

      {backups.length === 0 ? (
        <Empty
          icon="cube"
          title="Sin copias"
          lead="Crea una antes de actualizar mods o de tocar los configs a mano."
        />
      ) : (
        <ul className="flex flex-col">
          {backups.map((backup) => (
            <li
              key={backup.id}
              className="flex items-center gap-3 border-b border-solid border-line px-3 py-2 hover:bg-panel-2"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <span className="flex items-center gap-2">
                  <span className="min-w-0 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                    {backup.label}
                  </span>
                  <Badge tone={backup.kind === "world" ? "info" : "ok"} className="shrink-0">
                    {backup.kind === "world" ? "Mundo" : "Pack"}
                  </Badge>
                </span>
                <span className="truncate font-mono text-[11px] text-txt-dim">
                  {formatWhen(backup.createdAt)} · {formatBytes(backup.sizeBytes)}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-1">
                {busy === backup.id ? (
                  <Spinner size={14} className="text-txt-muted" />
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={`Restaurar ${backup.label}`}
                      title="Restaurar"
                      disabled={busy !== null}
                      onClick={() => void restore(backup)}
                      className="p-1 text-accent-bright hover:text-txt"
                    >
                      <Icon name="refresh" size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Borrar la copia ${backup.label}`}
                      title="Borrar"
                      disabled={busy !== null}
                      onClick={() => void remove(backup)}
                      className="p-1 text-txt-dim hover:text-bad"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Saved versions section */}
      <Panel
        title={tis("savedVersions")}
        aside={versions?.find((v) => v.current) ? <Badge tone="ok">{versions.find((v) => v.current)?.versionName}</Badge> : null}
      >
        {versions === null ? (
          <p className="text-sm text-txt-muted">{tis("loading")}</p>
        ) : versions.length === 0 ? (
          <Empty
            icon="clock"
            title={tis("noVersions")}
            lead={tis("noVersionsDetail")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((version) => (
              <li key={version.versionId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-txt">
                    {version.versionName}
                    {version.current && (
                      <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-txt-dim">
                        {tis("currentVersion")}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-txt-dim">
                    {formatWhen(version.installedAt)} · {tis("versionFileCount", { count: version.fileCount })} ·{" "}
                    {version.minecraft}
                  </p>
                </div>
                {!version.current && (
                  <Button
                    size="sm"
                    icon="back"
                    disabled={!version.revertible || busy !== null}
                    loading={busy === version.versionId}
                    onClick={() => void revert(version)}
                  >
                    {tis("revertButton")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Divider label={tis("costDivider")} className="my-4" />
        <p className="text-xs text-txt-dim" dangerouslySetInnerHTML={{ __html: tis("costWarning") }} />
      </Panel>
    </div>
  )
}
