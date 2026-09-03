import { useEffect, useState } from "react"

import { Badge, Button, Empty, Field, Icon, Input, Modal, Spinner, toast } from "@boffmedia/ui"

import type { BundledWorld } from "@boffmedia/pack-schema"

import { useT } from "../../i18n"
import {
  type World,
  instanceDeletePath,
  instanceReveal,
  instanceWorlds,
  localPackGet,
  localPackWorldAddZip,
  localPackWorldPromote,
  localPackWorldRemove,
  worldIcon,
} from "../../runtime"
import { formatBytes, formatWhen } from "../../utils/format"

// A world's own `icon.png` (the render Minecraft snaps on save), loaded lazily
// as a data: URL and falling back to the generic globe — the same pattern
// PlayerHead uses for skins. A world with no icon, or one whose read failed, is
// cosmetic, so the fallback is a perfectly good answer.
function WorldIcon({ slug, world }: { slug: string; world: World }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!world.hasIcon) {
      setSrc(null)
      return
    }
    let alive = true
    void worldIcon(slug, world.folder).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [slug, world.folder, world.hasIcon])

  if (!src) {
    return (
      <span className="grid size-10 shrink-0 place-items-center border border-solid border-line text-txt-dim">
        <Icon name="globe" size={18} />
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="size-10 shrink-0 border border-solid border-line object-cover [image-rendering:pixelated]"
    />
  )
}

// Singleplayer worlds, read straight out of each save's level.dat (worlds.rs),
// plus the "bundled" worlds a LOCAL pack ships (version.worlds) — the saves it
// installs first-time-only on every machine. The two are different things: an
// instance world is what THIS player built; a bundled world is what the pack
// author hands everyone. A local pack owner can promote one into the other.
//
// Deleting a world is the most destructive thing this launcher can do and there
// is no undo, so it takes a second click on a row that has armed itself rather
// than a single trash icon next to four harmless ones.

