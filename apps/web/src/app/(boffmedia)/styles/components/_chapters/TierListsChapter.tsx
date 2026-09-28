"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, DragCard, DragPlaceholder, DragPreview, DragTarget, MediaCardContent } from "@boffmedia/ui"
import { TierList, TierListDisplayControls, TierListHeading, TierListHeadingEditor, TierListTemplateEditor, applyTierListAction, createDocument, defaultTierListDisplay, getTierListDescription, getTierListTitle, type TierListTemplate } from "@/features/tier-list"
import { createBlankTemplate, getTierListTemplates } from "@/features/tier-list/templates"
import { Sample, Section } from "../showcase-shared"

function EmbeddedBoard({ template }: { template: TierListTemplate }) {
  const t = useTranslations("styles.components.tierLists")
  const tier = useTranslations("tierLists")
  const [doc, setDoc] = useState(() => createDocument(template, template.source.type === "reference" ? [] : template.source.items))
  const [display, setDisplay] = useState(defaultTierListDisplay)
  const [editingHeading, setEditingHeading] = useState(false)
  const title = getTierListTitle(doc.template, doc.instance)
  const description = getTierListDescription(doc.template, doc.instance)
  return <div className="grid min-w-0 gap-4">
    <TierListDisplayControls value={display} onChange={setDisplay} />
    <TierList template={doc.template} instance={doc.instance} items={doc.items} display={display}
      heading={(display.title || (display.descriptions && description)) && <TierListHeading title={title} description={description} display={display} level="h3" />}
      onChange={(instance) => setDoc((previous) => ({ ...previous, instance }))} />
    <div className="flex flex-wrap gap-2"><Button size="sm" icon="edit" onClick={() => setEditingHeading(true)}>{tier("editHeading")}</Button><Button size="sm" onClick={() => setDoc(createDocument(template, doc.items))}>{t("reset")}</Button></div>
    {editingHeading && <TierListHeadingEditor title={title} description={description} onClose={() => setEditingHeading(false)}
      onSave={(title, description) => setDoc((previous) => applyTierListAction(previous, { type: "editHeading", title, description }))} />}
  </div>
}

export function TierListsChapter() {
  const t = useTranslations("styles.components.tierLists")
  const tier = useTranslations("tierLists")
  const [templates] = useState(() => getTierListTemplates(tier))
  const [editorTemplate] = useState(() => createBlankTemplate(tier, "showcase-template"))
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const artwork = <MediaCardContent label={t("cardLabel")}>
    <span aria-hidden="true" className="grid aspect-square place-items-center bg-accent-soft font-display text-2xl text-accent">S</span>
  </MediaCardContent>
  return <>
    <Section id="tier-drag" kicker="Tier Lists" title={t("drag")} lead={t("dragLead")}>
      <Sample title={t("dragSample")} code="<MediaCardContent label={name}>{artwork}</MediaCardContent> · DragCard / DragPreview / DragPlaceholder / DragTarget" col note={t("dragNote")}>
        <div className="flex flex-wrap items-start gap-8">
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{t("idle")}</span><DragCard aria-label={t("cardLabel")}>{artwork}</DragCard></div>
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{t("lifted")}</span><DragPreview>{artwork}</DragPreview></div>
          <div className="grid min-w-0 flex-1 gap-3"><span className="text-xs text-txt-muted">{t("target")}</span><DragTarget dragging active><DragPlaceholder>{artwork}</DragPlaceholder><DragCard aria-label={t("cardLabel")}>{artwork}</DragCard></DragTarget></div>
        </div>
      </Sample>
    </Section>
    <Section id="tier-exclusive" kicker="TierList" title={t("exclusive")} lead={t("exclusiveLead")}>
      <Sample title={templates[0].title} code={'<TierList template instance items onChange /> · placementMode="exclusive"'} col note={t("boardNote")}>
        <EmbeddedBoard template={templates[0]} />
      </Sample>
    </Section>
    <Section id="tier-multi" kicker="TierList" title={t("multi")} lead={t("multiLead")}>
      <Sample title={templates[1].title} code={'placementMode="multi" · keepSourceVisible=true'} col note={t("boardNote")}>
        <EmbeddedBoard template={templates[1]} />
      </Sample>
    </Section>
    <Section id="tier-editor" kicker="TierListTemplateEditor" title={t("editor")} lead={t("editorLead")}>
      <Sample title={t("editor")} code="<TierListTemplateEditor template onSave imageStorage? />" col note={t("editorNote")}>
        <TierListTemplateEditor template={editorTemplate} onSave={async (template) => setSavedTitle(template.title)} />
        {savedTitle && <p role="status" className="text-sm text-ok">{t("saved", { title: savedTitle })}</p>}
      </Sample>
    </Section>
    <Sample title={t("collection")} code="getTierListTemplates(t) · source.type = static" col note={t("collectionNote")}>
      <Button size="sm" icon="list" href="/tier-lists/fire-emblem-fortunes-weave">{tier("templates.fortunesWeave.title")}</Button>
    </Sample>
  </>
}
