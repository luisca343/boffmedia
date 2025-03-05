import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"

const achievementSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  icon: z.string().optional(),
  eventId: z.number(),
  points: z.number().min(0, "Los puntos no pueden ser negativos"),
})

export type AchievementFormValues = z.infer<typeof achievementSchema>

interface AchievementFormProps {
  defaultValues?: Partial<AchievementFormValues>
  isSubmitting?: boolean
  onSubmit: (data: AchievementFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function AchievementForm({
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
}: AchievementFormProps) {
  const { events, isLoading: isLoadingEvents } = useGetEvents()

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      icon: "",
      eventId: 0,
      points: 0,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pb-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Logro</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del logro"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>Este será el nombre que verán los usuarios.</FormDescription>
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
                  placeholder="Describe el logro"
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Una descripción clara de lo que representa este logro.</FormDescription>
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
              <FormDescription>Selecciona el evento al que pertenecerá este logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puntos</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Cantidad de puntos que otorga este logro.</FormDescription>
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
              <FormDescription>URL de la imagen que se usará como icono del logro.</FormDescription>
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

