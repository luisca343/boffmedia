import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { BoffInput } from "@/components/boffmedia/primitives/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"

const teamSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  tag: z.string().max(5, "El tag no puede tener más de 5 caracteres").optional(),
  icon: z.string().optional(),
  eventId: z.number(),
})

export type TeamFormValues = z.infer<typeof teamSchema>

interface TeamFormProps {
  defaultValues?: Partial<any>
  isSubmitting?: boolean
  onSubmit: (data: TeamFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function TeamForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel = "Guardar" }: TeamFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultValues || {
      name: "",
      tag: "",
      icon: "",
      eventId: 0,
    },
  })

  const selectTriggerClass = "bg-[var(--surface-2)] border border-solid border-[var(--border-strong)] text-[var(--text)] py-2.5 px-3.5 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"
  const selectContentClass = "bg-[var(--surface)] border-[var(--border-strong)] text-[var(--text)]"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Nombre del Equipo</FormLabel>
              <FormControl>
                <BoffInput placeholder="Nombre del equipo" {...field} />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">Este será el nombre principal del equipo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Tag del Equipo</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="TAG"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">Un identificador corto para el equipo (máx. 5 caracteres).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Evento</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingEvents}
              >
                <FormControl>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder={isLoadingEvents ? "Cargando eventos..." : "Selecciona un evento"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={selectContentClass}>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-[var(--text-dim)]">Selecciona el evento al que pertenecerá este equipo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Icono URL (opcional)</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="https://ejemplo.com/icono.jpg"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">URL de la imagen que se usará como icono del equipo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <BoffButton type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </BoffButton>
          <BoffButton type="submit" disabled={isSubmitting || isLoadingEvents}>
            {submitLabel}
          </BoffButton>
        </div>
      </form>
    </Form>
  )
}
