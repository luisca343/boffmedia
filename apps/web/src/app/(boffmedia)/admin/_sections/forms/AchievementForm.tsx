import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { BoffInput } from "@/components/boffmedia/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { CreateAchievementDto } from "@boffmedia/shared"

const achievementSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  icon: z.string().min(1, "El icono es requerido"),
  eventId: z.number(),
  points: z.number().min(0, "Los puntos no pueden ser negativos"),
  maxProgress: z.number().min(1, "El progreso máximo debe ser al menos 1"),
  itemType: z.nativeEnum(CreateAchievementDto.itemType).optional(),
  category: z.nativeEnum(CreateAchievementDto.category).optional(),
  rarity: z.nativeEnum(CreateAchievementDto.rarity).optional(),
  order: z.number().optional(),
  active: z.number().optional(),
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
      maxProgress: 1,
      itemType: CreateAchievementDto.itemType.ACHIEVEMENT,
      category: CreateAchievementDto.category.CHALLENGE,
      rarity: CreateAchievementDto.rarity.BRONZE,
      order: 0,
      active: 1,
    },
  })

  const selectTriggerClass = "bg-layer-2 border border-solid border-edge-strong text-ink py-2.5 px-3.5 focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)]"
  const selectContentClass = "bg-layer-1 border-edge-strong text-ink"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pb-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Nombre del Logro</FormLabel>
              <FormControl>
                <BoffInput placeholder="Nombre del logro" {...field} />
              </FormControl>
              <FormDescription className="text-ink-dim">Este será el nombre que verán los usuarios.</FormDescription>
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
                  placeholder="Describe el logro"
                  className="min-h-[100px] bg-layer-2 border border-solid border-edge-strong text-ink rounded-[var(--btn-radius,9999px)] py-2.5 px-3.5 focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_var(--secondary-soft)] placeholder:text-ink-dim"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">Una descripción clara de lo que representa este logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Evento</FormLabel>
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
              <FormDescription className="text-ink-dim">Selecciona el evento al que pertenecerá este logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Puntos</FormLabel>
              <FormControl>
                <BoffInput
                  type="number"
                  placeholder="100"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">Cantidad de puntos que otorga este logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Icono</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="/icons/achievement.png"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">Ruta del icono del logro (ej: /icons/achievement.png).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxProgress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Progreso Máximo</FormLabel>
              <FormControl>
                <BoffInput
                  type="number"
                  placeholder="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription className="text-ink-dim">Cantidad máxima de progreso necesaria para completar el logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Tipo de Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={selectContentClass}>
                  <SelectItem value={CreateAchievementDto.itemType.ACHIEVEMENT}>Logro</SelectItem>
                  <SelectItem value={CreateAchievementDto.itemType.MEDAL}>Medalla</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-ink-dim">Tipo de recompensa que representa este item.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Categoría</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Selecciona la categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={selectContentClass}>
                  <SelectItem value={CreateAchievementDto.category.CHALLENGE}>Desafío</SelectItem>
                  <SelectItem value={CreateAchievementDto.category.COMPETITION}>Competición</SelectItem>
                  <SelectItem value={CreateAchievementDto.category.PARTICIPATION}>Participación</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-ink-dim">Categoría del logro para organización.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rarity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-ink-muted">Rareza</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Selecciona la rareza" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={selectContentClass}>
                  <SelectItem value={CreateAchievementDto.rarity.BRONZE}>Bronce</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.SILVER}>Plata</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.GOLD}>Oro</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.PLATINUM}>Platino</SelectItem>
                  <SelectItem value={CreateAchievementDto.rarity.DIAMOND}>Diamante</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-ink-dim">Nivel de rareza y dificultad del logro.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Orden</FormLabel>
                <FormControl>
                  <BoffInput
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription className="text-ink-dim">Orden de visualización.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-ink-muted">Estado</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="1">Activo</SelectItem>
                    <SelectItem value="0">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-ink-dim">Si el logro está activo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
