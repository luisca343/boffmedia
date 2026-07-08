"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Button,
  Modal,
  SearchInput,
  Badge,
  Empty,
  Spinner,
  Icon,
  toast,
} from "@/components/boffmedia/primitives"
import { AvPanel } from "./av-kit"

export interface AvCrudColumn<T> {
  key: string
  label: string
  width?: number | string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface AvCrudFormProps<T> {
  defaultValues?: Partial<T>
  isSubmitting?: boolean
  onSubmit: (data: unknown) => void
  onCancel: () => void
  submitLabel?: string
}

interface AvCrudProps<T extends { id: number | string }> {
  useList: () => { data: T[] | undefined; isLoading: boolean; error: string | null; refetch: () => void }
  FormComponent: React.ComponentType<AvCrudFormProps<T>>
  onCreate: (data: unknown) => Promise<void>
  onUpdate: (id: number | string, data: unknown) => Promise<void>
  onDelete: (id: number | string) => Promise<void>
  searchFields: (keyof T)[]
  entityName: { singular: string; plural: string }
  columns: AvCrudColumn<T>[]
  searchPlaceholder?: string
}

export function AdminCrud<T extends { id: number | string }>({
  useList,
  FormComponent,
  onCreate,
  onUpdate,
  onDelete,
  searchFields,
  entityName,
  columns,
  searchPlaceholder,
}: AvCrudProps<T>) {
  const t = useTranslations("admin.crud")
  const singular = entityName.singular
  const plural = entityName.plural
  const { data: items, isLoading, error, refetch } = useList()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selected, setSelected] = React.useState<T | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const filtered = items
    ? searchTerm
      ? items.filter((item) =>
          searchFields.some((field) => {
            const val = item[field]
            return typeof val === "string" && val.toLowerCase().includes(searchTerm.toLowerCase())
          }),
        )
      : items
    : []

  const handleCreate = async (data: unknown) => {
    setSubmitting(true)
    try {
      await onCreate(data)
      toast.success(t("createdOk", { singular }))
      setCreateOpen(false)
      refetch()
    } catch {
      toast.error(t("createdErr", { singular }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: unknown) => {
    if (!selected) return
    setSubmitting(true)
    try {
      await onUpdate(selected.id, data)
      toast.success(t("updatedOk", { singular }))
      setEditOpen(false)
      setSelected(null)
      refetch()
    } catch {
      toast.error(t("updatedErr", { singular }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await onDelete(selected.id)
      toast.success(t("deletedOk", { singular }))
      setDeleteOpen(false)
      setSelected(null)
      refetch()
    } catch {
      toast.error(t("deletedErr", { singular }))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AvPanel>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner size={28} className="text-accent" />
          <p className="text-sm text-txt-muted">{t("loading", { plural })}</p>
        </div>
      </AvPanel>
    )
  }

  if (error) {
    return (
      <AvPanel>
        <div className="text-center py-10">
          <span className="cut-seal grid place-items-center w-12 h-12 mx-auto mb-4 text-accent bg-accent-soft border border-solid border-accent-line">
            <Icon name="alert" size={24} />
          </span>
          <h3 className="text-lg font-bold mb-2">{t("errorTitle", { plural })}</h3>
          <p className="text-sm text-txt-muted mb-6">{error}</p>
          <Button icon="refresh" onClick={refetch}>
            {t("retry")}
          </Button>
        </div>
      </AvPanel>
    )
  }

  return (
    <div>
      {/* Resource header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="font-mono text-[11px] font-bold leading-none uppercase tracking-[0.08em] text-txt-muted shrink-0">
          {t("count", { count: filtered.length, plural })}
        </span>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={searchPlaceholder ?? t("searchPlaceholder", { plural })}
          size="sm"
          className="flex-1 min-w-[200px] max-w-[400px]"
        />
        <Button icon="plus" variant="pri" size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          {t("new")}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="search"
          title={searchTerm ? t("noResultsTitle") : t("emptyTitle", { plural })}
          lead={searchTerm ? t("noResultsLead") : t("emptyLead", { singular })}
        >
          {searchTerm ? (
            <Button variant="ghost" onClick={() => setSearchTerm("")}>
              {t("clearSearch")}
            </Button>
          ) : (
            <Button variant="pri" icon="plus" onClick={() => setCreateOpen(true)}>
              {t("newEntity", { singular })}
            </Button>
          )}
        </Empty>
      ) : (
        <div className="cut-corner border border-solid border-line bg-panel overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[560px]">
            <thead>
              <tr className="bg-panel-2">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      "text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-txt-muted py-[11px] px-[14px] border-b border-solid border-line",
                      col.className,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="w-[92px] text-right font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-txt-muted py-[11px] px-[14px] border-b border-solid border-line">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={String(item.id)}
                  className="border-b border-solid border-line last:border-b-0 hover:bg-panel-2 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("py-[10px] px-[14px] align-middle", col.className)}>
                      {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                  <td className="py-[10px] px-[14px] text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        aria-label={t("editAction")}
                        onClick={() => {
                          setSelected(item)
                          setEditOpen(true)
                        }}
                        className="cut-tag [--cut-tag:5px] grid place-items-center w-8 h-8 border border-solid border-line-2 text-txt-muted hover:text-accent hover:border-accent-line transition-colors"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        aria-label={t("deleteAction")}
                        onClick={() => {
                          setSelected(item)
                          setDeleteOpen(true)
                        }}
                        className="cut-tag [--cut-tag:5px] grid place-items-center w-8 h-8 border border-solid border-line-2 text-txt-muted hover:text-bad hover:border-bad transition-colors"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("createTitle", { singular })}>
        <p className="text-[13px] text-txt-muted mb-3">{t("createDesc", { singular })}</p>
        <FormComponent
          isSubmitting={submitting}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel={submitting ? t("creating") : t("createSubmit", { singular })}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setSelected(null)
        }}
        title={t("editTitle", { singular })}
      >
        <p className="text-[13px] text-txt-muted mb-3">{t("editDesc", { singular })}</p>
        {selected && (
          <FormComponent
            defaultValues={selected as unknown as Partial<T>}
            isSubmitting={submitting}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditOpen(false)
              setSelected(null)
            }}
            submitLabel={submitting ? t("updating") : t("saveChanges")}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setSelected(null)
        }}
        title={t("deleteTitle")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false)
                setSelected(null)
              }}
            >
              {t("cancel")}
            </Button>
            <Button variant="danger" loading={submitting} disabled={submitting} onClick={handleDelete}>
              {t("deleteAction")}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-txt-muted">{t("deleteConfirm", { singular })}</p>
        {selected && (
          <div className="mt-4 p-3 border border-solid border-line bg-base-2">
            <p className="font-medium">{String(selected[searchFields[0] as keyof T] ?? "")}</p>
            <p className="font-mono text-[11px] text-txt-dim mt-1">ID: {selected.id}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
