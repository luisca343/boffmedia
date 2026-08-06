import { Badge, Button, Icon } from "@boffmedia/ui"
import { useT } from "../i18n"

import type { CrashDiagnosis as Diagnosis, CrashKind } from "../services/types"

// HANDOFF §9. The verdict comes from `src-tauri/src/install/crash.rs`; this only
// renders it. Deliberately NOT a Panel: it is embedded inside panels on two
// screens, and nesting panels reads as a bug.

export function CrashDiagnosisCard({
  diagnosis,
  className = "",
  onCopyReport,
}: {
  diagnosis: Diagnosis | null
  className?: string
  /** When provided, renders a "Copiar informe" action — the escalation path the
   *  text of both states points the player toward. */
  onCopyReport?: () => void
}) {
  const t = useT("crash")

  // Fallback to Rust-provided text when a translation key is missing.
  const loc = (k: string, fb: string): string => {
    const v = t(k)
    return v === `crash.${k}` || v === k ? fb : v
  }

  const getKindLabel = (kind: CrashKind): string => {
    const labels: Record<CrashKind, string> = {
      "missing-dependency": t("kind.missing-dependency"),
      "loader-mismatch": t("kind.loader-mismatch"),
      "mixin-failure": t("kind.mixin-failure"),
      "out-of-memory": t("kind.out-of-memory"),
      "wrong-java": t("kind.wrong-java"),
      "corrupt-mod-jar": t("kind.corrupt-mod-jar"),
      "duplicate-mod": t("kind.duplicate-mod"),
    }
    return labels[kind]
  }

  if (!diagnosis) {
    return (
      <div className={className}>
        <p className="text-sm text-txt-muted">
          {t("unrecognized")}
        </p>
        {onCopyReport && (
          <Button size="sm" icon="copy" className="mt-3" onClick={onCopyReport}>
            {t("copyReport")}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-sm border border-warn/40 bg-warn-soft p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon name="alert" className="mt-[2px] shrink-0 text-warn" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-txt">
              {loc(`${diagnosis.id}.title`, diagnosis.title)}
            </h3>
            <Badge tone="warn">{getKindLabel(diagnosis.kind)}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-txt-muted">{loc(`${diagnosis.id}.explanation`, diagnosis.explanation)}</p>
          <p className="mt-2 text-sm leading-relaxed text-txt">
            <span className="font-semibold">{t("whatToDo")}</span>
            {loc(`${diagnosis.id}.action`, diagnosis.action)}
          </p>
          {diagnosis.evidence.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer select-none text-xs text-txt-dim">
                {t("evidenceLabel", { count: diagnosis.evidence.length })}
              </summary>
              <pre className="mt-2 max-h-[140px] overflow-auto rounded-sm border border-line bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-txt-muted">
                {diagnosis.evidence.join("\n")}
              </pre>
            </details>
          )}
          {onCopyReport && (
            <Button size="sm" icon="copy" className="mt-3" onClick={onCopyReport}>
              {t("copyReport")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
