import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Textarea } from "@/components/ui"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"

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
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del juego"
                  className="bg-surface-700 border-surface-600 text-surface-50"
                  {...field}
                />
              </FormControl>
              <FormDescription>Este será el nombre principal del juego.</FormDescription>
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
                  placeholder="Describe el juego"
                  className="bg-surface-700 border-surface-600 text-surface-50 min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Proporciona una descripción detallada del juego.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icono URL</FormLabel>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

