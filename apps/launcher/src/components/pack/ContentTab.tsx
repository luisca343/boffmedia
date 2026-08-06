import { useMemo, useState } from "react"

import {
  Badge,
  Button,
  CatalogIcon,
  Empty,
  Icon,
  Input,
  Seg,
  Spinner,
  Toggle,
  getCatalog,
  toast,
} from "@boffmedia/ui"

import { useT } from "../../i18n"
import { instanceOptionalSet } from "../../runtime"
import { removeFile, replaceFile } from "../../services/localPackEdit"
import { formatBytes } from "../../utils/format"
import { UpdateReview } from "./UpdateReview"
import {
  type ContentCategory,
  type ContentRow,
  categoryOf,
  findUpdates,
  usePackContent,
} from "./usePackContent"

// The installed half of the pack: what is in it, whether each file is switched
// on, and — for a local pack — the actions that change that.
//
// A MANAGED pack is deliberately read-only here. Its file list is the server's
// manifest, and the install pass re-derives it from that manifest every time;
// a delete or a version swap would be silently undone on the next launch, which
// is worse than not offering it. The optional-file toggles are the one
// exception, because the manifest itself declares those as the player's choice.

export function ContentTab({
  slug,
  isLocal,
  minecraft,
  loader,
  onBrowse,
  onChanged,
}: {
  slug: string
  isLocal: boolean
  minecraft: string
  loader: string | null
  onBrowse: () => void
  onChanged: () => void
}) {
  const t = useT("content")
  const { rows, loading, reload, setRows } = usePackContent(slug, isLocal, true)

  const CATEGORY_LABEL: Record<Exclude<ContentCategory, "all">, string> = {
    mod: t("categories.mod"),
    shader: t("categories.shader"),
    resourcepack: t("categories.resourcepack"),
    update: t("categories.update"),
  }

  const KIND_LABEL: Record<ContentRow["kind"], string> = {
    modrinth: t("kinds.modrinth"),
    curseforge: t("kinds.curseforge"),
    url: t("kinds.url"),
    override: t("kinds.override"),
  }
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ContentCategory>("all")
  const [busyPath, setBusyPath] = useState<string | null>(null)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updatingAll, setUpdatingAll] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<string | null>(null)

  const pendingUpdates = useMemo(() => rows.filter((r) => r.update), [rows])
  const updateCount = pendingUpdates.length

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows
      .filter((row) => {
        if (category === "update") return !!row.update
        if (category !== "all" && categoryOf(row) !== category) return false
        if (!needle) return true
        return (
          row.name.toLowerCase().includes(needle) ||
          row.fileName.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [rows, query, category])

  const checkUpdates = async () => {
    setCheckingUpdates(true)
    try {
      const found = await findUpdates(rows, minecraft, loader)
      setRows(rows.map((r) => ({ ...r, update: found.get(r.path) })))
      toast.success(
        found.size === 0
          ? t("noUpdates")
          : t("updateAvailable", { count: found.size }),
      )
    } catch {
      toast.error(t("updateCheckError"))
    } finally {
      setCheckingUpdates(false)
    }
  }

  /** Repoint one entry at a different Modrinth version. Resolving gives us the
   *  new sha512 and size; without those the manifest entry would still verify
   *  against the OLD bytes and the install would fail on a hash mismatch. */
  const applyUpdate = async (row: ContentRow) => {
    if (!row.update || !row.projectId) return
    const resolved = await getCatalog().resolve({
      kind: "modrinth",
      projectId: row.projectId,
      versionId: row.update.versionId,
    })
    if (!resolved) throw new Error(`No se pudo resolver ${row.update.fileName}`)
    const folder = row.path.slice(0, row.path.lastIndexOf("/") + 1)
    await replaceFile(slug, row.path, {
      path: `${folder}${resolved.fileName}`,
      sha512: resolved.sha512,
      fileSize: resolved.fileSize,
      source: resolved.source,
    })
  }

  const updateOne = async (row: ContentRow) => {
    setBusyPath(row.path)
    try {
      await applyUpdate(row)
      toast.success(t("updated", { name: row.name }))
      reload()
      onChanged()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("updateError"))
    } finally {
      setBusyPath(null)
    }
  }

  /** Applies exactly the rows the player confirmed in the review dialog.
   *  Sequential, and one failure never abandons the rest: a bulk edit that
   *  stops halfway leaves the manifest in a state nobody asked for. */
  const applyChosen = async (chosen: ContentRow[]) => {
    if (chosen.length === 0) return
    setUpdatingAll(true)
    let done = 0
    const failed: string[] = []
    try {
      for (const [index, row] of chosen.entries()) {
        setUpdateProgress(`${index + 1}/${chosen.length} · ${row.name}`)
        try {
          await applyUpdate(row)
          done += 1
        } catch {
          failed.push(row.name)
        }
      }
      if (done > 0) toast.success(t("updateSuccess", { count: done }))
      if (failed.length > 0) {
        toast({ tone: "warn", title: t("updateWarning"), msg: failed.join(", ") })
      }
      setReviewing(false)
      reload()
      onChanged()
    } finally {
      setUpdatingAll(false)
      setUpdateProgress(null)
    }
  }

  const toggle = async (row: ContentRow) => {
    setBusyPath(row.path)
    // Optimistic: the rename is instant and a round trip here makes the switch
    // feel broken.
    setRows(rows.map((r) => (r.path === row.path ? { ...r, enabled: !r.enabled } : r)))
    try {
      await instanceOptionalSet(slug, row.path, !row.enabled)
      onChanged()
    } catch (err) {
      setRows(rows.map((r) => (r.path === row.path ? { ...r, enabled: row.enabled } : r)))
      toast.error((err as { message?: string })?.message ?? t("toggleError"))
    } finally {
      setBusyPath(null)
    }
  }

  const remove = async (row: ContentRow) => {
    setBusyPath(row.path)
    try {
      await removeFile(slug, row.path)
      toast.success(t("removed", { name: row.name }))
      reload()
      onChanged()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("removeError"))
    } finally {
      setBusyPath(null)
    }
  }

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("loading")}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <UpdateReview
        open={reviewing}
        rows={pendingUpdates}
        busy={updatingAll}
        progress={updateProgress}
        onCancel={() => setReviewing(false)}
        onConfirm={(chosen) => void applyChosen(chosen)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search", { count: rows.length })}
          />
        </div>
        {isLocal && (
          <Button size="sm" variant="pri" icon="plus" onClick={onBrowse}>
            {t("addContent")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Seg
          value={category}
          onChange={(v) => setCategory(v as ContentCategory)}
          options={[
            { value: "all", label: t("everything") },
            { value: "mod", label: CATEGORY_LABEL.mod },
            { value: "shader", label: CATEGORY_LABEL.shader },
            { value: "resourcepack", label: CATEGORY_LABEL.resourcepack },
            ...(updateCount > 0
              ? [{ value: "update", label: `${CATEGORY_LABEL.update} (${updateCount})` }]
              : []),
          ]}
        />
        <span className="flex-1" />
        {/* Update checking is a local-pack action: a managed pack's versions
            are the server's to pick, and an update the player cannot take is
            just a badge that never goes away. */}
        {isLocal && (
          <>
            {updateCount > 0 && (
              <Button
                size="sm"
                icon="download"
                disabled={updatingAll || busyPath !== null}
                onClick={() => setReviewing(true)}
              >
                {t("reviewUpdates", { count: updateCount })}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon="refresh"
              loading={checkingUpdates}
              disabled={checkingUpdates}
              onClick={() => void checkUpdates()}
            >
              {t("checkUpdates")}
            </Button>
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <Empty
          icon="cube"
          title={t("nothingToShow")}
          lead={
            rows.length === 0
              ? isLocal
                ? t("emptyLocal")
                : t("emptyManaged")
              : t("nothingMatches")
          }
        >
          {isLocal && rows.length === 0 && (
            <Button size="sm" variant="pri" icon="plus" onClick={onBrowse}>
              {t("addContent")}
            </Button>
          )}
        </Empty>
      ) : (
        <ul className="flex flex-col">
          {/* A table element would give even columns; these rows need the name
              to absorb all the slack while the actions stay pinned right. */}
          <li className="flex items-center gap-3 border-b border-solid border-line px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-dim">
            <span className="w-10 shrink-0" />
            <span className="min-w-0 flex-1">Proyecto</span>
            <span className="hidden w-[200px] shrink-0 md:block">Versión</span>
            <span className="w-[140px] shrink-0 text-right">Acciones</span>
          </li>
          {visible.map((row) => {
            const busy = busyPath === row.path
            return (
              <li
                key={row.path}
                className="flex items-center gap-3 border-b border-solid border-line px-3 py-2 hover:bg-panel-2"
              >
                <CatalogIcon src={row.iconUrl} size={40} />

                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-display text-[13px] font-bold uppercase tracking-[0.03em]">
                      {row.name}
                    </span>
                    {row.update && (
                      <Badge tone="info" className="shrink-0">
                        Actualización
                      </Badge>
                    )}
                    {!row.enabled && (
                      <Badge tone="warn" className="shrink-0">
                        Desactivado
                      </Badge>
                    )}
                    {!row.installed && (
                      <Badge tone="warn" className="shrink-0">
                        Sin instalar
                      </Badge>
                    )}
                  </span>
                  <span className="truncate font-mono text-[11px] text-txt-dim">
                    {row.author ? `${row.author} · ` : ""}
                    {KIND_LABEL[row.kind]} · {formatBytes(row.size)}
                  </span>
                </span>

                <span className="hidden w-[200px] shrink-0 flex-col gap-[2px] md:flex">
                  <span className="truncate font-mono text-[11px] text-txt-muted">
                    {row.fileName}
                  </span>
                  {row.update && (
                    <span className="truncate font-mono text-[10px] text-accent-bright">
                      → {row.update.label}
                    </span>
                  )}
                </span>

                <span className="flex w-[140px] shrink-0 items-center justify-end gap-1">
                  {busy ? (
                    <Spinner size={14} className="text-txt-muted" />
                  ) : (
                    <>
                      {isLocal && row.update && (
                        <button
                          type="button"
                          aria-label={`Actualizar ${row.name}`}
                          title="Actualizar"
                          onClick={() => void updateOne(row)}
                          className="p-1 text-accent-bright hover:text-txt"
                        >
                          <Icon name="download" size={15} />
                        </button>
                      )}
                      {/* Managed packs allow the toggle only where the manifest
                          declares the file optional; local packs own every file
                          and may switch any of them off. */}
                      {(isLocal || row.optional) && (
                        <Toggle on={row.enabled} onChange={() => void toggle(row)} />
                      )}
                      {isLocal && (
                        <button
                          type="button"
                          aria-label={`Eliminar ${row.name}`}
                          title="Eliminar del pack"
                          onClick={() => void remove(row)}
                          className="p-1 text-txt-dim hover:text-bad"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
