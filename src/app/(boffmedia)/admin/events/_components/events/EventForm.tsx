import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetGames } from "@/hooks/events/useGetGames"

const eventSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  icon: z.string().optional(),
  gameId: z.number(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de finalización es requerida"),
  type: z.enum(["event", "server"]),
})

export type EventFormValues = z.infer<typeof eventSchema>

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  isSubmitting?: boolean
  onSubmit: (data: EventFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function EventForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: EventFormProps) {
  const { games, isLoading: isLoadingGames } = useGetGames()

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      icon: "",
      gameId: 0,
      startDate: "",
      endDate: "",
      type: "event",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del evento"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>Este será el nombre principal del evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el evento"
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Proporciona una descripción detallada del evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gameId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Juego</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingGames}
              >
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={isLoadingGames ? "Cargando juegos..." : "Selecciona un juego"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  {games?.map((game) => (
                    <SelectItem key={game.id} value={game.id!.toString()}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Selecciona el juego para este evento.</FormDescription>
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
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-surface-700 border-surface-600 text-surface-50"
                    {...field}
                  />
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
                <FormLabel>Fecha de Finalización</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="bg-surface-700 border-surface-600 text-surface-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Evento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="server">Servidor</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Selecciona el tipo de evento.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icono URL (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://ejemplo.com/icono.jpg"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>URL de la imagen que se usará como icono.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="border-surface-600 text-surface-300">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingGames}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

