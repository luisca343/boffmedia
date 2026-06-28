import { useForm, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { BoffInput } from "@/components/boffmedia/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetGames } from "@/hooks/events/useGetGames"
import type { Event } from "@boffmedia/shared"

const eventSchema = z.object({
  id: z.number().optional(),
  parentId: z.number().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  icon: z.string().optional(),
  banner: z.string().optional(),
  gameId: z.number(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: z.enum(["event", "server"]),
  visibility: z.enum(["public", "private"]),
})

export type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  isSubmitting?: boolean
  onSubmit: (data: EventFormValues) => void
  onCancel: () => void
  submitLabel?: string
  parentEvent?: Event | null
}

export function EventForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
  parentEvent,
}: EventFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()
  const { games, isLoading: isLoadingGames } = useGetGames()
  
  const parentEvents =
    events?.filter(
      (event) =>
        event.type === "server" &&
        event.id !== defaultValues?.id && 
        !event.parentId,
    ) || []

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      ...defaultValues,
      parentId: parentEvent?.id,
      type: defaultValues?.type || (parentEvent ? "event" : "server"),
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      icon: defaultValues?.icon ?? "",
      banner: defaultValues?.banner ?? "",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      visibility: defaultValues?.visibility ?? "public",
    },
  })

  const parentIdValue = useWatch({ control: form.control, name: "parentId" })
  const typeValue = useWatch({ control: form.control, name: "type" })
  const isChildEvent = Boolean(parentIdValue)

  useEffect(() => {
    if (isChildEvent && typeValue === "server") {
      form.setValue("type", "event")
    }
  }, [isChildEvent, typeValue, form])

  const selectTriggerClass = "bg-layer-2 border border-solid border-edge-strong text-ink py-2.5 px-3.5 focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]"
  const selectContentClass = "bg-layer-1 border-edge-strong text-ink"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        {!parentEvent && ( 
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Servidor Principal (Opcional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                  defaultValue={field.value?.toString()}
                  disabled={isLoadingEvents}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Selecciona un servidor principal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value={"-1"}>Ninguno (Evento independiente)</SelectItem>
                    {parentEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-ink-dim">
                  {isChildEvent
                    ? "Este evento será parte de un servidor principal."
                    : "Opcionalmente, este evento puede ser parte de un servidor principal."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Título</FormLabel>
              <FormControl>
                <BoffInput placeholder="Nombre del evento" {...field} />
              </FormControl>
              <FormDescription className="text-ink-dim">Este será el nombre principal del evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el evento"
                  className="min-h-[100px] bg-layer-2 border border-solid border-edge-strong text-ink rounded-[var(--btn-radius,9999px)] py-2.5 px-3.5 focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)] placeholder:text-ink-dim"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">Proporciona una descripción detallada del evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gameId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Juego</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingGames}
              >
                <FormControl>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder={isLoadingGames ? "Cargando juegos..." : "Selecciona un juego"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={selectContentClass}>
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id.toString()}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-ink-dim">Selecciona el juego para este evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Fecha de Inicio</FormLabel>
                <FormControl>
                  <BoffInput type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Fecha de Finalización</FormLabel>
                <FormControl>
                  <BoffInput type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Tipo de Evento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isChildEvent}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="server">Servidor</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-ink-dim">
                  {isChildEvent
                    ? "Los eventos dentro de un servidor son siempre de tipo 'evento'."
                    : "Selecciona el tipo de evento."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Visibilidad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Selecciona la visibilidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-ink-dim">Controla quién puede ver este evento.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Icono URL (opcional)</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="https://ejemplo.com/icono.jpg"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">URL de la imagen que se usará como icono.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Banner URL (opcional)</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="https://ejemplo.com/banner.jpg"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">URL de la imagen que se usará como banner.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <BoffButton type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </BoffButton>
          <BoffButton type="submit" disabled={isSubmitting || isLoadingGames}>
            {submitLabel}
          </BoffButton>
        </div>
      </form>
    </Form>
  )
}
