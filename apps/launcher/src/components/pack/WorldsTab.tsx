import { useEffect, useState } from "react"

import { Badge, Button, Empty, Icon, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { type World, instanceDeletePath, instanceReveal, instanceWorlds } from "../../runtime"
import { formatBytes, formatWhen } from "../../utils/format"

// Singleplayer worlds, read straight out of each save's level.dat (worlds.rs).
//
// Deleting a world is the most destructive thing this launcher can do and there
// is no undo, so it takes a second click on a row that has armed itself rather
// than a single trash icon next to four harmless ones.

export function WorldsTab({ slug }: { slug: string }) {
  const t = useT("worlds")
  const [worlds, setWorlds] = useState<World[]>([])

  const MODE_LABEL: Record<World["gameMode"], string> = {
    survival: t("gameMode.survival"),
    creative: t("gameMode.creative"),
    adventure: t("gameMode.adventure"),
    spectator: t("gameMode.spectator"),
    unknown: t("gameMode.unknown"),
  }
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let live = true
    setLoading(true)
    void instanceWorlds(slug).then((list) => {
      if (!live) return
      setWorlds(list)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [slug, nonce])

  // Disarm when the player looks away rather than leaving a primed delete
  // button sitting there for the rest of the session.
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(null), 5000)
    return () => clearTimeout(timer)
  }, [confirming])

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

  if (loading) {
    return (
      <span className="flex items-center gap-2 py-6 font-mono text-[11px] text-txt-dim">
        <Spinner size={12} /> {t("reading")}
      </span>
    )
  }

  if (worlds.length === 0) {
    return (
      <Empty
        icon="globe"
        title={t("noWorlds")}
        lead={t("noWorldsDetail")}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-txt-dim">
          {t("worldCount", { count: worlds.length })} ·{" "}
          {formatBytes(worlds.reduce((sum, w) => sum + w.sizeBytes, 0))}
        </span>
        <Button size="sm" icon="external" onClick={() => void instanceReveal(slug, "saves")}>
          {t("openFolder")}
        </Button>
      </div>

      <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
        {worlds.map((world) => (
          <li
            key={world.folder}
            className="flex flex-col gap-2 border border-solid border-line bg-panel px-3 py-3"
          >
            <div className="flex items-start gap-2">
              <span className="grid size-10 shrink-0 place-items-center border border-solid border-line text-txt-dim">
                <Icon name="globe" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14px] font-bold uppercase tracking-[0.03em]">
                  {world.name}
                </p>
                <p className="truncate font-mono text-[11px] text-txt-dim">{world.folder}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <Badge tone="info">{MODE_LABEL[world.gameMode]}</Badge>
              {world.hardcore && <Badge tone="bad">{t("hardcore")}</Badge>}
              {world.version && <Badge tone="ok">{world.version}</Badge>}
            </div>

            <p className="font-mono text-[11px] text-txt-dim">
              {formatBytes(world.sizeBytes)} ·{" "}
              {world.lastPlayed
                ? formatWhen(new Date(world.lastPlayed).toISOString())
                : t("neverPlayed")}
            </p>

            <div className="mt-auto flex justify-end pt-1">
              {confirming === world.folder ? (
                <Button size="sm" variant="danger" icon="trash" onClick={() => void remove(world)}>
                  {t("confirmDelete")}
                </Button>
              ) : (
                <Button size="sm" icon="trash" onClick={() => setConfirming(world.folder)}>
                  {t("deleteButton")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