export function WorldsTab({
  slug,
  isLocal,
  onChanged,
}: {
  slug: string
  isLocal: boolean
  onChanged: () => void
}) {
  const t = useT("worlds")
  const tp = useT("packDetail")
  const [worlds, setWorlds] = useState<World[]>([])
  const [bundled, setBundled] = useState<BundledWorld[]>([])

  const MODE_LABEL: Record<World["gameMode"], string> = {
    survival: t("gameMode.survival"),
    creative: t("gameMode.creative"),
    adventure: t("gameMode.adventure"),
    spectator: t("gameMode.spectator"),
    unknown: t("gameMode.unknown"),
  }
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [confirmingBundled, setConfirmingBundled] = useState<string | null>(null)
  const [busyFolder, setBusyFolder] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  // The add-a-.zip flow: name the save folder first, then the native picker.
  const [addOpen, setAddOpen] = useState(false)
  const [folder, setFolder] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const refresh = () => {
    setNonce((n) => n + 1)
    onChanged()
  }

  useEffect(() => {
    let live = true
    setLoading(true)
    void Promise.all([
      instanceWorlds(slug),
      isLocal ? localPackGet(slug).then((m) => m?.version.worlds ?? []) : Promise.resolve([]),
    ]).then(([list, packed]) => {
      if (!live) return
      setWorlds(list)
      setBundled(packed as BundledWorld[])
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [slug, isLocal, nonce])

  // Disarm when the player looks away rather than leaving a primed delete
  // button sitting there for the rest of the session.
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(null), 5000)
    return () => clearTimeout(timer)
  }, [confirming])

  const bundledFolders = new Set(bundled.map((w) => w.folder.toLowerCase()))
  const installedFolders = new Set(worlds.map((w) => w.folder.toLowerCase()))

  const remove = async (world: World) => {
    setConfirming(null)
    try {
      await instanceDeletePath(slug, `saves/${world.folder}`)
      toast.success(t("deleteSuccess", { name: world.name }))
      setNonce((n) => n + 1)
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("deleteError"))
    }
  }

  const promote = async (world: World) => {
    setBusyFolder(world.folder)
    try {
      await localPackWorldPromote(slug, world.folder)
      toast.success(tp("promotedWorldSuccess"))
      refresh()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? tp("promotedWorldError"))
    } finally {
      setBusyFolder(null)
    }
  }

  const removeBundled = async (world: BundledWorld) => {
    setConfirmingBundled(null)
    try {
      await localPackWorldRemove(slug, world.folder)
      toast.success(tp("removedWorldSuccess"))
      refresh()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? tp("removedWorldError"))
    }
  }

  const submitAdd = async () => {
    const name = folder.trim()
    if (!name || /[/\\]/.test(name) || name === "." || name === "..") {
      setAddError(tp("worldFolderError"))
      return
    }
    if (bundledFolders.has(name.toLowerCase())) {
      setAddError(tp("worldFolderError"))
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const added = await localPackWorldAddZip(slug, name)
      if (added) {
        toast.success(tp("worldZipAddSuccess"))
        setAddOpen(false)
        setFolder("")
        refresh()
      }
    } catch (err) {
      setAddError((err as { message?: string })?.message ?? tp("worldZipAddError"))
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[0.6875rem] text-txt-dim">
        <Spinner size={12} /> {t("reading")}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Bundled in the pack (local packs can edit this) ─────────────── */}
      {(isLocal || bundled.length > 0) && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-txt">
              {tp("bundledWorldsSection")}
            </span>
            {isLocal && (
              <Button size="sm" icon="plus" onClick={() => setAddOpen(true)}>
                {tp("addBundledWorldButton")}
              </Button>
            )}
          </div>

          {bundled.length === 0 ? (
            <p className="font-mono text-[0.6875rem] text-txt-dim">{tp("bundledWorldsEmptyDetail")}</p>
          ) : (
            <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(17.5rem,1fr))]">
              {bundled.map((world) => {
                const installed = installedFolders.has(world.folder.toLowerCase())
                return (
                  <li
                    key={world.folder}
                    className="flex flex-col gap-2 border border-solid border-line bg-panel px-3 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="grid size-10 shrink-0 place-items-center border border-solid border-line text-txt-dim">
                        <Icon name="cube" size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[0.875rem] font-bold uppercase tracking-[0.03em]">
                          {world.folder}
                        </p>
                        <p className="truncate font-mono text-[0.6875rem] text-txt-dim">
                          {formatBytes(world.sizeBytes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone={installed ? "ok" : "info"}>
                        {installed ? tp("worldInstalledBadge") : tp("worldPendingBadge")}
                      </Badge>
                    </div>
                    {isLocal && (
                      <div className="mt-auto flex justify-end pt-1">
                        {confirmingBundled === world.folder ? (
                          <Button
                            size="sm"
                            variant="danger"
                            icon="trash"
                            onClick={() => void removeBundled(world)}
                          >
                            {t("confirmDelete")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            icon="trash"
                            onClick={() => setConfirmingBundled(world.folder)}
                          >
                            {t("deleteButton")}
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {/* ── This instance's own singleplayer worlds ────────────────────── */}
      <section className="flex flex-col gap-3">
        {worlds.length === 0 ? (
          <Empty icon="globe" title={t("noWorlds")} lead={t("noWorldsDetail")} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[0.6875rem] text-txt-dim">
                {t("worldCount", { count: worlds.length })} ·{" "}
                {formatBytes(worlds.reduce((sum, w) => sum + w.sizeBytes, 0))}
              </span>
              <Button size="sm" icon="external" onClick={() => void instanceReveal(slug, "saves")}>
                {t("openFolder")}
              </Button>
            </div>

            <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(17.5rem,1fr))]">
              {worlds.map((world) => {
                const alreadyBundled = bundledFolders.has(world.folder.toLowerCase())
                return (
                  <li
                    key={world.folder}
                    className="flex flex-col gap-2 border border-solid border-line bg-panel px-3 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <WorldIcon slug={slug} world={world} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[0.875rem] font-bold uppercase tracking-[0.03em]">
                          {world.name}
                        </p>
                        <p className="truncate font-mono text-[0.6875rem] text-txt-dim">
                          {world.folder}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone="info">{MODE_LABEL[world.gameMode]}</Badge>
                      {world.hardcore && <Badge tone="bad">{t("hardcore")}</Badge>}
                      {world.version && <Badge tone="ok">{world.version}</Badge>}
                    </div>

                    <p className="font-mono text-[0.6875rem] text-txt-dim">
                      {formatBytes(world.sizeBytes)} ·{" "}
                      {world.lastPlayed
                        ? formatWhen(new Date(world.lastPlayed).toISOString())
                        : t("neverPlayed")}
                    </p>

                    <div className="mt-auto flex items-center justify-end gap-2 pt-1">
                      {isLocal &&
                        (alreadyBundled ? (
                          <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">
                            {tp("alreadyBundled")}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            icon="plus"
                            loading={busyFolder === world.folder}
                            onClick={() => void promote(world)}
                          >
                            {tp("addBundledWorldFromInstanceButton")}
                          </Button>
                        ))}
                      {confirming === world.folder ? (
                        <Button
                          size="sm"
                          variant="danger"
                          icon="trash"
                          onClick={() => void remove(world)}
                        >
                          {t("confirmDelete")}
                        </Button>
                      ) : (
                        <Button size="sm" icon="trash" onClick={() => setConfirming(world.folder)}>
                          {t("deleteButton")}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={tp("addBundledWorldModalTitle")}>
        <div className="flex flex-col gap-4">
          <Field label={tp("worldFolderLabel")}>
            <Input
              value={folder}
              placeholder={tp("worldFolderPlaceholder")}
              onChange={(e) => setFolder(e.target.value)}
            />
          </Field>
          {addError && <p className="text-xs text-bad">{addError}</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setAddOpen(false)}>
              {tp("cancelButton")}
            </Button>
            <Button
              size="sm"
              variant="pri"
              loading={adding}
              disabled={!folder.trim()}
              onClick={() => void submitAdd()}
            >
              {tp("worldFolderConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
