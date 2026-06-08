import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BoffButton } from "@/components/boffmedia/primitives/button"
import { BoffInput } from "@/components/boffmedia/primitives/input"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Field } from "@/components/boffmedia/primitives/field"

const gameSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  icon: z.string().optional(),
})

export type GameFormValues = z.infer<typeof gameSchema>

interface GameFormProps {
  defaultValues?: Partial<GameFormValues>
  isSubmitting?: boolean
  onSubmit: (data: GameFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function GameForm({ defaultValues, isSubmitting, onSubmit, onCancel, submitLabel = "Guardar" }: GameFormProps) {
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      icon: "",
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
              <FormLabel className="text-[var(--text-muted)]">Título</FormLabel>
              <FormControl>
                <BoffInput placeholder="Nombre del juego" {...field} />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">Este será el nombre principal del juego.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el juego"
                  className="min-h-[100px] bg-[var(--surface-2)] border border-solid border-[var(--border-strong)] text-[var(--text)] rounded-[var(--btn-radius,9999px)] py-2.5 px-3.5 focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)] placeholder:text-[var(--text-dim)]"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">Proporciona una descripción detallada del juego.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[var(--text-muted)]">Icono URL</FormLabel>
              <FormControl>
                <BoffInput
                  placeholder="https://ejemplo.com/icono.jpg"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-[var(--text-dim)]">URL de la imagen que se usará como icono.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <BoffButton type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </BoffButton>
          <BoffButton type="submit" disabled={isSubmitting}>
            {submitLabel}
          </BoffButton>
        </div>
      </form>
    </Form>
  )
}
