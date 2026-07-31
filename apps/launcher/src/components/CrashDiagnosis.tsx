import { Badge, Icon } from "@boffmedia/ui"

import type { CrashDiagnosis as Diagnosis, CrashKind } from "../services/types"

// HANDOFF §9. The verdict comes from `src-tauri/src/install/crash.rs`; this only
// renders it. Deliberately NOT a Panel: it is embedded inside panels on two
// screens, and nesting panels reads as a bug.

const KIND_LABEL: Record<CrashKind, string> = {
  "missing-dependency": "Falta un mod",
  "loader-mismatch": "Versiones incompatibles",
  "mixin-failure": "Conflicto entre mods",
  "out-of-memory": "Memoria insuficiente",
  "wrong-java": "Java incorrecto",
  "corrupt-mod-jar": "Archivo dañado",
  "duplicate-mod": "Mod duplicado",
}

export function CrashDiagnosisCard({
  diagnosis,
  className = "",
}: {
  diagnosis: Diagnosis | null
  className?: string
}) {
  if (!diagnosis) {
    return (
      <p className={`text-sm text-txt-muted ${className}`}>
        No se ha reconocido la causa del cierre. Revisa el registro completo y, si se repite,
        cópialo y pásaselo al equipo del pack.
      </p>
    )
  }

  return (
    <div className={`rounded-sm border border-warn/40 bg-warn-soft p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon name="alert" className="mt-[2px] shrink-0 text-warn" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-txt">
              {diagnosis.title}
            </h3>
            <Badge tone="warn">{KIND_LABEL[diagnosis.kind]}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-txt-muted">{diagnosis.explanation}</p>
          <p className="mt-2 text-sm leading-relaxed text-txt">
            <span className="font-semibold">Qué hacer: </span>
            {diagnosis.action}
          </p>
          {diagnosis.evidence.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer select-none text-xs text-txt-dim">
                Líneas del registro que lo indican ({diagnosis.evidence.length})
              </summary>
              <pre className="mt-2 max-h-[140px] overflow-auto rounded-sm border border-line bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-txt-muted">
                {diagnosis.evidence.join("\n")}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
