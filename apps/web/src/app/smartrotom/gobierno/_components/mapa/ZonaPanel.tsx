import { Avatar, Badge, Icon } from "../ui"
import { PARCELA_STATUS, TONES, ZONA_KINDS } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import type { Parcela, Zona } from "../../_types"

export function ZonaPanel({
  zona,
  members,
  onClose,
  onSelectPlot,
}: {
  zona: Zona
  members: Parcela[]
  onClose: () => void
  onSelectPlot: (p: Parcela) => void
}) {
  const kind = ZONA_KINDS[zona.kind]
  // The list endpoint enriches `parcelas`/`ocupadas` as aggregate counts; if a given
  // response omits them, the plots resolved on the map for this zona are the fallback.
  const total = zona.parcelas ?? members.length
  const occupied = zona.ocupadas ?? members.filter((p) => p.status === "ocupada").length
  const pct = total ? Math.round((occupied / total) * 100) : 0

  return (
    <div className="animate-gt-pop-scale motion-reduce:animate-none">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="urbanismo">{townName(zona.town)}</Badge>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha de la zona"
          className="rounded-gt-sm p-1 text-gt-ink-400 transition-colors hover:bg-gt-paper-2 hover:text-gt-ink-900"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-[11px]">
        {kind && (
          <div
            className={`grid h-11 w-11 flex-none place-items-center rounded-gt border ${TONES[kind.tone].softBorder} ${TONES[kind.tone].softBg}`}
          >
            <Icon name={kind.icon} size={22} className={TONES[kind.tone].text} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-gt-display text-[21px] leading-tight text-gt-ink-900">{zona.name}</h2>
          <div className="mt-1 flex items-center gap-1.5">
            {kind && <Badge>{kind.label}</Badge>}
            <span className="font-gt-mono text-[10px] text-gt-ink-300">#{zona.id}</span>
          </div>
        </div>
      </div>

      <p className="mb-3.5 text-[12.5px] leading-relaxed text-gt-ink-600">{zona.description || kind?.desc}</p>

      <div className="mb-3.5 rounded-gt-sm border border-gt-line bg-gt-paper-2 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-gt-mono text-[9px] uppercase tracking-[.12em] text-gt-ink-400">Ocupación</span>
          <span className="font-gt-mono text-[12px] font-bold tabular-nums text-gt-ink-800">
            {occupied}/{total} · {pct}%
          </span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-[4px] bg-gt-paper-3">
          <div
            className={`h-full ${kind ? TONES[kind.tone].solidBg : TONES.urbanismo.solidBg}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mb-2 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
        Parcelas de la zona
      </div>
      {members.length === 0 ? (
        <div className="text-[12.5px] italic text-gt-ink-400">Sin parcelas resueltas para esta zona en el mapa.</div>
      ) : (
        <div className="grid gap-[7px]">
          {members.map((p) => (
            <button
              key={p.regionId}
              type="button"
              onClick={() => onSelectPlot(p)}
              className="flex w-full items-center gap-[10px] rounded-gt border border-gt-line bg-gt-paper-0 px-[11px] py-[9px] text-left shadow-gt-sm transition-colors hover:bg-gt-paper-1"
            >
              <span className="flex-none font-gt-display text-[15px] font-bold text-gt-ink-900">#{p.number}</span>
              {p.owner ? (
                <>
                  <Avatar user={p.owner.username} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gt-ink-800">
                    {p.owner.username}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-[12.5px] italic text-gt-ink-400">vacante</span>
              )}
              <Badge tone={PARCELA_STATUS[p.status]?.tone ?? "default"}>
                {PARCELA_STATUS[p.status]?.label ?? p.status}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
