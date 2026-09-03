"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, Field, Icon, Modal, Select, Sunken, Button } from "../ui"
import { RANK_OPTIONS } from "./officerRoles"
import { useCenso, useGrantRole } from "../../_hooks/queries"
import type { Ciudadano } from "../../_types"

// The appointments desk: pick a real citizen off the censo and grant one of the four
// government roles. There is no officers table to insert into — granting the role IS the
// appointment (SMARTROTOM_V3 domain note).
export function AppointModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("gobierno")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Ciudadano | null>(null)
  const [role, setRole] = useState(RANK_OPTIONS[0]?.value ?? "")

  const { data } = useCenso({ page: 1, limit: 100 })
  const grant = useGrantRole()

  const rankOptions = RANK_OPTIONS.map((o) => ({ value: o.value, label: o.labelKey ? t(o.labelKey) : (o.label ?? o.value) }))

  const results =
    !selected && search.trim().length > 0
      ? (data?.items ?? []).filter((c) => c.username.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
      : []

  const handleSubmit = () => {
    if (!selected || !role) return
    grant.mutate({ uuid: selected.uuid, role }, { onSuccess: onClose })
  }

  return (
    <Modal
      open
      onClose={onClose}
      kicker={t("poblacion.appointKicker")}
      title={t("poblacion.appointTitle")}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button tone="gold" onClick={handleSubmit} disabled={!selected || !role || grant.isPending}>
            {t("poblacion.nombrar")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <span className="mb-1.5 block font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
            {t("poblacion.ciudadano")}
          </span>
          {selected ? (
            <Sunken className="flex items-center gap-2.5 px-3 py-2">
              <Avatar user={selected.username} size={28} />
              <span className="flex-1 text-[0.8125rem] font-semibold text-gt-ink-900">{selected.username}</span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={t("poblacion.cambiarCiudadano")}
                className="rounded-gt-sm p-1 text-gt-ink-400 hover:bg-gt-paper-3 hover:text-gt-ink-900"
              >
                <Icon name="x" size={14} />
              </button>
            </Sunken>
          ) : (
            <>
              <Field
                value={search}
                onChange={setSearch}
                placeholder={t("poblacion.buscarCiudadano")}
                icon="search"
              />
              {results.length > 0 && (
                <div className="mt-1.5 max-h-[11.25rem] overflow-y-auto rounded-gt-sm border border-gt-line">
                  {results.map((c) => (
                    <button
                      key={c.uuid}
                      type="button"
                      onClick={() => {
                        setSelected(c)
                        setSearch("")
                      }}
                      className="flex w-full items-center gap-2.5 border-b border-gt-line-soft px-3 py-2 text-left last:border-b-0 hover:bg-gt-paper-1"
                    >
                      <Avatar user={c.username} size={24} />
                      <span className="text-[0.78125rem] text-gt-ink-800">{c.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Select value={role} onChange={setRole} options={rankOptions} label={t("poblacion.cargo")} />
      </div>
    </Modal>
  )
}
