"use client"

import { useState, type LucideIcon } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/primitives/dialog"
import { Button } from "@/components/ui/primitives/button"
import { toast } from "react-toastify"
import { Plus, Pencil, Trash2, RefreshCw, AlertTriangle, Loader2 } from "lucide-react"
import { SearchInput } from "@/components/boffmedia/primitives/search-input"
import { BoffBadge } from "@/components/boffmedia/primitives/badge"
import { EmptyState } from "@/components/boffmedia/primitives/empty-state"
import { BoffButton } from "@/components/boffmedia/primitives/button"

export interface AdminCrudColumn<T> {
  key: string
  label: string
  width?: number | string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface AdminCrudFormProps<T> {
  defaultValues?: Partial<T>
  isSubmitting?: boolean
  onSubmit: (data: unknown) => void
  onCancel: () => void
  submitLabel?: string
}

interface AdminCrudProps<T extends { id: number | string }> {
  title: string
  icon?: LucideIcon
  description?: string
  useList: () => { data: T[] | undefined; isLoading: boolean; error: string | null; refetch: () => void }
  FormComponent: React.ComponentType<AdminCrudFormProps<T>>
  onCreate: (data: unknown) => Promise<void>
  onUpdate: (id: number | string, data: unknown) => Promise<void>
  onDelete: (id: number | string) => Promise<void>
  searchFields: (keyof T)[]
  entityName: { singular: string; plural: string }
  columns: AdminCrudColumn<T>[]
  searchPlaceholder?: string
}

function dialogContentClass() {
  return "bg-layer-1 border-edge-strong text-ink max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg,22px)]"
}

function dialogHeaderClass() {
  return "text-ink"
}

function dialogDescClass() {
  return "text-ink-muted"
}

export function AdminCrud<T extends { id: number | string }>({
  title,
  icon: Icon,
  description,
  useList,
  FormComponent,
  onCreate,
  onUpdate,
  onDelete,
  searchFields,
  entityName,
  columns,
  searchPlaceholder,
}: AdminCrudProps<T>) {
  const { data: items, isLoading, error, refetch } = useList()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const filtered = items
    ? searchTerm
      ? items.filter((item) =>
          searchFields.some((field) => {
            const val = item[field]
            return typeof val === "string" && val.toLowerCase().includes(searchTerm.toLowerCase())
          })
        )
      : items
    : []

  const handleCreate = async (data: unknown) => {
    setSubmitting(true)
    try {
      await onCreate(data)
      toast.success(`${entityName.singular} creado con éxito.`)
      setCreateOpen(false)
      refetch()
    } catch {
      toast.error(`Error al crear ${entityName.singular}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: unknown) => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      await onUpdate(selectedItem.id, data)
      toast.success(`${entityName.singular} actualizado con éxito.`)
      setEditOpen(false)
      setSelectedItem(null)
      refetch()
    } catch {
      toast.error(`Error al actualizar ${entityName.singular}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      await onDelete(selectedItem.id)
      toast.success(`${entityName.singular} eliminado con éxito.`)
      setDeleteOpen(false)
      setSelectedItem(null)
      refetch()
    } catch {
      toast.error(`Error al eliminar ${entityName.singular}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (item: T) => {
    setSelectedItem(item)
    setEditOpen(true)
  }

  const openDelete = (item: T) => {
    setSelectedItem(item)
    setDeleteOpen(true)
  }

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-edge bg-[var(--card-bg)] flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--orange-500)]" />
          <p className="text-sm text-ink-muted">Cargando {entityName.plural}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-edge bg-[var(--card-bg)] p-8">
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-[var(--radius,14px)] bg-[color-mix(in_srgb,var(--orange-500)_13%,transparent)] border border-[color-mix(in_srgb,var(--orange-500)_28%,transparent)] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[var(--orange-500)]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-ink">Error al cargar {entityName.plural}</h3>
          <p className="text-sm text-ink-muted mb-6">{error}</p>
          <BoffButton variant="outline" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </BoffButton>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-edge bg-[var(--card-bg)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              {Icon && <Icon className="w-5 h-5 text-[var(--orange-500)]" />}
              {title}
            </h3>
            {description && (
              <p className="text-sm text-ink-muted mt-1">{description}</p>
            )}
          </div>
          <BoffButton variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            Nuevo
          </BoffButton>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="w-full max-w-sm">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={searchPlaceholder ?? `Buscar ${entityName.plural}...`}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className="text-xs text-ink-dim">Total:</span>
            <BoffBadge kind="accent">{filtered.length}</BoffBadge>
          </div>
        </div>
      </div>

      {/* Table or empty */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={searchTerm ? `Sin resultados para "${searchTerm}"` : `No hay ${entityName.plural}`}
          sub={searchTerm
            ? "Prueba con otros términos de búsqueda."
            : `Crea el primer ${entityName.singular} para comenzar.`}
          action={
            searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-[var(--orange-500)] hover:underline"
              >
                Limpiar búsqueda
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="[&_th]:text-left [&_th]:font-mono [&_th]:text-[10px] [&_th]:tracking-[0.1em] [&_th]:uppercase [&_th]:text-ink-muted [&_th]:font-bold [&_th]:py-[0.6rem] [&_th]:px-[0.8rem] [&_th]:border-b-[var(--hairline)] [&_th]:border-b-solid [&_th]:border-b-[var(--border)] bg-[color-mix(in_srgb,var(--layer-1)_96%,transparent)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(col.className ?? "")}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="w-[100px] text-right font-mono text-[10px] tracking-[0.1em] uppercase text-ink-muted font-bold py-[0.6rem] px-[0.8rem] border-b-[var(--hairline)] border-b-solid border-b-[var(--border)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((item) => (
                <tr key={String(item.id)} className="hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("py-[0.7rem] px-[0.8rem]", col.className)}>
                      {col.render
                        ? col.render(item)
                        : String(item[col.key as keyof T] ?? "")
                      }
                    </td>
                  ))}
                  <td className="py-[0.7rem] px-[0.8rem] text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-edge-strong bg-transparent text-ink-muted hover:text-[var(--orange-500)] hover:border-[color-mix(in_srgb,var(--orange-500)_55%,transparent)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(item)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-edge-strong bg-transparent text-ink-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={dialogContentClass()}>
          <DialogHeader>
            <DialogTitle className={dialogHeaderClass()}>
              {Icon && <Icon className="w-5 h-5 text-[var(--orange-500)] inline mr-2" />}
              Crear {entityName.singular}
            </DialogTitle>
            <DialogDescription className={dialogDescClass()}>
              Completa el formulario para añadir un nuevo {entityName.singular}.
            </DialogDescription>
          </DialogHeader>
          <FormComponent
            isSubmitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel={submitting ? "Creando..." : `Crear ${entityName.singular}`}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className={dialogContentClass()}>
          <DialogHeader>
            <DialogTitle className={dialogHeaderClass()}>
              {Icon && <Icon className="w-5 h-5 text-[var(--orange-500)] inline mr-2" />}
              Editar {entityName.singular}
            </DialogTitle>
            <DialogDescription className={dialogDescClass()}>
              Actualiza la información del {entityName.singular} seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <FormComponent
              defaultValues={selectedItem as unknown as Partial<T>}
              isSubmitting={submitting}
              onSubmit={handleUpdate}
              onCancel={() => { setEditOpen(false); setSelectedItem(null) }}
              submitLabel={submitting ? "Actualizando..." : "Guardar Cambios"}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className={dialogContentClass()}>
          <DialogHeader>
            <DialogTitle className={dialogHeaderClass()}>Confirmar Eliminación</DialogTitle>
            <DialogDescription className={dialogDescClass()}>
              ¿Estás seguro de que deseas eliminar este {entityName.singular}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)] border border-edge mb-4">
                <p className="font-medium text-ink">{String(selectedItem[searchFields[0] as keyof T] ?? "")}</p>
                <p className="text-sm text-ink-muted mt-1">ID: {selectedItem.id}</p>
              </div>
              <p className="text-xs text-[var(--orange-500)]">
                Nota: Esta operación podría afectar a otros elementos relacionados.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteOpen(false); setSelectedItem(null) }}
              className="border-edge-strong text-ink-muted"
            >
              Cancelar
            </Button>
            <Button
              variant="error"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Eliminando...</>
              ) : (
                `Eliminar ${entityName.singular}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
