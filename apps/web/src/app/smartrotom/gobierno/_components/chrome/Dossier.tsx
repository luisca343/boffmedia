"use client"

import { createPortal } from "react-dom"
import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Icon, Sunken, ThemedLayer, Skeleton } from "../ui"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useCiudadano, useBuscados, useDenuncias, useMultas } from "../../_hooks/queries"
import { STANDING, MULTA_STATUS, BUSCADO_STATUS, DENUNCIA_STATUS } from "../../_utils/tones"
import { fmtDate, money, townName } from "../../_utils/format"
import { useFormat } from "@/lib/useFormat"

/**
 * The citizen dossier: everything the government knows about one person, opened by clicking
 * any name anywhere in the app. It is assembled at read time from the four registers —
 * there is no dossier table, and there should not be one.
 */
export function Dossier() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const uuid = useGobiernoUi((s) => s.dossier)
  const close = useGobiernoUi((s) => s.closeDossier)

  const { data: citizen, isLoading } = useCiudadano(uuid)
  const { data: multas } = useMultas(uuid ? { player: uuid, pageSize: 5 } : undefined)
  const { data: denuncias } = useDenuncias(uuid ? { accused: uuid, pageSize: 5 } : undefined)
  const { data: buscados } = useBuscados(uuid ? { player: uuid, pageSize: 3 } : undefined)

  useEffect(() => {
    if (!uuid) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [uuid, close])

  if (!uuid || typeof document === "undefined") return null

  const standingMeta = citizen ? STANDING[citizen.standing] : null
  const standing = standingMeta ? { label: t(standingMeta.labelKey), tone: standingMeta.tone } : null
  const activeBounty = buscados?.items.find((b) => b.status === "active")

  return createPortal(
    <ThemedLayer>
      <div className="fixed inset-0 z-[120] flex justify-end">
        <div className="absolute inset-0 bg-gt-ink-900/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label={t("dossier.ariaDialog")}
          className="gt-scroll relative flex w-full max-w-[420px] animate-gt-pop flex-col overflow-y-auto border-l border-gt-line-strong bg-gt-paper-0 shadow-gt-lg motion-reduce:animate-none"
        >
          {/* the identity card at the top of every file */}
          <div className="gt-edge-gold sticky top-0 z-10 border-b border-gt-line bg-gradient-to-b from-[#fbf7ec] to-[#f4eedf] px-5 pb-4 pt-5">
            <button
              type="button"
              onClick={close}
              aria-label={t("dossier.cerrar")}
              className="absolute right-3 top-3 rounded-gt-sm p-1.5 text-gt-ink-400 transition-colors hover:bg-gt-paper-2 hover:text-gt-ink-900"
            >
              <Icon name="x" size={17} />
            </button>

            <div className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.22em] text-gt-ink-400">
              {t("dossier.kicker")}
            </div>

            {isLoading || !citizen ? (
              <div className="mt-3 flex items-center gap-3.5">
                <Skeleton className="h-14 w-14" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-3.5">
                  <Avatar user={citizen.username} size={56} />
                  <div className="min-w-0">
                    <div className="truncate font-gt-display text-xl text-gt-ink-900">{citizen.username}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {standing && (
                        <Badge tone={standing.tone} dot>
                          {standing.label}
                        </Badge>
                      )}
                      {activeBounty && (
                        <Badge tone="danger" icon="alert" solid>
                          {money(activeBounty.bounty, intlLocale)} ₽
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 font-gt-mono text-[9.5px] uppercase tracking-[.1em] text-gt-ink-400">
                  {t("jugadores.uuid")} {citizen.uuid.slice(0, 8)}…
                </div>
              </>
            )}
          </div>

          {citizen && (
            <div className="space-y-5 px-5 py-5">
              <div className="grid grid-cols-3 gap-2">
                <Sunken className="px-3 py-2.5 text-center">
                  <div className="font-gt-display text-xl tabular-nums text-gt-ink-900">{citizen.parcelas}</div>
                  <div className="mt-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("dossier.parcelas")}
                  </div>
                </Sunken>
                <Sunken className="px-3 py-2.5 text-center">
                  <div className="font-gt-display text-xl tabular-nums text-gt-ink-900">
                    {citizen.multasPendientes}
                  </div>
                  <div className="mt-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("dossier.multas")}
                  </div>
                </Sunken>
                <Sunken className="px-3 py-2.5 text-center">
                  <div className="font-gt-display text-xl tabular-nums text-gt-ink-900">{citizen.towns.length}</div>
                  <div className="mt-0.5 font-gt-mono text-[8.5px] uppercase tracking-[.12em] text-gt-ink-400">
                    {t("dossier.ciudades")}
                  </div>
                </Sunken>
              </div>

              {citizen.towns.length > 0 && (
                <DossierSection title={t("dossier.residencia")} icon="mapPin">
                  <div className="flex flex-wrap gap-1.5">
                    {citizen.towns.map((t) => (
                      <Badge key={t} tone="urbanismo">
                        {townName(t)}
                      </Badge>
                    ))}
                  </div>
                </DossierSection>
              )}

              {activeBounty && (
                <DossierSection title={t("dossier.buscaCaptura")} icon="alert">
                  <div className="rounded-gt-sm border border-gt-danger/35 bg-gt-danger-tint px-3 py-2.5">
                    <div className="text-[13px] font-semibold text-gt-ink-900">{activeBounty.offense}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={BUSCADO_STATUS[activeBounty.status].tone}>
                        {t(BUSCADO_STATUS[activeBounty.status].labelKey)}
                      </Badge>
                      <span className="font-gt-mono text-[11px] tabular-nums text-gt-danger">
                        {money(activeBounty.bounty, intlLocale)} ₽
                      </span>
                    </div>
                    {activeBounty.lastSeen && (
                      <div className="mt-1.5 text-[12px] text-gt-ink-500">
                        {t("dossier.vistoUltimamente", { location: activeBounty.lastSeen })}
                      </div>
                    )}
                  </div>
                </DossierSection>
              )}

              <DossierSection title={t("dossier.multas")} icon="gavel">
                {multas?.items.length ? (
                  <ul className="space-y-1.5">
                    {multas.items.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 border-b border-gt-line-soft pb-1.5 last:border-b-0">
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] text-gt-ink-700">{m.reason}</div>
                          <div className="font-gt-mono text-[9.5px] uppercase tracking-[.1em] text-gt-ink-400">
                            {m.code} · {fmtDate(m.createdAt, intlLocale)}
                          </div>
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          <span className="font-gt-mono text-[12px] tabular-nums text-gt-ink-900">
                            {money(m.amount, intlLocale)} ₽
                          </span>
                          <Badge tone={MULTA_STATUS[m.status].tone}>{t(MULTA_STATUS[m.status].labelKey)}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyLine>{t("dossier.sinMultas")}</EmptyLine>
                )}
              </DossierSection>

              <DossierSection title={t("dossier.denunciasContra")} icon="fileText">
                {denuncias?.items.length ? (
                  <ul className="space-y-1.5">
                    {denuncias.items.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 border-b border-gt-line-soft pb-1.5 last:border-b-0">
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] text-gt-ink-700">{d.description}</div>
                          <div className="font-gt-mono text-[9.5px] uppercase tracking-[.1em] text-gt-ink-400">
                            {d.code} · {fmtDate(d.createdAt, intlLocale)}
                          </div>
                        </div>
                        <Badge tone={DENUNCIA_STATUS[d.status].tone}>{t(DENUNCIA_STATUS[d.status].labelKey)}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyLine>{t("dossier.sinDenuncias")}</EmptyLine>
                )}
              </DossierSection>
            </div>
          )}
        </aside>
      </div>
    </ThemedLayer>,
    document.body,
  )
}

function DossierSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: "mapPin" | "alert" | "gavel" | "fileText"
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 border-b border-gt-line-strong pb-1.5">
        <Icon name={icon} size={14} className="text-gt-accent" />
        <h3 className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.16em] text-gt-ink-500">{title}</h3>
      </div>
      {children}
    </section>
  )
}

const EmptyLine = ({ children }: { children: React.ReactNode }) => (
  <div className="py-1 text-[12.5px] italic text-gt-ink-400">{children}</div>
)
