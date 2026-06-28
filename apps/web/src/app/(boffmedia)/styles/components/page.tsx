"use client"

import React from "react"
import { SectionPanel } from "@/components/ui/display/SectionPanel"
import { Button } from "@/components/ui/primitives/button"
import { Input } from "@/components/ui/primitives/input"
import { Label } from "@/components/ui/primitives/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/primitives/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/primitives/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/primitives/dialog"
import { Badge } from "@/components/ui/primitives/badge"
import { Checkbox } from "@/components/ui/primitives/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/primitives/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/primitives/command"
import { Combobox } from "@/components/ui/primitives/combobox"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/primitives/collapsible"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/primitives/hover-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/primitives/sheet"
import { Switch } from "@/components/ui/primitives/switch"
import { Slider } from "@/components/ui/primitives/slider"
import { Skeleton } from "@/components/ui/primitives/skeleton"
import { Separator } from "@/components/ui/primitives/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/primitives/form"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/primitives/tooltip"
import { useForm } from "react-hook-form"
import { Calendar } from "@/components/ui/primitives/calendar"

export default function BoffMediaStyleGuide() {
  const [comboboxValue, setComboboxValue] = React.useState("")
  const form = useForm()

  return (
    <div className="min-h-screen bg-gradient-to-br from-base via-layer-1 to-base relative pt-16">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="container mx-auto px-4 py-12 max-w-7xl relative">
        {/* Gaming Header */}
        <div className="relative rounded-2xl overflow-hidden border border-edge/70 shadow-2xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-layer-1 via-layer-2 to-layer-1" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-active/[0.07] via-transparent to-secondary-active/[0.04]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-hover/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-layer-3/40 to-transparent" />
          <div className="relative p-8 flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-active flex items-center justify-center shadow-lg shadow-primary-soft/60 ring-1 ring-primary/30">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-primary-hover">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-hover animate-pulse" />
                  SISTEMA ACTIVO
                </div>
                <span className="text-[10px] font-mono text-ink-muted tracking-wider">v2.0.0</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 leading-tight">
                <span className="bg-gradient-to-r from-white via-primary-soft to-primary-hover bg-clip-text text-transparent">
                  Guía de Estilo BoffMedia
                </span>
              </h1>
              <p className="text-ink-muted text-sm max-w-xl">
                Colección de componentes UI — diseño gaming moderno con tokens de color, interacciones y tipografía coherentes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          <SectionPanel title="Accordion">
            <Accordion type="single" collapsible className="w-full" variant="default">
              <AccordionItem value="item-1" className="border-edge">
                <AccordionTrigger className="text-ink hover:text-primary-hover">¿Es accesible?</AccordionTrigger>
                <AccordionContent className="text-ink">Sí. Cumple con el patrón de diseño WAI-ARIA.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-edge">
                <AccordionTrigger className="text-ink hover:text-primary-hover">¿Está estilizado?</AccordionTrigger>
                <AccordionContent className="text-ink">
                  Sí. Viene con estilos predeterminados que coinciden con la estética de los otros componentes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-edge">
                <AccordionTrigger className="text-ink hover:text-primary-hover">¿Está animado?</AccordionTrigger>
                <AccordionContent className="text-ink">
                  Sí. Está animado por defecto, pero puedes desactivarlo si lo prefieres.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SectionPanel>

          <SectionPanel title="Alert Dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">Mostrar Alerta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-edge">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-ink">¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-ink">
                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y removerá tus datos de
                    nuestros servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction>Continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SectionPanel>

          <SectionPanel title="Avatar">
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="bg-primary-active text-white">CN</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10 border border-edge">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="bg-layer-3 text-ink">CN</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary-active text-white text-xs">CN</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-ink-muted text-sm">Diferentes tamaños y estilos</p>
            </div>
          </SectionPanel>

          <SectionPanel title="Badge">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Predeterminado</Badge>
                <Badge variant="secondary">Secundario</Badge>
                <Badge variant="destructive">Destructivo</Badge>
                <Badge variant="outline">Contorno</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Éxito</Badge>
                <Badge className="bg-warning text-white border-0">Advertencia</Badge>
                <Badge className="bg-info text-white border-0">Información</Badge>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Button" fullWidth>
            <div className="space-y-6">
              {/* Size Examples */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Ejemplos de tamaños</h4>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button size="sm">Pequeño</Button>
                  <Button>Predeterminado</Button>
                  <Button size="lg">Grande</Button>
                  <Button size="xl">Extra grande</Button>
                  <Button size="icon" aria-label="Icono">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </Button>
                </div>
              </div>

              {/* Primary Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Primarios</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="default">Predeterminado</Button>
                  <Button variant="outline">Contorno</Button>
                  <Button variant="ghost">Fantasma</Button>
                  <Button variant="link">Enlace</Button>
                </div>
              </div>

              {/* Secondary Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Secundarios</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="secondary">Secundario</Button>
                  <Button variant="secondaryOutline">Sec. Contorno</Button>
                  <Button variant="secondaryGhost">Sec. Fantasma</Button>
                  <Button variant="secondaryLink">Sec. Enlace</Button>
                </div>
              </div>

              {/* Highlight Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Destacados</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="highlight">Destacado</Button>
                  <Button variant="highlightOutline">Dest. Contorno</Button>
                  <Button variant="highlightGhost">Dest. Fantasma</Button>
                  <Button variant="highlightLink">Dest. Enlace</Button>
                </div>
              </div>

              {/* Accent Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Acentos</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="accent">Acento</Button>
                  <Button variant="accentOutline">Ac. Contorno</Button>
                  <Button variant="accentGhost">Ac. Fantasma</Button>
                  <Button variant="accentLink">Ac. Enlace</Button>
                </div>
              </div>

              {/* Success Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Éxito</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="success">Éxito</Button>
                  <Button variant="successOutline">Éx. Contorno</Button>
                  <Button variant="successGhost">Éx. Fantasma</Button>
                  <Button variant="successLink">Éx. Enlace</Button>
                </div>
              </div>

              {/* Info Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Información</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="info">Información</Button>
                  <Button variant="infoOutline">Info Contorno</Button>
                  <Button variant="infoGhost">Info Fantasma</Button>
                  <Button variant="infoLink">Info Enlace</Button>
                </div>
              </div>

              {/* Warning Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Advertencia</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="warning">Advertencia</Button>
                  <Button variant="warningOutline">Adv. Contorno</Button>
                  <Button variant="warningGhost">Adv. Fantasma</Button>
                  <Button variant="warningLink">Adv. Enlace</Button>
                </div>
              </div>

              {/* Error Variants */}
              <div>
                <h4 className="text-ink text-sm font-medium mb-3">Error</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="error">Error</Button>
                  <Button variant="errorOutline">Error Contorno</Button>
                  <Button variant="errorGhost">Error Fantasma</Button>
                  <Button variant="errorLink">Error Enlace</Button>
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Calendar">
            <div className="flex justify-center">
              <Calendar 
                mode="single" 
                selected={new Date()} 
                onSelect={() => {}} 
                className="w-full border border-edge rounded-lg bg-layer-2" 
              />
            </div>
          </SectionPanel>

          <SectionPanel title="Card">
            <Card className="hover:shadow-primary-soft/40">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">BM</span>
                  </div>
                  <div>
                    <CardTitle className="text-ink">Título de la Tarjeta</CardTitle>
                    <CardDescription className="text-ink-muted">La descripción de la tarjeta va aquí</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-ink">
                <p>Este es el contenido principal de la tarjeta con información relevante.</p>
              </CardContent>
              <CardFooter className="pt-4 border-t border-edge/60">
                <Button className="w-full">Acción Principal</Button>
              </CardFooter>
            </Card>
          </SectionPanel>

          <SectionPanel title="Checkbox">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-ink text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceptar términos y condiciones
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="newsletter" defaultChecked />
                <label htmlFor="newsletter" className="text-ink text-sm font-medium">
                  Suscribirse al boletín
                </label>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Collapsible">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between border-edge hover:border-edge">
                  Haz clic para expandir 
                  <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 mt-2 border border-edge rounded-md bg-layer-2 text-ink">
                Este es el contenido que se expande y colapsa. Puede contener cualquier tipo de información adicional.
              </CollapsibleContent>
            </Collapsible>
          </SectionPanel>

          <SectionPanel title="Combobox">
            <Combobox
              data={[
                { label: "Inglés", value: "en" },
                { label: "Francés", value: "fr" },
                { label: "Alemán", value: "de" },
                { label: "Español", value: "es" },
                { label: "Portugués", value: "pt" },
                { label: "Ruso", value: "ru" },
                { label: "Japonés", value: "ja" },
              ]}
              value={comboboxValue}
              onChange={setComboboxValue}
              placeholder="Selecciona un idioma"
            />
          </SectionPanel>

          <SectionPanel title="Command">
            <Command className="rounded-lg border border-edge shadow-md bg-layer-2">
              <CommandInput placeholder="Escribe un comando o busca..." className="border-none" />
              <CommandList>
                <CommandEmpty className="text-ink-muted">No se encontraron resultados.</CommandEmpty>
                <CommandGroup heading="Sugerencias">
                  <CommandItem className="hover:bg-layer-3">📅 Calendario</CommandItem>
                  <CommandItem className="hover:bg-layer-3">😀 Buscar Emoji</CommandItem>
                  <CommandItem className="hover:bg-layer-3">🔢 Calculadora</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </SectionPanel>

          <SectionPanel title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Abrir Diálogo</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-edge bg-layer-2">
                <DialogHeader>
                  <DialogTitle className="text-ink">Editar perfil</DialogTitle>
                  <DialogDescription className="text-ink">
                    Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-ink">
                      Nombre
                    </Label>
                    <Input id="name" value="Pedro Duarte" className="col-span-3 bg-layer-3 border-edge" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right text-ink">
                      Usuario
                    </Label>
                    <Input id="username" value="@peduarte" className="col-span-3 bg-layer-3 border-edge" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SectionPanel>

          <SectionPanel title="Form" fullWidth>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => {})} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-ink">Nombre de usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} className="bg-layer-3 border-edge" />
                      </FormControl>
                      <FormDescription className="text-ink-muted">
                        Este es tu nombre de usuario público.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-ink">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@ejemplo.com" {...field} className="bg-layer-3 border-edge" />
                      </FormControl>
                      <FormDescription className="text-ink-muted">
                        Tu dirección de correo electrónico.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Enviar Formulario</Button>
              </form>
            </Form>
          </SectionPanel>

          <SectionPanel title="Hover Card">
            <div className="flex justify-center">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link" className="text-primary-hover hover:text-primary-hover">@nextjs</Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 border-edge bg-layer-2">
                  <div className="flex justify-between space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/vercel.png" />
                      <AvatarFallback className="bg-primary-active text-white">VC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-ink">@nextjs</h4>
                      <p className="text-sm text-ink">El framework React para la Web</p>
                      <div className="flex items-center pt-2">
                        <span className="text-xs text-ink-muted">Creado por @vercel</span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </SectionPanel>

          <SectionPanel title="Input">
            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="Email" 
                className="bg-layer-3 border-edge focus:border-primary" 
              />
              <Input 
                type="password" 
                placeholder="Contraseña" 
                className="bg-layer-3 border-edge focus:border-primary" 
              />
              <Input 
                type="text" 
                placeholder="Deshabilitado" 
                disabled 
                className="bg-layer-2 border-edge" 
              />
            </div>
          </SectionPanel>

          <SectionPanel title="Label">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ink">Email</Label>
                <Input 
                  type="email" 
                  id="email" 
                  placeholder="m@example.com" 
                  className="bg-layer-3 border-edge" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="required" className="text-ink">Campo requerido *</Label>
                <Input 
                  type="text" 
                  id="required" 
                  placeholder="Campo obligatorio" 
                  className="bg-layer-3 border-edge" 
                />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Popover">
            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Abrir popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 border-edge bg-layer-2">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none text-ink">Dimensiones</h4>
                      <p className="text-sm text-ink-muted">Establece las dimensiones para la capa.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width" className="text-ink">Ancho</Label>
                        <Input id="width" defaultValue="100%" className="col-span-2 h-8 bg-layer-3 border-edge" />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="maxWidth" className="text-ink">Ancho máx.</Label>
                        <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8 bg-layer-3 border-edge" />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </SectionPanel>

          <SectionPanel title="Select">
            <div className="space-y-4">
              <Select>
                <SelectTrigger className="w-full bg-layer-3 border-edge">
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent className="bg-layer-2 border-edge">
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full bg-layer-3 border-edge">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent className="bg-layer-2 border-edge">
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionPanel>

          <SectionPanel title="Separator">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-ink text-sm font-medium leading-none">Radix Primitives</h4>
                <p className="text-sm text-ink-muted">Una biblioteca de componentes UI de código abierto.</p>
              </div>
              <Separator className="my-4 bg-layer-3" />
              <div className="flex h-5 items-center space-x-4 text-sm text-ink">
                <div>Blog</div>
                <Separator orientation="vertical" className="bg-layer-3" />
                <div>Docs</div>
                <Separator orientation="vertical" className="bg-layer-3" />
                <div>Source</div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Sheet">
            <div className="flex justify-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Abrir hoja</Button>
                </SheetTrigger>
                <SheetContent className="bg-layer-2 border-edge">
                  <SheetHeader>
                    <SheetTitle className="text-ink">Configuración</SheetTitle>
                    <SheetDescription className="text-ink">
                      Ajusta tu configuración desde este panel lateral.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-ink">Notificaciones</Label>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-ink">Tema oscuro</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </SectionPanel>

          <SectionPanel title="Skeleton">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full bg-layer-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px] bg-layer-3" />
                  <Skeleton className="h-4 w-[200px] bg-layer-3" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-layer-3" />
                <Skeleton className="h-4 w-4/5 bg-layer-3" />
                <Skeleton className="h-4 w-3/5 bg-layer-3" />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Slider">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-ink">Volumen: 33%</Label>
                <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label className="text-ink">Rango: 25% - 75%</Label>
                <Slider defaultValue={[25, 75]} max={100} step={1} className="w-full" />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Switch">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="airplane-mode" className="text-ink">Modo avión</Label>
                <Switch id="airplane-mode" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-ink">Notificaciones</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-ink">Servicios de ubicación</Label>
                <Switch id="location" />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel title="Table" fullWidth>
            <div className="rounded-md border border-edge overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-edge hover:bg-layer-2">
                    <TableHead className="w-[100px] text-ink">ID</TableHead>
                    <TableHead className="text-ink">Nombre</TableHead>
                    <TableHead className="text-ink">Estado</TableHead>
                    <TableHead className="text-right text-ink">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-edge hover:bg-layer-2">
                    <TableCell className="font-medium text-ink">001</TableCell>
                    <TableCell className="text-ink">Juan Pérez</TableCell>
                    <TableCell>
                      <Badge className="bg-success">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right text-ink">$250.00</TableCell>
                  </TableRow>
                  <TableRow className="border-edge hover:bg-layer-2">
                    <TableCell className="font-medium text-ink">002</TableCell>
                    <TableCell className="text-ink">María García</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Inactivo</Badge>
                    </TableCell>
                    <TableCell className="text-right text-ink">$150.00</TableCell>
                  </TableRow>
                  <TableRow className="border-edge hover:bg-layer-2">
                    <TableCell className="font-medium text-ink">003</TableCell>
                    <TableCell className="text-ink">Carlos López</TableCell>
                    <TableCell>
                      <Badge className="bg-warning">Pendiente</Badge>
                    </TableCell>
                    <TableCell className="text-right text-ink">$320.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </SectionPanel>

          <SectionPanel title="Tabs" fullWidth>
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-layer-3">
                <TabsTrigger value="account" className="data-[state=active]:bg-layer-3">Cuenta</TabsTrigger>
                <TabsTrigger value="password" className="data-[state=active]:bg-layer-3">Contraseña</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <Card className="border-edge bg-layer-2">
                  <CardHeader>
                    <CardTitle className="text-ink">Cuenta</CardTitle>
                    <CardDescription className="text-ink-muted">
                      Realiza cambios en tu cuenta aquí. Haz clic en guardar cuando hayas terminado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-ink">Nombre</Label>
                      <Input id="name" defaultValue="Pedro Duarte" className="bg-layer-3 border-edge" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="username" className="text-ink">Nombre de usuario</Label>
                      <Input id="username" defaultValue="@peduarte" className="bg-layer-3 border-edge" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Guardar cambios</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="password">
                <Card className="border-edge bg-layer-2">
                  <CardHeader>
                    <CardTitle className="text-ink">Contraseña</CardTitle>
                    <CardDescription className="text-ink-muted">
                      Cambia tu contraseña aquí. Después de guardar, se cerrará tu sesión.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current" className="text-ink">Contraseña actual</Label>
                      <Input id="current" type="password" className="bg-layer-3 border-edge" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new" className="text-ink">Nueva contraseña</Label>
                      <Input id="new" type="password" className="bg-layer-3 border-edge" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Guardar contraseña</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </SectionPanel>

          <SectionPanel title="Textarea">
            <div className="space-y-4">
              <Textarea 
                placeholder="Escribe tu mensaje aquí." 
                className="bg-layer-3 border-edge focus:border-primary resize-none"
                rows={4}
              />
              <Textarea 
                placeholder="Comentarios adicionales (opcional)" 
                className="bg-layer-3 border-edge focus:border-primary"
                rows={2}
              />
            </div>
          </SectionPanel>

          <SectionPanel title="Tooltip">
            <div className="flex justify-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Pasa el cursor</Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-layer-3 border-edge">
                    <p>Añade al carrito</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-layer-3 border-edge">
                    <p>Información adicional</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </SectionPanel>
        </div>
      </div>
    </div>
  )
}

