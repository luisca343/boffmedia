import { useCallback, useEffect, useState } from "react"

import { Banner, Button, Empty, OptionalChooser, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import {
  instanceFeatureSet,
  instanceInstallFiles,
  instanceOptionalModel,
  localPackGet,
  packManifest,
  packManifestCached,
} from "../../runtime"
import type { OptionalGroup } from "../../services/types"
import { formatBytes } from "../../utils/format"

// The player's optional-content chooser, wired to the instance — and, for a
// local pack, the AUTHORING form for the same catalogue behind an edit toggle.
//
// The chooser itself is `@boffmedia/ui`'s and knows nothing about Tauri, so the
// same component renders a pack's public page read-only. What lives here is the
// three things only the launcher can do: read the model off the marker, hand a
// toggle to Rust, and fetch what a newly-enabled feature is missing.
//
// State comes back WHOLE from every toggle and replaces what was there. Patching
// the one row optimistically would be wrong often enough to matter: a radio
// group turns its siblings off, and `requires` pulls dependencies on or takes
// dependents down, so one click routinely moves three rows.
//
// The AUTHORING form is a page of its own (`OptionalEditorPage`), reached from
// the button here. Not layout taste: the chooser reads the MARKER — the
// catalogue of the version on disk — while the editor reads the MANIFEST, so an
// unapplied edit makes the two disagree by construction. Keeping them on
// separate screens means the author never watches their own edit fail to appear
// next to itself; the pending banner is what carries that fact instead.

/** The manifest the panel should read a model out of.
 *
 *  Two different documents, for two different questions:
 *
 *  - **Installed**: the CACHED manifest, not a fresh registry fetch. The files a
 *    feature is missing are the ones its own version declares, and `latest` may
 *    already be a different version whose paths and hashes have moved. It also
 *    costs no network, which matters on a screen the player can open offline.
 *  - **Pre-install**: the registry's latest, because that is the version the
 *    Install button is about to fetch. A password-gated pack throws here; the
 *    panel then renders nothing, which is right — the player has not proved
 *    access, so they are not entitled to see what the pack contains.
 *
 *  The version id comes out of the same document either way, so the interlock in
 *  `instance_install_files` — the marker must still be at that version — is
 *  checked against the exact manifest the paths were read from. */
async function manifestFor(
  slug: string,
  packId: string,
  isLocal: boolean,
  preInstall: boolean,
): Promise<{ manifest: unknown; versionId: string | null } | null> {
  const manifest = isLocal
    ? await localPackGet(slug).catch(() => null)
    : preInstall
      ? await packManifest(packId).catch(() => null)
      : await packManifestCached(slug).catch(() => null)
  if (!manifest) return null
  const versionId = (manifest as { version?: { id?: unknown } })?.version?.id
  return { manifest, versionId: typeof versionId === "string" ? versionId : null }
}

export function OptionalPanel({
  slug,
  packId,
  isLocal,
  preInstall = false,
  pendingInstall = false,
  refreshKey = 0,
  onChanged,
  onEdit,
  layout = "stack",
}: {
  slug: string
  packId: string
  isLocal: boolean
  /** Render the chooser BEFORE the first install, from the manifest rather than
   *  from a marker there is none of yet.
   *
   *  Choosing here is worth more than choosing later: the install pass reads the
   *  state this writes and never fetches what was declined, so an unwanted
   *  400 MB shaderpack costs nothing at all rather than being downloaded and
   *  then parked. */
  preInstall?: boolean
  /** The pack is installed at a version older than the manifest's, so the
   *  catalogue the chooser is showing came off a marker that predates the last
   *  edit. Passed in rather than derived: the install state is already computed
   *  by `instance_scan` for the whole page, and a second opinion here would be a
   *  second thing to get wrong. */
  pendingInstall?: boolean
  refreshKey?: number
  onChanged?: () => void
  /** Open the authoring page. Local packs only — the caller is what owns the
   *  page swap, the same way it owns BrowsePage's. Absent means "this surface
   *  cannot author", which is what the pre-install preview wants: the player is
   *  deciding what to download, not editing the pack. */
  onEdit?: () => void
  /** `grid` on the tab that owns the page, `stack` everywhere else. */
  layout?: "stack" | "grid"
}) {
  const t = useT("content")
  const [groups, setGroups] = useState<OptionalGroup[] | null>(null)
  const [source, setSource] = useState<{ manifest: unknown; versionId: string | null } | null>(null)
  const [busy, setBusy] = useState<string[]>([])
  const [deferred, setDeferred] = useState<string[]>([])

  // A LOCAL pack answers out of its MANIFEST, not out of the install marker.
  //
  // The marker records the catalogue of the last install; on a managed pack that
  // is also the only catalogue anyone can have, so the two never disagree in a
  // way the player could act on. On a local pack the author edits the manifest
  // directly, and the marker then lags by exactly one install — which is how
  // "I saved three groups and only the first one shows" happens, with nothing on
  // screen accounting for the other two.
  //
  // The cost is that this view goes read-only while the two disagree, because
  // toggling still resolves against the marker and a feature it has never heard
  // of cannot be switched. That is the honest trade: showing the author their
  // own document, and saying plainly that it is not on disk yet, beats showing
  // them a stale catalogue with no explanation.
  const authored = isLocal && !preInstall

  useEffect(() => {
    let live = true
    void (async () => {
      // Loaded up front only when the model needs it. On a MANAGED pack past
      // install the marker answers everything, and fetching a manifest to render
      // a list already on disk would be a round trip for nothing — it is fetched
      // lazily there, when a toggle actually needs files.
      const next =
        preInstall || authored ? await manifestFor(slug, packId, isLocal, preInstall) : null
      if (!live) return
      setSource(next)
      const model = await instanceOptionalModel(slug, next?.manifest, authored)
      if (live) setGroups(model)
    })()
    return () => {
      live = false
    }
  }, [slug, packId, isLocal, preInstall, authored, refreshKey])

  const toggle = useCallback(
    async (featureId: string, enabled: boolean) => {
      setBusy((b) => [...b, featureId])
      try {
        const result = await instanceFeatureSet(slug, featureId, enabled, source?.manifest)
        setGroups(result.groups)

        // D3: the choice is stored either way. Saying so is the whole point —
        // silently losing the edit is the outcome the deferral exists to avoid.
        setDeferred((d) =>
          result.deferred
            ? [...new Set([...d, ...result.changed])]
            : d.filter((id) => !result.changed.includes(id)),
        )
        if (result.deferred) toast.info(t("optionalDeferredToast"))

        // A feature declined at install time has no bytes on disk, so the first
        // time a player opts in there is nothing to un-park. Fetch through the
        // add-a-mod path, which already carries the marker interlock and emits
        // the per-row progress events the Content tab renders.
        if (result.missing.length > 0) {
          const fetchFrom = source ?? (await manifestFor(slug, packId, isLocal, false))
          if (fetchFrom) {
            toast.info(t("optionalDownloading", { count: result.missing.length }))
            const ok = await instanceInstallFiles(
              slug,
              fetchFrom.manifest,
              result.missing,
              fetchFrom.versionId,
            )
            // False is not an error: it means the shortcut declined, and a
            // normal Install/Play finishes the job. Refresh either way so
            // `installed` reflects whatever actually landed.
            if (ok) setGroups(await instanceOptionalModel(slug, source?.manifest, authored))
          }
        }
        onChanged?.()
      } catch (err) {
        toast.error((err as { message?: string })?.message ?? t("toggleError"))
        // Re-read rather than roll back: the Rust side may have applied part of
        // a multi-feature change before failing, and guessing which part would
        // put the UI and the disk out of step.
        setGroups(await instanceOptionalModel(slug, source?.manifest, authored))
      } finally {
        setBusy((b) => b.filter((id) => id !== featureId))
      }
    },
    [slug, packId, isLocal, authored, source, onChanged, t],
  )

  if (groups === null) {
    // `role="status"` so the wait is announced rather than being a silent gap
    // between "I opened the tab" and "content appeared".
    return (
      <div role="status" className="flex items-center gap-2 px-3 py-4 text-txt-muted">
        <Spinner /> {t("loading")}
      </div>
    )
  }
  // Nothing at all rather than an empty state, unless this surface can DO
  // something about it. "This pack offers no optional content" is a sentence
  // worth reading only next to the button that changes it; anywhere else it is
  // an empty box where the player expected either a choice or silence.
  //
  // Keyed on `onEdit` and not on `isLocal`, because a local pack has two of
  // these on screen — the authoring surface on the Options tab and the
  // pre-install preview on Info — and only the first of them is a door.
  if (groups.length === 0 && !onEdit) return null

  return (
    <section
      // A toggle can move three rows at once, so the whole region is marked busy
      // rather than the row that was clicked — which is not necessarily the only
      // one about to change.
      aria-busy={busy.length > 0}
      className="flex flex-col gap-4"
    >
      <header className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h2 className="font-display text-[14px] font-bold uppercase tracking-[0.06em]">
            {t("optionalTitle")}
          </h2>
          <p className="text-[12px] leading-snug text-txt-muted">{t("optionalSubtitle")}</p>
        </div>

        {onEdit && (
          <Button variant="ghost" size="sm" icon="edit" onClick={onEdit}>
            {groups.length === 0 ? t("optionalEditor.define") : t("optionalEditor.edit")}
          </Button>
        )}
      </header>

      {pendingInstall && (
        <Banner tone="warn">
          {authored ? t("optionalEditor.pendingAuthored") : t("optionalEditor.pending")}
        </Banner>
      )}

      {groups.length === 0 ? (
        // Only reachable on a local pack (managed ones returned null above), so
        // the empty state can say the one thing that is actionable here.
        <Empty
          icon="layers"
          title={t("optionalEditor.emptyTitle")}
          lead={t("optionalEditor.emptyDesc")}
        />
      ) : (
        <OptionalChooser
          groups={groups}
          onToggle={(id, enabled) => void toggle(id, enabled)}
          busy={busy}
          deferred={deferred}
          layout={layout}
          // The catalogue on screen is the author's document and the marker has
          // not caught up, so `instance_feature_set` — which resolves against
          // the marker — cannot honour a click on it. Read-only says that,
          // where a switch that silently fails would not.
          readOnly={authored && pendingInstall}
          t={t}
          formatSize={formatBytes}
        />
      )}
    </section>
  )
}
