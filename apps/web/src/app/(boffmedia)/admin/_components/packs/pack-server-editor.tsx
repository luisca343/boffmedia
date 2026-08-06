"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Input, toast } from "@boffmedia/ui"
import { type AdminPack, PacksService } from "@/services/api/boffmedia/packsService"

/** The pack-level Quick Play target. Setting a host makes the pack a "server
 *  pack" (the launcher shows the type banner and can auto-join on launch);
 *  clearing the host and saving turns it back into a client pack. Keyed by
 *  `pack.id` at the call site so it re-prefills when the selected pack changes. */
export function PackServerEditor({ pack, onSaved }: { pack: AdminPack; onSaved: () => void | Promise<void> }) {
  const t = useTranslations("admin.packs")
  const [host, setHost] = useState(pack.server?.host ?? "")
  const [port, setPort] = useState(pack.server?.port ? String(pack.server.port) : "")
  const [busy, setBusy] = useState(false)

  const portNum = port.trim() ? Number(port) : null
  const portValid =
    portNum === null || (Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535)
  const hostTrim = host.trim()
  // "Dirty" against the pack's current server so Save is a no-op until something
  // actually changed.
  const currentHost = pack.server?.host ?? ""
  const currentPort = pack.server?.port ? String(pack.server.port) : ""
  const dirty = hostTrim !== currentHost || port.trim() !== currentPort
  const canSave = portValid && dirty

  const save = async () => {
    setBusy(true)
    try {
      const res = await PacksService.update(pack.id, {
        server: hostTrim
          ? { host: hostTrim, port: port.trim() ? Number(port) : undefined }
          : null,
      })
      if (!res.success) {
        toast({ tone: "bad", title: t("serverSaveFailed"), msg: res.userMessage })
        return
      }
      toast({ tone: "ok", title: hostTrim ? t("serverSaved") : t("serverCleared") })
      await onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="cut-tag border border-solid border-line bg-panel-2 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="server" size={14} className="text-accent" />
        <h3 className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-txt">
          {t("serverSection")}
        </h3>
        <span className="font-mono text-[10px] text-txt-dim">{t("serverSectionLead")}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Field label={t("serverHost")} hint={t("serverHostHint")}>
            <Input value={host} placeholder="play.example.com" onChange={(e) => setHost(e.target.value)} />
          </Field>
        </div>
        <div className="w-[120px]">
          <Field label={t("serverPort")}>
            <Input
              type="number"
              min={1}
              max={65535}
              value={port}
              placeholder="25565"
              onChange={(e) => setPort(e.target.value)}
            />
          </Field>
        </div>
        <Button variant="pri" icon="check" loading={busy} disabled={!canSave} onClick={() => void save()}>
          {t("serverSave")}
        </Button>
      </div>
    </section>
  )
}
