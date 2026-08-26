import { useEffect, useState } from "react"

import {
  Banner,
  Button,
  OptionalGroupsEditor,
  Spinner,
  toast,
  type EditableFile,
} from "@boffmedia/ui"

import { SectionHeader } from "../SectionHeader"
import { useT } from "../../i18n"
import { instanceModGraph, localPackGet } from "../../runtime"
import { optionalGroupProblems, saveOptionalGroups } from "../../services/localPackEdit"
import type { ModGraph, OptionalGroup } from "../../services/types"

// Authoring the optional catalogue, as a page of its own rather than a block
// inside the Content tab.
//
// It takes over the whole view for the same reason BrowsePage does: the form is
// three levels deep — groups hold options, options hold a scrolling file picker
// — and every one of those levels needs width. Squeezed into a column beside a
// 200-row file inventory it was unreadable, and a modal would be worse: the
// picker's own scroller nested inside a dialog's scroller is two scrollbars for
// one list, and the author cannot see the pack's file list while choosing from
// it.
//
// The panel it came from keeps the CHOOSER and nothing else, which is the split
// that was always implied: the chooser is what a player does with the pack, this
// is what an author does to it.

/** What is being edited: the authored catalogue plus the file list its `env`
 *  rewrites land in. Held together because they are saved together — rule 2
 *  requires every path a feature claims to be `env.client: "optional"`, so a
 *  save that carried only one half produces a manifest Rust refuses. */
type Draft = { groups: OptionalGroup[]; files: EditableFile[] }

export function OptionalEditorPage({
  slug,
  onBack,
  onSaved,
}: {
  slug: string
  onBack: () => void
  /** Called after a successful write, before the page closes. The caller
   *  re-reads the pack: every save mints a new version id, so the instance on
   *  disk is outdated the moment this returns. */
  onSaved: () => void
}) {
  const t = useT("content")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [graph, setGraph] = useState<ModGraph | null>(null)

  /** Opens on the manifest, NOT on the resolved model.
   *
   *  The resolved model carries one player's on/off state and, on a pack that
   *  has any unclaimed optional files, a synthesised `otros` group whose id is
   *  reserved and cannot be saved. The authored catalogue is the only thing on
   *  disk that is the author's to change. */
  useEffect(() => {
    let live = true
    void (async () => {
      const manifest = await localPackGet(slug).catch(() => null)
      if (!live) return
      // `preferManifest`, matching the rest of this page: the author is editing
      // the manifest, so the features the graph resolves paths against must come
      // from that document and not from the last install's marker.
      void instanceModGraph(slug, manifest ?? undefined, true).then((g) => {
        if (live) setGraph(g)
      })
      if (!manifest) {
        setFailed(true)
        return
      }
      const version = (manifest.version ?? {}) as {
        optionalGroups?: unknown[]
        files?: Array<{ path: string; env?: { client?: string; server?: string } | null }>
      }
      setDraft({
        // Cast for the same reason apps/web casts: the editor's prop type is the
        // RESOLVED view and the document holds only the authored subset. The
        // view-only fields are placeholders while editing and are stripped again
        // by `saveOptionalGroups`.
        groups: (version.optionalGroups ?? []) as OptionalGroup[],
        files: (version.files ?? []).map((f) => ({ path: f.path, env: f.env })),
      })
    })()
    return () => {
      live = false
    }
  }, [slug])

  const save = async () => {
    if (!draft) return
    const problems = optionalGroupProblems(draft.groups, t)
    if (problems.length > 0) {
      // The first one only. The list comes out in document order, so the first
      // is the one nearest the top of the form the author is looking at, and a
      // stack of five toasts for one half-typed group is noise.
      toast.error(problems[0])
      return
    }
    setSaving(true)
    try {
      await saveOptionalGroups(slug, draft.groups, draft.files)
      toast.success(t("optionalEditor.saved"))
      onSaved()
      onBack()
    } catch (err) {
      // The nine `validate_optional` rules live in Rust and their message is the
      // only account of which one failed, so it is surfaced verbatim rather than
      // replaced with a generic "could not save".
      toast.error((err as { message?: string })?.message ?? t("optionalEditor.saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    // h-full so the page is exactly the shell's height and the form owns its own
    // scroll — the file pickers inside are `max-h` scrollers, and they only
    // behave when their ancestor is not free to grow.
    <div className="flex h-full flex-col px-8 py-7">
      <SectionHeader
        label={t("optionalEditor.backToPack")}
        onBack={onBack}
        title={t("optionalEditor.pageTitle")}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={onBack} disabled={saving}>
              {t("optionalEditor.cancel")}
            </Button>
            <Button variant="pri" size="sm" icon="check" onClick={() => void save()} disabled={saving || !draft}>
              {saving ? t("optionalEditor.saving") : t("optionalEditor.save")}
            </Button>
          </>
        }
      />

      {/* Stated once, at the top, rather than repeated per group: every save
          bumps the version id, so this is true of the whole page and not of any
          one thing on it. */}
      <Banner tone="info" className="mb-4">
        {t("optionalEditor.applyHint")}
      </Banner>

      <p className="mb-4 max-w-[86ch] text-[12px] leading-snug text-txt-muted">
        {t("optionalEditor.lead")}
      </p>

      <div className="bm-scroll min-h-0 flex-1 overflow-auto">
        {failed ? (
          <Banner tone="error">{t("optionalEditor.loadError")}</Banner>
        ) : draft === null ? (
          <div role="status" className="flex items-center gap-2 py-4 text-txt-muted">
            <Spinner /> {t("loading")}
          </div>
        ) : (
          <OptionalGroupsEditor
            groups={draft.groups}
            // The one check the editor cannot derive from the document it edits:
            // a hard dependency lives INSIDE a jar. Iris requires Sodium, and if
            // the author has made Sodium its own switch with no `requires`, the
            // only place that fact exists is the jar's own metadata.
            missingRequires={graph?.missingRequires ?? []}
            onChange={(next) => setDraft((d) => (d ? { ...d, groups: next } : d))}
            files={draft.files}
            // Passed where apps/web deliberately omits it. That form assembles
            // its files[] at submit and derives `env` there; a local pack's
            // manifest is the live document with no submit, so the rewritten
            // `env` has to be carried here to reach the same save.
            onFilesChange={(next) => setDraft((d) => (d ? { ...d, files: next } : d))}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
