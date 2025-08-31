"use client"

import React from "react"
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
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-surface-800 via-surface-800 to-surface-700 rounded-xl p-8 mb-12 border border-surface-600 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent mb-2">
                Guía de Estilo BoffMedia
              </h1>
              <p className="text-surface-300 text-lg">Una colección de componentes UI con estilos personalizados</p>
            </div>
          </div>
        </div>

        {/* Enhanced Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          <ComponentSection title="Accordion">
            <Accordion type="single" collapsible className="w-full" variant="default">
              <AccordionItem value="item-1" className="border-surface-600">
                <AccordionTrigger className="text-surface-200 hover:text-primary-300">¿Es accesible?</AccordionTrigger>
                <AccordionContent className="text-surface-300">Sí. Cumple con el patrón de diseño WAI-ARIA.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-surface-600">
                <AccordionTrigger className="text-surface-200 hover:text-primary-300">¿Está estilizado?</AccordionTrigger>
                <AccordionContent className="text-surface-300">
                  Sí. Viene con estilos predeterminados que coinciden con la estética de los otros componentes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-surface-600">
                <AccordionTrigger className="text-surface-200 hover:text-primary-300">¿Está animado?</AccordionTrigger>
                <AccordionContent className="text-surface-300">
                  Sí. Está animado por defecto, pero puedes desactivarlo si lo prefieres.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ComponentSection>

          <ComponentSection title="Alert Dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">Mostrar Alerta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-surface-600">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-surface-100">¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription className="text-surface-300">
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
          </ComponentSection>

          <ComponentSection title="Avatar">
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <Avatar className="h-12 w-12 border-2 border-primary-400">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="bg-primary-600 text-white">CN</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10 border border-surface-600">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback className="bg-surface-700 text-surface-200">CN</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary-600 text-white text-xs">CN</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-surface-400 text-sm">Diferentes tamaños y estilos</p>
            </div>
          </ComponentSection>

          <ComponentSection title="Badge">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary-600 hover:bg-primary-700">Predeterminado</Badge>
                <Badge variant="secondary">Secundario</Badge>
                <Badge variant="destructive">Destructivo</Badge>
                <Badge variant="outline" className="border-surface-500 text-surface-200">Contorno</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success-600">Éxito</Badge>
                <Badge className="bg-warning-600">Advertencia</Badge>
                <Badge className="bg-info-600">Información</Badge>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Button" fullWidth>
            <div className="space-y-6">
              {/* Size Examples */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Ejemplos de tamaños</h4>
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
                <h4 className="text-surface-200 text-sm font-medium mb-3">Primarios</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="default">Predeterminado</Button>
                  <Button variant="outline">Contorno</Button>
                  <Button variant="ghost">Fantasma</Button>
                  <Button variant="link">Enlace</Button>
                </div>
              </div>

              {/* Secondary Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Secundarios</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="secondary">Secundario</Button>
                  <Button variant="secondaryOutline">Sec. Contorno</Button>
                  <Button variant="secondaryGhost">Sec. Fantasma</Button>
                  <Button variant="secondaryLink">Sec. Enlace</Button>
                </div>
              </div>

              {/* Highlight Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Destacados</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="highlight">Destacado</Button>
                  <Button variant="highlightOutline">Dest. Contorno</Button>
                  <Button variant="highlightGhost">Dest. Fantasma</Button>
                  <Button variant="highlightLink">Dest. Enlace</Button>
                </div>
              </div>

              {/* Accent Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Acentos</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="accent">Acento</Button>
                  <Button variant="accentOutline">Ac. Contorno</Button>
                  <Button variant="accentGhost">Ac. Fantasma</Button>
                  <Button variant="accentLink">Ac. Enlace</Button>
                </div>
              </div>

              {/* Success Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Éxito</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="success">Éxito</Button>
                  <Button variant="successOutline">Éx. Contorno</Button>
                  <Button variant="successGhost">Éx. Fantasma</Button>
                  <Button variant="successLink">Éx. Enlace</Button>
                </div>
              </div>

              {/* Info Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Información</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="info">Información</Button>
                  <Button variant="infoOutline">Info Contorno</Button>
                  <Button variant="infoGhost">Info Fantasma</Button>
                  <Button variant="infoLink">Info Enlace</Button>
                </div>
              </div>

              {/* Warning Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Advertencia</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="warning">Advertencia</Button>
                  <Button variant="warningOutline">Adv. Contorno</Button>
                  <Button variant="warningGhost">Adv. Fantasma</Button>
                  <Button variant="warningLink">Adv. Enlace</Button>
                </div>
              </div>

              {/* Error Variants */}
              <div>
                <h4 className="text-surface-200 text-sm font-medium mb-3">Error</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button variant="error">Error</Button>
                  <Button variant="errorOutline">Error Contorno</Button>
                  <Button variant="errorGhost">Error Fantasma</Button>
                  <Button variant="errorLink">Error Enlace</Button>
                </div>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Calendar">
            <div className="flex justify-center">
              <Calendar 
                mode="single" 
                selected={new Date()} 
                onSelect={() => {}} 
                className="w-full border border-surface-600 rounded-lg bg-surface-800" 
              />
            </div>
          </ComponentSection>

          <ComponentSection title="Card">
            <Card className="border-surface-600 hover:border-surface-500 transition-colors bg-surface-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">BM</span>
                  </div>
                  <div>
                    <CardTitle className="text-surface-100">Título de la Tarjeta</CardTitle>
                    <CardDescription className="text-surface-400">La descripción de la tarjeta va aquí</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-surface-200">
                <p>Este es el contenido principal de la tarjeta con información relevante.</p>
              </CardContent>
              <CardFooter className="pt-4 border-t border-surface-700">
                <Button className="w-full">Acción Principal</Button>
              </CardFooter>
            </Card>
          </ComponentSection>

          <ComponentSection title="Checkbox">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-surface-300 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceptar términos y condiciones
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="newsletter" defaultChecked />
                <label htmlFor="newsletter" className="text-surface-300 text-sm font-medium">
                  Suscribirse al boletín
                </label>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Collapsible">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between border-surface-600 hover:border-surface-500">
                  Haz clic para expandir 
                  <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 mt-2 border border-surface-600 rounded-md bg-surface-800 text-surface-200">
                Este es el contenido que se expande y colapsa. Puede contener cualquier tipo de información adicional.
              </CollapsibleContent>
            </Collapsible>
          </ComponentSection>

          <ComponentSection title="Combobox">
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
          </ComponentSection>

          <ComponentSection title="Command">
            <Command className="rounded-lg border border-surface-600 shadow-md bg-surface-800">
              <CommandInput placeholder="Escribe un comando o busca..." className="border-none" />
              <CommandList>
                <CommandEmpty className="text-surface-400">No se encontraron resultados.</CommandEmpty>
                <CommandGroup heading="Sugerencias">
                  <CommandItem className="hover:bg-surface-700">📅 Calendario</CommandItem>
                  <CommandItem className="hover:bg-surface-700">😀 Buscar Emoji</CommandItem>
                  <CommandItem className="hover:bg-surface-700">🔢 Calculadora</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </ComponentSection>

          <ComponentSection title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Abrir Diálogo</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-surface-600 bg-surface-800">
                <DialogHeader>
                  <DialogTitle className="text-surface-100">Editar perfil</DialogTitle>
                  <DialogDescription className="text-surface-300">
                    Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-surface-200">
                      Nombre
                    </Label>
                    <Input id="name" value="Pedro Duarte" className="col-span-3 bg-surface-700 border-surface-600" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right text-surface-200">
                      Usuario
                    </Label>
                    <Input id="username" value="@peduarte" className="col-span-3 bg-surface-700 border-surface-600" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ComponentSection>

          <ComponentSection title="Form" fullWidth>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(() => {})} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-surface-200">Nombre de usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} className="bg-surface-700 border-surface-600" />
                      </FormControl>
                      <FormDescription className="text-surface-400">
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
                      <FormLabel className="text-surface-200">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@ejemplo.com" {...field} className="bg-surface-700 border-surface-600" />
                      </FormControl>
                      <FormDescription className="text-surface-400">
                        Tu dirección de correo electrónico.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Enviar Formulario</Button>
              </form>
            </Form>
          </ComponentSection>

          <ComponentSection title="Hover Card">
            <div className="flex justify-center">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link" className="text-primary-400 hover:text-primary-300">@nextjs</Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 border-surface-600 bg-surface-800">
                  <div className="flex justify-between space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/vercel.png" />
                      <AvatarFallback className="bg-primary-600 text-white">VC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-surface-100">@nextjs</h4>
                      <p className="text-sm text-surface-300">El framework React para la Web</p>
                      <div className="flex items-center pt-2">
                        <span className="text-xs text-surface-400">Creado por @vercel</span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </ComponentSection>

          <ComponentSection title="Input">
            <div className="space-y-4">
              <Input 
                type="email" 
                placeholder="Email" 
                className="bg-surface-700 border-surface-600 focus:border-primary-500" 
              />
              <Input 
                type="password" 
                placeholder="Contraseña" 
                className="bg-surface-700 border-surface-600 focus:border-primary-500" 
              />
              <Input 
                type="text" 
                placeholder="Deshabilitado" 
                disabled 
                className="bg-surface-800 border-surface-700" 
              />
            </div>
          </ComponentSection>

          <ComponentSection title="Label">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-surface-200">Email</Label>
                <Input 
                  type="email" 
                  id="email" 
                  placeholder="m@example.com" 
                  className="bg-surface-700 border-surface-600" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="required" className="text-surface-200">Campo requerido *</Label>
                <Input 
                  type="text" 
                  id="required" 
                  placeholder="Campo obligatorio" 
                  className="bg-surface-700 border-surface-600" 
                />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Popover">
            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Abrir popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 border-surface-600 bg-surface-800">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none text-surface-100">Dimensiones</h4>
                      <p className="text-sm text-surface-400">Establece las dimensiones para la capa.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width" className="text-surface-200">Ancho</Label>
                        <Input id="width" defaultValue="100%" className="col-span-2 h-8 bg-surface-700 border-surface-600" />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="maxWidth" className="text-surface-200">Ancho máx.</Label>
                        <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8 bg-surface-700 border-surface-600" />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </ComponentSection>

          <ComponentSection title="Select">
            <div className="space-y-4">
              <Select>
                <SelectTrigger className="w-full bg-surface-700 border-surface-600">
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent className="bg-surface-800 border-surface-600">
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full bg-surface-700 border-surface-600">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent className="bg-surface-800 border-surface-600">
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ComponentSection>

          <ComponentSection title="Separator">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-surface-200 text-sm font-medium leading-none">Radix Primitives</h4>
                <p className="text-sm text-surface-400">Una biblioteca de componentes UI de código abierto.</p>
              </div>
              <Separator className="my-4 bg-surface-700" />
              <div className="flex h-5 items-center space-x-4 text-sm text-surface-300">
                <div>Blog</div>
                <Separator orientation="vertical" className="bg-surface-600" />
                <div>Docs</div>
                <Separator orientation="vertical" className="bg-surface-600" />
                <div>Source</div>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Sheet">
            <div className="flex justify-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Abrir hoja</Button>
                </SheetTrigger>
                <SheetContent className="bg-surface-800 border-surface-600">
                  <SheetHeader>
                    <SheetTitle className="text-surface-100">Configuración</SheetTitle>
                    <SheetDescription className="text-surface-300">
                      Ajusta tu configuración desde este panel lateral.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-surface-200">Notificaciones</Label>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-surface-200">Tema oscuro</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </ComponentSection>

          <ComponentSection title="Skeleton">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full bg-surface-700" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px] bg-surface-700" />
                  <Skeleton className="h-4 w-[200px] bg-surface-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-surface-700" />
                <Skeleton className="h-4 w-4/5 bg-surface-700" />
                <Skeleton className="h-4 w-3/5 bg-surface-700" />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Slider">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-surface-200">Volumen: 33%</Label>
                <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
              </div>
              <div className="space-y-2">
                <Label className="text-surface-200">Rango: 25% - 75%</Label>
                <Slider defaultValue={[25, 75]} max={100} step={1} className="w-full" />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Switch">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="airplane-mode" className="text-surface-200">Modo avión</Label>
                <Switch id="airplane-mode" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-surface-200">Notificaciones</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-surface-200">Servicios de ubicación</Label>
                <Switch id="location" />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection title="Table" fullWidth>
            <div className="rounded-md border border-surface-600 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-surface-600 hover:bg-surface-800">
                    <TableHead className="w-[100px] text-surface-200">ID</TableHead>
                    <TableHead className="text-surface-200">Nombre</TableHead>
                    <TableHead className="text-surface-200">Estado</TableHead>
                    <TableHead className="text-right text-surface-200">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-surface-600 hover:bg-surface-800">
                    <TableCell className="font-medium text-surface-300">001</TableCell>
                    <TableCell className="text-surface-200">Juan Pérez</TableCell>
                    <TableCell>
                      <Badge className="bg-success-600">Activo</Badge>
                    </TableCell>
                    <TableCell className="text-right text-surface-200">$250.00</TableCell>
                  </TableRow>
                  <TableRow className="border-surface-600 hover:bg-surface-800">
                    <TableCell className="font-medium text-surface-300">002</TableCell>
                    <TableCell className="text-surface-200">María García</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Inactivo</Badge>
                    </TableCell>
                    <TableCell className="text-right text-surface-200">$150.00</TableCell>
                  </TableRow>
                  <TableRow className="border-surface-600 hover:bg-surface-800">
                    <TableCell className="font-medium text-surface-300">003</TableCell>
                    <TableCell className="text-surface-200">Carlos López</TableCell>
                    <TableCell>
                      <Badge className="bg-warning-600">Pendiente</Badge>
                    </TableCell>
                    <TableCell className="text-right text-surface-200">$320.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </ComponentSection>

          <ComponentSection title="Tabs" fullWidth>
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-surface-700">
                <TabsTrigger value="account" className="data-[state=active]:bg-surface-600">Cuenta</TabsTrigger>
                <TabsTrigger value="password" className="data-[state=active]:bg-surface-600">Contraseña</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <Card className="border-surface-600 bg-surface-800">
                  <CardHeader>
                    <CardTitle className="text-surface-100">Cuenta</CardTitle>
                    <CardDescription className="text-surface-400">
                      Realiza cambios en tu cuenta aquí. Haz clic en guardar cuando hayas terminado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-surface-200">Nombre</Label>
                      <Input id="name" defaultValue="Pedro Duarte" className="bg-surface-700 border-surface-600" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="username" className="text-surface-200">Nombre de usuario</Label>
                      <Input id="username" defaultValue="@peduarte" className="bg-surface-700 border-surface-600" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Guardar cambios</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="password">
                <Card className="border-surface-600 bg-surface-800">
                  <CardHeader>
                    <CardTitle className="text-surface-100">Contraseña</CardTitle>
                    <CardDescription className="text-surface-400">
                      Cambia tu contraseña aquí. Después de guardar, se cerrará tu sesión.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current" className="text-surface-200">Contraseña actual</Label>
                      <Input id="current" type="password" className="bg-surface-700 border-surface-600" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new" className="text-surface-200">Nueva contraseña</Label>
                      <Input id="new" type="password" className="bg-surface-700 border-surface-600" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Guardar contraseña</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </ComponentSection>

          <ComponentSection title="Textarea">
            <div className="space-y-4">
              <Textarea 
                placeholder="Escribe tu mensaje aquí." 
                className="bg-surface-700 border-surface-600 focus:border-primary-500 resize-none"
                rows={4}
              />
              <Textarea 
                placeholder="Comentarios adicionales (opcional)" 
                className="bg-surface-700 border-surface-600 focus:border-primary-500"
                rows={2}
              />
            </div>
          </ComponentSection>

          <ComponentSection title="Tooltip">
            <div className="flex justify-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Pasa el cursor</Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-surface-700 border-surface-600">
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
                  <TooltipContent className="bg-surface-700 border-surface-600">
                    <p>Información adicional</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </ComponentSection>
        </div>
      </div>
    </div>
  )
}

// Enhanced Component Section wrapper with better styling
function ComponentSection({
  title,
  children,
  fullWidth = false,
}: {
  title: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={`${fullWidth ? "col-span-1 md:col-span-2" : ""}`}>
      <div className="bg-surface-800 rounded-xl p-6 h-full border border-surface-700 hover:border-surface-600 transition-all duration-300 shadow-lg hover:shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full"></div>
          <h2 className="text-xl font-semibold text-primary-300 tracking-tight">{title}</h2>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}