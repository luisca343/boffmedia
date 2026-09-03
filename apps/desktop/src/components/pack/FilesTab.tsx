import { useEffect, useState } from "react"

import { Button, Empty, Icon, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  type DirEntry,
  instanceBrowse,
  instanceDeletePath,
  instanceModGraph,
  instanceReveal,
} from "../../runtime"
import type { ModGraph } from "../../services/types"
import { formatBytes, formatWhen } from "../../utils/format"

// A plain browser over the instance's game directory.
//
// Every path here is RELATIVE to `.minecraft` and stays that way across the IPC
// boundary; the Rust side resolves it through `safe_join`. The renderer never
// holds or sends an absolute path, which is what keeps a crafted `../../` from
// turning this into a delete-anything tool.

export function FilesTab({ slug }: { slug: string }) {
  const t = useT("files")
  const [rel, setRel] = useState("")
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)
  // Only in `mods/`: the graph is about jars, and asking for it while the player
  // browses `saves/` would be a scan of fifty archives to annotate nothing.
  const [graph, setGraph] = useState<ModGraph | null>(null)

  useEffect(() => {
    if (rel !== "mods") {
      setGraph(null)
      return
    }
    let live = true
    void instanceModGraph(slug).then((g) => {
      if (live) setGraph(g)
    })
    return () => {
      live = false
    }
  }, [slug, rel, nonce])

  useEffect(() => {
    let live = true
    setLoading(true)
    void instanceBrowse(slug, rel)
      .catch(() => [] as DirEntry[])
      .then((list) => {
        if (!live) return
        setEntries(list)
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [slug, rel, nonce])

  const segments = rel ? rel.split("/").filter(Boolean) : []

  /** Files that would break without `path`, as bare filenames. Reads the
   *  precomputed reverse map rather than walking edges — every question on this
   *  screen runs in that direction. */
  const dependentsOf = (path: string): string[] =>
    (graph?.dependents[path] ?? []).map((p) => p.split("/").pop() ?? p)

  const remove = async (entry: DirEntry) => {
    try {
      await instanceDeletePath(slug, entry.path)
      toast.success(t("deleteSuccess", { name: entry.name }))
      setNonce((n) => n + 1)
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("deleteError"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Breadcrumbs double as the only way back up — there is no ".." row,
            which would sort unpredictably among real folders. */}
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 font-mono text-[0.75rem]">
          <button
            type="button"
            onClick={() => setRel("")}
            className={rel === "" ? "text-txt" : "text-txt-dim hover:text-txt"}
          >
            .minecraft
          </button>
          {segments.map((segment, index) => {
            const target = segments.slice(0, index + 1).join("/")
            const last = index === segments.length - 1
            return (
              <span key={target} className="flex items-center gap-1">
                <span className="text-txt-dim">/</span>
                <button
                  type="button"
                  onClick={() => setRel(target)}
                  className={last ? "text-txt" : "text-txt-dim hover:text-txt"}
                >
                  {segment}
                </button>
              </span>
            )
          })}
        </nav>
        <Button
          size="sm"
          icon="external"
          onClick={() => {
            void instanceReveal(slug, rel).catch((err) =>
              toast.error((err as { message?: string })?.message ?? t("openError")),
            )
          }}
        >
          {t("openFolder")}
        </Button>
      </div>

      {loading ? (
        <span className="flex items-center gap-2 py-6 font-mono text-[0.6875rem] text-txt-dim">
          <Spinner size={12} /> {t("reading")}
        </span>
      ) : entries.length === 0 ? (
        <Empty
          icon="folder"
          title={t("emptyFolder")}
          lead={rel === "" ? t("emptyNotInstalled") : t("emptyDefault")}
        />
      ) : (
        <ul className="flex flex-col">
          {entries.map((entry) => (
            <li
              key={entry.path}
              className="flex items-center gap-3 border-b border-solid border-line px-3 py-2 hover:bg-panel-2"
            >
              <Icon
                name={entry.isDir ? "folder" : "code"}
                size={16}
                className={entry.isDir ? "text-accent-bright" : "text-txt-dim"}
              />
              {entry.isDir ? (
                <button
                  type="button"
                  onClick={() => setRel(entry.path)}
                  className="min-w-0 flex-1 truncate text-left font-mono text-[0.75rem] text-txt hover:text-accent-bright"
                >
                  {entry.name}
                </button>
              ) : (
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="truncate font-mono text-[0.75rem] text-txt-muted">
                    {entry.name}
                  </span>
                  {/* The answer to "why is this 7 MB Kotlin jar here, and can I
                      delete it?" — the question the delete button next to it
                      invites and nothing else on this screen answers. */}
                  {dependentsOf(entry.path).length > 0 && (
                    <span className="truncate font-mono text-[0.625rem] uppercase tracking-[0.06em] text-txt-dim">
                      {t("neededBy", { names: dependentsOf(entry.path).join(", ") })}
                    </span>
                  )}
                </span>
              )}
              <span className="hidden w-[6.875rem] shrink-0 text-right font-mono text-[0.6875rem] text-txt-dim sm:block">
                {entry.isDir ? "—" : formatBytes(entry.size)}
              </span>
              <span className="hidden w-[9.375rem] shrink-0 text-right font-mono text-[0.6875rem] text-txt-dim md:block">
                {entry.modified ? formatWhen(new Date(entry.modified).toISOString()) : "—"}
              </span>
              <button
                type="button"
                aria-label={t("deleteAriaLabel", { name: entry.name })}
                title={t("deleteTitle")}
                onClick={() => void remove(entry)}
                className="shrink-0 p-1 text-txt-dim hover:text-bad"
              >
                <Icon name="trash" size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
