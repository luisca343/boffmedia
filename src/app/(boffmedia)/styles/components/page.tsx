"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Combobox } from "@/components/ui/combobox"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useForm } from "react-hook-form"
import { Calendar } from "@/components/ui/calendar"

export default function BoffMediaStyleGuide() {
  const [comboboxValue, setComboboxValue] = React.useState("")
  const form = useForm()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-surface-800 rounded-lg p-6 mb-8">
        <h1 className="text-4xl font-bold text-primary-300 mb-2">Guía de Estilo BoffMedia</h1>
        <p className="text-surface-300">Una colección de componentes UI con estilos personalizados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ComponentSection title="Accordion">
          <Accordion type="single" collapsible className="w-full" variant="default">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Es accesible?</AccordionTrigger>
              <AccordionContent>Sí. Cumple con el patrón de diseño WAI-ARIA.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>¿Está estilizado?</AccordionTrigger>
              <AccordionContent>
                Sí. Viene con estilos predeterminados que coinciden con la estética de los otros componentes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>¿Está animado?</AccordionTrigger>
              <AccordionContent>
                Sí. Está animado por defecto, pero puedes desactivarlo si lo prefieres.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentSection>

        <ComponentSection title="Alert Dialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Mostrar Alerta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
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
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </ComponentSection>

        <ComponentSection title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Predeterminado</Badge>
            <Badge variant="secondary">Secundario</Badge>
            <Badge variant="destructive">Destructivo</Badge>
            <Badge variant="outline">Contorno</Badge>
          </div>
        </ComponentSection>

        <ComponentSection title="Button">
          <div className="flex flex-wrap gap-2">
            <Button>Predeterminado</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="destructive">Destructivo</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="link">Enlace</Button>
          </div>
        </ComponentSection>

        <ComponentSection title="Calendar">
          <Calendar mode="single" selected={new Date()} onSelect={() => {}} className="w-full" />
        </ComponentSection>

        <ComponentSection title="Card">
          <Card >
            <CardHeader>
              <CardTitle>Título de la Tarjeta</CardTitle>
              <CardDescription>La descripción de la tarjeta va aquí</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Este es el contenido principal de la tarjeta.</p>
            </CardContent>
            <CardFooter>
              <Button>Acción</Button>
            </CardFooter>
          </Card>
        </ComponentSection>

        <ComponentSection title="Checkbox">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-surface-300 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Aceptar términos y condiciones
            </label>
          </div>
        </ComponentSection>

        <ComponentSection title="Collapsible">
          <Collapsible className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Haz clic para expandir <span className="text-xs">▼</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 mt-2 border rounded-md bg-surface-900">
              Este es el contenido que se expande y colapsa.
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
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Escribe un comando o busca..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup heading="Sugerencias">
                <CommandItem>Calendario</CommandItem>
                <CommandItem>Buscar Emoji</CommandItem>
                <CommandItem>Calculadora</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </ComponentSection>

        <ComponentSection title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir Diálogo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>
                  Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input id="name" value="Pedro Duarte" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Nombre de usuario
                  </Label>
                  <Input id="username" value="@peduarte" className="col-span-3" />
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
            <form onSubmit={form.handleSubmit(() => {})} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>Este es tu nombre de usuario público.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Enviar</Button>
            </form>
          </Form>
        </ComponentSection>

        <ComponentSection title="Hover Card">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@nextjs</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/vercel.png" />
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@nextjs</h4>
                  <p className="text-sm">El framework React para la Web</p>
                  <div className="flex items-center pt-2">
                    <span className="text-xs text-surface-400">Creado por @vercel</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ComponentSection>

        <ComponentSection title="Input">
          <Input type="email" placeholder="Email" />
        </ComponentSection>

        <ComponentSection title="Label">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="m@example.com" />
          </div>
        </ComponentSection>

        <ComponentSection title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Abrir popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Dimensiones</h4>
                  <p className="text-sm text-surface-400">Establece las dimensiones para la capa.</p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width">Ancho</Label>
                    <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxWidth">Ancho máximo</Label>
                    <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </ComponentSection>

        <ComponentSection title="Select">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </ComponentSection>

        <ComponentSection title="Separator">
          <div className="space-y-1">
            <h4 className="text-surface-300 text-sm font-medium leading-none">Radix Primitives</h4>
            <p className="text-sm text-surface-300 ">Una biblioteca de componentes UI de código abierto.</p>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center space-x-4 text-sm text-surface-300 ">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </ComponentSection>

        <ComponentSection title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Abrir hoja</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>¿Estás absolutamente seguro?</SheetTitle>
                <SheetDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y removerá tus datos de
                  nuestros servidores.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </ComponentSection>

        <ComponentSection title="Skeleton">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </ComponentSection>

        <ComponentSection title="Slider">
          <Slider defaultValue={[33]} max={100} step={1} />
        </ComponentSection>

        <ComponentSection title="Switch">
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Modo avión</Label>
          </div>
        </ComponentSection>

        <ComponentSection title="Table" fullWidth>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">001</TableCell>
                  <TableCell>Juan Pérez</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">002</TableCell>
                  <TableCell>María García</TableCell>
                  <TableCell>Inactivo</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ComponentSection>

        <ComponentSection title="Tabs" fullWidth>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Cuenta</TabsTrigger>
              <TabsTrigger value="password">Contraseña</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Cuenta</CardTitle>
                  <CardDescription>
                    Realiza cambios en tu cuenta aquí. Haz clic en guardar cuando hayas terminado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" defaultValue="Pedro Duarte" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input id="username" defaultValue="@peduarte" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Guardar cambios</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Contraseña</CardTitle>
                  <CardDescription>
                    Cambia tu contraseña aquí. Después de guardar, se cerrará tu sesión.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Contraseña actual</Label>
                    <Input id="current" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">Nueva contraseña</Label>
                    <Input id="new" type="password" />
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
          <Textarea placeholder="Escribe tu mensaje aquí." />
        </ComponentSection>

        <ComponentSection title="Tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Pasa el cursor</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Añade al carrito</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentSection>
      </div>
    </div>
  )
}

// Component Section wrapper for consistent styling
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
      <div className="bg-surface-900 rounded-lg p-5 h-full">
        <h2 className="text-xl font-semibold text-primary-300 mb-4 border-b border-surface-700 pb-2">{title}</h2>
        <div className="p-2">{children}</div>
      </div>
    </div>
  )
}

