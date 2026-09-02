"use client"

import * as React from "react"
import { Panel, Icon, Input, Textarea, Tabs, Button, Empty, IconButton, toast, DropZone } from "@boffmedia/ui"
import { SrtNumberStepper, SrtEntrantRow } from "@boffmedia/ui/giveaways"
import type { Entrant } from "@boffmedia/ui/giveaways"
import { useToolT, useToolRichT, SORTEOS_NS } from "../i18n"

export interface SorteosRosterProps {
  entrants: Entrant[]
  weighted: boolean
  wonNames: Set<string>
  totalWeight: number
  inputFocusRef?: React.MutableRefObject<HTMLInputElement | null>
  onRename: (id: string, name: string) => void
  onWeight: (id: string, weight: number) => void
  onRemove: (id: string) => void
  onAddOne: (name: string, weight: number) => void
  onAddBulk: (text: string) => number
  onShuffle: () => void
}

/**
 * Roster component — participant list with file/bulk/single intake tabs
 */
export function SorteosRoster({
  entrants,
  weighted,
  wonNames,
  totalWeight,
  inputFocusRef,
  onRename,
  onWeight,
  onRemove,
  onAddOne,
  onAddBulk,
  onShuffle,
}: SorteosRosterProps) {
  const t = useToolT(SORTEOS_NS)
  // `bulkHint` wraps its two syntax samples in <code>; see `useToolRichT`.
  const tRich = useToolRichT(SORTEOS_NS)
  const [tab, setTab] = React.useState<"single" | "bulk" | "file">("single")
  const [single, setSingle] = React.useState("")
  const [singleW, setSingleW] = React.useState(1)
  const [bulk, setBulk] = React.useState("")
  const [pickedFile, setPickedFile] = React.useState<{ name: string; size: string } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!single.trim()) return
    onAddOne(single, weighted ? singleW : 1)
    setSingle("")
    setSingleW(1)
  }

  const handleSubmitBulk = () => {
    const count = onAddBulk(bulk)
    if (count > 0) {
      toast({ msg: t("toastBulkAdded", { n: count }), tone: "ok", icon: "check" })
      setBulk("")
    } else {
      toast({ msg: t("toastBulkNone"), tone: "warn" })
    }
  }

  const handleFileLoad = async (file: File) => {
    try {
      const text = await file.text()
      const count = onAddBulk(text)
      if (count > 0) {
        toast({ msg: t("toastBulkAdded", { n: count }), tone: "ok", icon: "check" })
        setPickedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        })
      } else {
        toast({ msg: t("toastBulkNone"), tone: "warn" })
      }
    } catch {
      toast({ msg: t("toastFileFailed"), tone: "bad" })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileLoad(files[0])
    }
  }

  const bulkCount = bulk.split("\n").filter((l) => l.trim()).length
  const droppedRef = React.useRef(false)

  return (
    <Panel
      title={t("listTitle")}
      media={<Icon name="users" />}
      aside={
        <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-txt-muted">
          {entrants.length}
          {weighted && ` · ${totalWeight} ${t("tickets")}`}
        </span>
      }
      bodyClassName="p-0"
    >
      {/* Tabs */}
      <div className="px-5 pt-4 border-b border-line">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "single" | "bulk" | "file")}
          tabs={[
            { value: "single", label: t("tabSingle") },
            { value: "bulk", label: t("tabBulk") },
            { value: "file", label: t("tabFile") },
          ]}
        />
      </div>

      {/* Tab content */}
      <div className="px-5 py-4 border-b border-line">
        {tab === "single" ? (
          <form className="flex items-stretch gap-[9px]" onSubmit={handleSubmitSingle}>
            <Input
              ref={inputFocusRef}
              className="min-w-0 flex-1"
              placeholder={t("namePlaceholder")}
              value={single}
              onChange={(e) => setSingle(e.target.value)}
            />
            {weighted && (
              <SrtNumberStepper
                value={singleW}
                onChange={setSingleW}
                min={1}
                max={99}
                size="sm"
                lessLabel={t("weightLess")}
                moreLabel={t("weightMore")}
              />
            )}
            <Button variant="pri" type="submit" icon="plus">
              {t("add")}
            </Button>
          </form>
        ) : tab === "bulk" ? (
          <div className="grid gap-[10px]">
            <Textarea
              rows={5}
              className="min-h-[120px] resize-y font-mono text-[13px] leading-[1.6]"
              placeholder={t("bulkPlaceholder")}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
            />
            <div className="flex items-start gap-[8px] font-mono text-[11px] leading-[1.5] text-txt-dim">
              <Icon name="info" size={13} className="mt-[1px] flex-none text-signal" />
              <span>{tRich("bulkHint", { code: (c) => <code className="text-txt-muted">{c}</code> })}</span>
            </div>
            <Button variant="default" icon="download" onClick={handleSubmitBulk} disabled={!bulk.trim()}>
              {t("addList", { n: bulkCount })}
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDropCapture={(e) => {
              droppedRef.current = true
            }}
            onDrop={handleDrop}
          >
            <DropZone
              label={t("fileLabel")}
              hint={t("fileHint")}
              loadedLabel={t("fileLoaded")}
              onPick={() => {
                if (droppedRef.current) {
                  droppedRef.current = false
                  return
                }
                fileInputRef.current?.click()
              }}
              file={pickedFile && { name: pickedFile.name, size: pickedFile.size }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileLoad(e.target.files[0])
                }
              }}
            />
            {pickedFile && (
              <Button
                variant="ghost"
                size="sm"
                icon="x"
                onClick={() => setPickedFile(null)}
                className="mt-[12px] w-full"
              >
                {t("fileClear")}
              </Button>
            )}
          </div>
        )}

        {tab === "single" && (
          <div className="mt-[10px] flex items-start gap-[8px] font-mono text-[11px] leading-[1.5] text-txt-dim">
            <Icon name="info" size={13} className="mt-[1px] flex-none text-signal" />
            <span>{t("singleHint")}</span>
          </div>
        )}
      </div>

      {/* List */}
      {entrants.length === 0 ? (
        <Empty
          icon="users"
          title={t("listEmpty")}
          lead={t("listEmptyLead")}
          className="py-[44px]"
        />
      ) : (
        <>
          <div className="flex items-center justify-end gap-[12px] border-b border-line px-[16px] py-[12px]">
            <Button variant="ghost" size="sm" icon="refresh" onClick={onShuffle}>
              {t("shuffle")}
            </Button>
          </div>
          <ul role="list" className="max-h-[420px] overflow-y-auto bm-scroll">
            {entrants.map((e, i) => (
              <li key={e.id}>
                <SrtEntrantRow
                  index={i + 1}
                  entrant={e}
                  weighted={weighted}
                  won={wonNames.has(e.name)}
                  removeLabel={t("removeOne", { name: e.name })}
                  editNameLabel={t("editName", { name: e.name })}
                  onRename={(name) => onRename(e.id, name)}
                  onWeight={(w) => onWeight(e.id, w)}
                  onRemove={() => onRemove(e.id)}
                  weightLessLabel={t("weightLess")}
                  weightMoreLabel={t("weightMore")}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
