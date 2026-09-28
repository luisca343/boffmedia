"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, DragCard, DragPlaceholder, DragPreview, DragTarget, Icon, MediaCardContent } from "@boffmedia/ui"
import { TierList, TierListDisplayControls, TierListHeading, TierListHeadingEditor, TierListInstructions, TierListSourcePanel, TierListTemplateEditor, TierListTemplateItemEditor, applyTierListAction, createDocument, defaultTierListDisplay, getTierListDescription, getTierListTitle, type TierListItem, type TierListTemplate } from "@/features/tier-list"
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
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("unassigned")
  const [editorItem, setEditorItem] = useState<TierListItem | null>({ id: "sample", name: t("cardLabel") })
  const [lockedTemplate] = useState(() => {
    const preset = templates[3]
    return { ...preset, source: { type: "static" as const, items: preset.source.type === "reference" ? [] : preset.source.items.filter((item) => item.fixedRowId || ["tialla", "peter"].includes(item.id)) } }
  })
  const artwork = <MediaCardContent label={t("cardLabel")}>
    <span aria-hidden="true" className="grid aspect-square place-items-center bg-accent-soft font-display text-2xl text-accent">S</span>
  </MediaCardContent>
  return <>
    <Section id="tier-drag" kicker="Tier Lists" title={t("drag")} lead={t("dragLead")}>
      <Sample title={t("dragSample")} code="<MediaCardContent label={name}>{artwork}</MediaCardContent> · DragCard / DragPreview / DragPlaceholder / DragTarget" col note={t("dragNote")}>
        <div className="flex flex-wrap items-start gap-8">
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{t("idle")}</span><DragCard aria-label={t("cardLabel")}>{artwork}</DragCard></div>
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{t("locked")}</span><DragCard dragDisabled aria-label={t("locked")} status={<Icon name="lock" size={14} />}>{artwork}</DragCard></div>
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{tier("assigned")}</span><DragCard aria-label={tier("assigned")} status={<Icon name="check" size={14} />}>{artwork}</DragCard></div>
          <div className="grid gap-3"><span className="text-xs text-txt-muted">{t("lifted")}</span><DragPreview>{artwork}</DragPreview></div>
          <div className="grid min-w-0 flex-1 gap-3"><span className="text-xs text-txt-muted">{t("target")}</span><DragTarget dragging active><DragPlaceholder>{artwork}</DragPlaceholder><DragCard aria-label={t("cardLabel")}>{artwork}</DragCard></DragTarget></div>
        </div>
      </Sample>
    </Section>
    <Section id="tier-controls" kicker="TierListSourcePanel / TierListInstructions" title={t("controls")} lead={t("controlsLead")}>
      <Sample title={t("controls")} code="<TierListSourcePanel search onSearch filter onFilter shown total assigned /> · <TierListInstructions mode hasFixedItems />" col note={t("controlsNote")}>
        <TierListInstructions mode="multi" hasFixedItems />
        <TierListSourcePanel search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} total={1} assigned={1}
          shown={filter !== "unassigned" && t("cardLabel").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) ? 1 : 0}>
          <div className="p-4">{filter !== "unassigned" && t("cardLabel").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && <DragCard aria-label={t("cardLabel")} status={<Icon name="check" size={14} />}>{artwork}</DragCard>}</div>
        </TierListSourcePanel>
      </Sample>
    </Section>
    <Section id="tier-exclusive" kicker="TierList" title={t("exclusive")} lead={t("exclusiveLead")}>
      <Sample title={templates[0].title} code={'<TierList template instance items onChange /> · placementMode="exclusive"'} col note={t("boardNote")}>
        <EmbeddedBoard template={templates[0]} />
      </Sample>
    </Section>
    <Section id="tier-locked" kicker="TierList" title={t("lockedBoard")} lead={t("lockedBoardLead")}>
      <Sample title={templates[3].title} code="item.fixedRowId · placementMode=multi" col note={t("lockedBoardNote")}>
        <EmbeddedBoard template={lockedTemplate} />
      </Sample>
    </Section>
    <Section id="tier-multi" kicker="TierList" title={t("multi")} lead={t("multiLead")}>
      <Sample title={templates[1].title} code={'placementMode="multi" · keepSourceVisible=true'} col note={t("boardNote")}>
        <EmbeddedBoard template={templates[1]} />
      </Sample>
    </Section>
    <Section id="tier-editor" kicker="TierListTemplateEditor" title={t("editor")} lead={t("editorLead")}>
      <Sample title={t("itemEditor")} code="<TierListTemplateItemEditor item onPatch onRemove onUpload? />" col note={t("itemEditorNote")}>
        {editorItem ? <TierListTemplateItemEditor item={editorItem} onPatch={(patch) => setEditorItem({ ...editorItem, ...patch })} onRemove={() => setEditorItem(null)} /> :
          <Button size="sm" onClick={() => setEditorItem({ id: "sample", name: t("cardLabel") })}>{t("reset")}</Button>}
      </Sample>
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
