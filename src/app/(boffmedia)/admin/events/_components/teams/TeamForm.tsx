import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  defaultValues?: Partial<TeamFormValues>
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Equipo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del equipo"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>Este será el nombre principal del equipo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag del Equipo</FormLabel>
              <FormControl>
                <Input
                  placeholder="TAG"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>Un identificador corto para el equipo (máx. 5 caracteres).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Evento</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
                disabled={isLoadingEvents}
              >
                <FormControl>
                  <SelectTrigger className="bg-surface-700 border-surface-600 text-surface-50">
                    <SelectValue placeholder={isLoadingEvents ? "Cargando eventos..." : "Selecciona un evento"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-surface-800 border-surface-700">
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Selecciona el evento al que pertenecerá este equipo.</FormDescription>
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
              <FormDescription>URL de la imagen que se usará como icono del equipo.</FormDescription>
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
            disabled={isSubmitting || isLoadingEvents}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

