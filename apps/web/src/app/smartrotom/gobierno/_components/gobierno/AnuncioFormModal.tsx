"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Field, Icon, Modal, Select, TextArea } from "../ui"
import { getAnuncioKindOptions } from "./anuncioMeta"
import { useCreateAnuncio, useUpdateAnuncio } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import type { Anuncio } from "../../_types"

// One modal for both publishing and editing — an edit is a PATCH against the same shape,
// so it did not earn a second component.
export function AnuncioFormModal({ anuncio, onClose }: { anuncio?: Anuncio | null; onClose: () => void }) {
  const t = useTranslations("gobierno")
  const officer = useOfficer()
  const [kind, setKind] = useState<Anuncio["kind"]>(anuncio?.kind ?? "anuncio")
  const [title, setTitle] = useState(anuncio?.title ?? "")
  const [body, setBody] = useState(anuncio?.body ?? "")
  const [town, setTown] = useState(anuncio?.town ?? "")
  const [pinned, setPinned] = useState(anuncio?.pinned ?? false)

  const create = useCreateAnuncio()
  const update = useUpdateAnuncio()
  const isEdit = !!anuncio
  const pending = create.isPending || update.isPending

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return
    const payload = { kind, title: title.trim(), body: body.trim(), town: town.trim() || null, pinned }
    if (isEdit) {
      update.mutate({ id: anuncio.id, ...payload }, { onSuccess: onClose })
    } else {
      create.mutate({ ...payload, authorUuid: officer.uuid }, { onSuccess: onClose })
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      kicker={t("anuncios.boardKicker")}
      title={isEdit ? t("anuncios.formEditar") : t("anuncios.formPublicar")}
      width={520}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button tone="gold" onClick={handleSubmit} disabled={!title.trim() || !body.trim() || pending}>
            {isEdit ? t("common.save") : t("common.publish")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          value={kind}
          onChange={(v) => setKind(v as Anuncio["kind"])}
          options={getAnuncioKindOptions(t)}
          label={t("anuncios.formTipo")}
        />
        <Field value={title} onChange={setTitle} placeholder={t("anuncios.formTituloPlaceholder")} label={t("anuncios.formTitulo")} />
        <TextArea value={body} onChange={setBody} placeholder={t("anuncios.formContenidoPlaceholder")} rows={5} label={t("anuncios.formContenido")} />
        <Field value={town} onChange={setTown} placeholder={t("anuncios.formMunicipioPlaceholder")} label={t("anuncios.formMunicipio")} mono />

        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          aria-pressed={pinned}
          className={`flex w-full items-center gap-2.5 rounded-gt-sm border px-3 py-2.5 text-left text-[0.8125rem] font-semibold transition-colors ${
            pinned ? "border-gt-gold/40 bg-gt-gold-tint text-gt-gold-600" : "border-gt-line-strong bg-gt-paper-0 text-gt-ink-600"
          }`}
        >
          <Icon name={pinned ? "checkCircle" : "pin"} size={16} />
          {t("anuncios.formFijar")}
        </button>
      </div>
    </Modal>
  )
}
