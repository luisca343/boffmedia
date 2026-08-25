import { useEffect, useState } from "react"

import { Badge, Button, Modal, Spinner, toast } from "@boffmedia/ui"

import { useT } from "../../i18n"
import { packPublish, packPublishPlan } from "../../runtime"
import type { PublishPlan } from "../../services/types"
import { formatBytes } from "../../utils/format"

// The publish screen: a preflight, then two buttons.
//
// A preflight and not a progress bar, because everything worth knowing here is
// knowable BEFORE anything moves. The launcher runs the same zod-derived schema
// the API runs, so an invalid pack fails instantly, in Spanish, on the machine
// that can fix it — rather than as a 400 after a multi-megabyte upload. And the
// blob store is content-addressed, so "how much is actually about to be sent" is
// a real number rather than the size of the pack.
//
// Two buttons, because creating a version and making it the one every player
// downloads are different decisions. A draft is stored and invisible to every
// launcher until somebody says otherwise, which is the reviewable path and the
// safer default.

export function PublishDialog({
  slug,
  open,
  onClose,
  onPublished,
}: {
  slug: string
  open: boolean
  onClose: () => void
  onPublished?: () => void
}) {
  const t = useT("publish")
  const [plan, setPlan] = useState<PublishPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    let live = true
    setLoading(true)
    setPlan(null)
    void packPublishPlan(slug)
      .then((next) => {
        if (live) setPlan(next)
      })
      .catch((err: { message?: string }) => {
        if (live) toast.error(err?.message ?? t("planError"))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [slug, open, t])

  const run = async (publish: boolean) => {
    setBusy(true)
    try {
      const result = await packPublish(slug, publish)
      toast.success(
        result.published
          ? t("publishedToast", { name: plan?.packName ?? slug })
          : t("draftToast", { name: plan?.packName ?? slug }),
      )
      onPublished?.()
      onClose()
    } catch (err) {
      toast.error((err as { message?: string })?.message ?? t("publishError"))
    } finally {
      setBusy(false)
    }
  }

  const blocked = !plan || plan.errors.length > 0

  return (
    <Modal open={open} onClose={onClose} title={t("title")}>
      {loading ? (
        <div role="status" className="flex items-center gap-2 py-6 text-txt-muted">
          <Spinner /> {t("checking")}
        </div>
      ) : !plan ? (
        <p className="py-6 text-txt-muted">{t("planError")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Errors first and alone: when the manifest will not validate there
              is nothing useful to say about upload sizes, and listing them
              anyway invites the author to fix the wrong thing. */}
          {plan.errors.length > 0 ? (
            <section
              role="alert"
              className="flex flex-col gap-2 border border-solid border-bad bg-panel-2 p-3"
            >
              <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-bad">
                {t("invalidTitle")}
              </h3>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-txt-muted">
                {plan.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          ) : (
            <>
              <dl className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <Row label={t("pack")} value={plan.packName} />
                <Row label={t("version")} value={plan.versionName} />
                <Row label={t("files")} value={String(plan.fileCount)} />
                <Row
                  label={t("optionalFeatures")}
                  value={String(plan.optionalFeatureCount)}
                />
                {/* The number that surprises people, in a good way: the server
                    is content-addressed, so a republish of a 2 GB pack usually
                    sends a few kilobytes of changed configs. */}
                <Row
                  label={t("upload")}
                  value={
                    plan.missingBlobs.length === 0
                      ? t("nothingToUpload")
                      : t("uploadValue", {
                          count: plan.missingBlobs.length,
                          size: formatBytes(plan.uploadBytes),
                        })
                  }
                />
                <Row
                  label={t("target")}
                  value={plan.existingPackId ? t("targetExisting") : t("targetNew")}
                />
              </dl>

              {plan.warnings.length > 0 && (
                <section className="flex flex-col gap-2 border border-solid border-line bg-panel-2 p-3">
                  <h3 className="flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-[0.06em]">
                    {t("warningsTitle")}
                    <Badge tone="warn">{plan.warnings.length}</Badge>
                  </h3>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-txt-muted">
                    {plan.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </section>
              )}

              {!plan.hasIcon && (
                <p className="text-[12px] leading-snug text-txt-muted">{t("noIcon")}</p>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              {t("cancel")}
            </Button>
            <span className="ml-auto flex items-center gap-2">
              <Button disabled={blocked || busy} loading={busy} onClick={() => void run(false)}>
                {t("saveDraft")}
              </Button>
              <Button
                variant="pri"
                icon="upload"
                disabled={blocked || busy}
                loading={busy}
                onClick={() => void run(true)}
              >
                {t("publish")}
              </Button>
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border border-solid border-line bg-panel px-3 py-2">
      <dt className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-txt-muted">
        {label}
      </dt>
      <dd className="ml-auto truncate font-mono text-[12px] text-txt">{value}</dd>
    </div>
  )
}
