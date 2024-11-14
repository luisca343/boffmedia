"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
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
import { Theme, useThemeStore } from '@/stores/themeStore'
import { Moon, Sun, Flower2, Droplet, Palmtree } from 'lucide-react'
import { isMinecraft } from '@/services/mcef/mcefHelper'

export default function BoffMediaStyleGuide() {
  const [comboboxValue, setComboboxValue] = React.useState("")
  const {theme: theme, setTheme: setTheme} = useThemeStore();
  const form = useForm()

  const themeButtons: { theme: Theme, icon: React.ComponentType, label: string, global?: boolean }[] = [
    { theme: 'theme-dark', icon: Moon, label: 'Oscuro', global: true },
    { theme: 'theme-light', icon: Sun, label: 'Claro', global: true },
    { theme: 'theme-tulipan', icon: Flower2, label: 'Tulipán' },
    { theme: 'theme-mizu', icon: Droplet, label: 'Mizu' },
    { theme: 'theme-oasis', icon: Palmtree, label: 'Oasis' },
  ]

  return (
    <div className="p-6 text-text-primary min-h-screen bg-surface-1">
      <h1 className="text-3xl font-bold text-primary mb-8">Guía de Estilo BoffMedia</h1>
      <div className="flex flex-wrap gap-2 mb-8">
        {themeButtons.map(({ theme: themeOption, icon: Icon, label, global }) => {
          if(!global && !isMinecraft()) return null
          return <Button
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            variant={theme === themeOption ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Icon/>
            <span>{label}</span>
          </Button>
        
    })}
      </div>

      <section className="mb-12 ">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Accordion</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>¿Es accesible?</AccordionTrigger>
            <AccordionContent>
              Sí. Cumple con el patrón de diseño WAI-ARIA.
            </AccordionContent>
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
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Alert Dialog</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Mostrar Alerta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-surface-3 border-border-dark">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-text-primary">¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription className="text-text-secondary">
                Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
                y removerá tus datos de nuestros servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-surface-3 text-text-primary hover:bg-surface-5">Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-primary-600 text-text-primary hover:bg-primary-500">Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Avatar</h2>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback className="bg-primary-700 text-text-primary">CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback className="bg-primary-700 text-text-primary">CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-primary-700 text-text-primary">CN</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary-600 text-text-primary">Predeterminado</Badge>
          <Badge variant="secondary" className="bg-surface-3 text-text-primary">Secundario</Badge>
          <Badge variant="destructive" className="bg-red-600 text-text-primary">Destructivo</Badge>
          <Badge variant="outline" className="border-primary-500 text-primary">Contorno</Badge>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Button</h2>
        <div className="flex flex-wrap gap-4">
          <Button className="bg-primary-600 text-text-primary hover:bg-primary-500">Botón Predeterminado</Button>
          <Button variant="secondary" className="bg-surface-3 text-text-primary hover:bg-surface-5">Botón Secundario</Button>
          <Button variant="destructive" className="bg-red-600 text-text-primary hover:bg-red-500">Botón Destructivo</Button>
          <Button variant="outline" className="border-primary-500 text-primary hover:bg-primary-500 hover:text-text-primary">Botón de Contorno</Button>
          <Button variant="ghost" className="text-primary hover:bg-primary-500 hover:text-text-primary">Botón Fantasma</Button>
          <Button variant="link" className="text-primary hover:text-text-primary">Botón de Enlace</Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Card</h2>
        <Card className="max-w-md bg-surface-3 border-border-dark">
          <CardHeader>
            <CardTitle className="text-text-primary">Título de la Tarjeta</CardTitle>
            <CardDescription className="text-text-secondary">La descripción de la tarjeta va aquí</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">Este es el contenido principal de la tarjeta. Puedes poner cualquier información aquí.</p>
          </CardContent>
          <CardFooter>
            <Button className="bg-primary-600 text-text-primary hover:bg-primary-500">Acción</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Checkbox</h2>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" className="border-primary-500 text-text-tertiary" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none text-text-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Aceptar términos y condiciones
          </label>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Collapsible</h2>
        <Collapsible>
          <CollapsibleTrigger className="text-primary hover:text-text-primary">
            Haz clic para expandir
          </CollapsibleTrigger>
          <CollapsibleContent className="text-text-secondary mt-2">
            Este es el contenido que se expande y colapsa.
          </CollapsibleContent>
        </Collapsible>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Combobox</h2>
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
          className="bg-surface-3 border-border-dark text-text-primary"
        />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Command</h2>
        <Command className="rounded-lg border border-border-dark bg-surface-3 shadow-md">
          <CommandInput placeholder="Escribe un comando o busca..." className="text-text-primary" />
          <CommandList>
            <CommandEmpty className="text-text-secondary">No se encontraron resultados.</CommandEmpty>
            <CommandGroup heading="Sugerencias" className="text-primary">
              <CommandItem className="text-text-secondary hover:bg-surface-3">Calendario</CommandItem>
              <CommandItem className="text-text-secondary hover:bg-surface-3">Buscar Emoji</CommandItem>
              <CommandItem className="text-text-secondary hover:bg-surface-3">Calculadora</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary-500 text-primary hover:bg-primary-500 hover:text-text-primary">Abrir Diálogo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-surface-3 border-border-dark">
            <DialogHeader>
              <DialogTitle className="text-text-primary">Editar perfil</DialogTitle>
              <DialogDescription className="text-text-secondary">
                Realiza cambios en tu perfil aquí. Haz clic en guardar cuando hayas terminado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-text-secondary">
                  Nombre
                </Label>
                <Input id="name" value="Pedro Duarte" className="col-span-3 bg-surface-3 border-border-dark text-text-primary" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right text-text-secondary">
                  Nombre de usuario
                </Label>
                <Input id="username" value="@peduarte" className="col-span-3 bg-surface-3 border-border-dark text-text-primary" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-primary-600 text-text-primary hover:bg-primary-500">Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Form</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => {})} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Nombre de usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} className="bg-surface-3 border-border-dark text-text-primary" />
                  </FormControl>
                  <FormDescription className="text-text-secondary">
                    Este es tu nombre de usuario público.
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button type="submit" className="bg-primary-600 text-text-primary hover:bg-primary-500">Enviar</Button>
          </form>
        </Form>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Hover Card</h2>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link" className="text-primary hover:text-text-primary">@nextjs</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 bg-surface-3 border-border-dark">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" />
                <AvatarFallback className="bg-primary-700 text-text-primary">VC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-text-primary">@nextjs</h4>
                <p className="text-sm text-text-secondary">
                  El framework React para la Web
                </p>
                <div className="flex items-center pt-2">
                  <span className="text-xs text-text-tertiary">
                    Creado por @vercel
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Input</h2>
        <Input type="email" placeholder="Email" className="bg-surface-3 border-border-dark text-text-primary" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Label</h2>
        <Label htmlFor="email" className="text-text-secondary">Email</Label>
        <Input type="email" id="email" placeholder="m@example.com" className="bg-surface-3 border-border-dark text-text-primary mt-1" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Popover</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-primary-500 text-primary hover:bg-primary-500 hover:text-text-primary">Abrir popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-surface-3 border-border-dark">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none text-text-primary">Dimensiones</h4>
                <p className="text-sm text-text-secondary">
                  Establece las dimensiones para la capa.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width" className="text-text-secondary">Ancho</Label>
                  <Input
                    id="width"
                    defaultValue="100%"
                    className="col-span-2 h-8 bg-surface-3 border-border-dark text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth" className="text-text-secondary">Ancho máximo</Label>
                  <Input
                    id="maxWidth"
                    defaultValue="300px"
                    className="col-span-2 h-8 bg-surface-3 border-border-dark text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height" className="text-text-secondary">Alto</Label>
                  <Input
                    id="height"
                    defaultValue="25px"
                    className="col-span-2 h-8 bg-surface-3 border-border-dark text-text-primary"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight" className="text-text-secondary">Alto máximo</Label>
                  <Input
                    id="maxHeight"
                    defaultValue="none"
                    className="col-span-2 h-8 bg-surface-3 border-border-dark text-text-primary"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Select</h2>
        <Select>
          <SelectTrigger className="w-[180px] bg-surface-3 border-border-dark text-text-primary">
            <SelectValue placeholder="Tema" />
          </SelectTrigger>
          <SelectContent className="bg-surface-3 border-border-dark">
            <SelectItem value="light" className="text-text-secondary">Claro</SelectItem>
            <SelectItem value="dark" className="text-text-secondary">Oscuro</SelectItem>
            <SelectItem value="system" className="text-text-secondary">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Separator</h2>
        <div className="space-y-1">
          <h4 className="text-sm font-medium leading-none text-primary">Radix Primitives</h4>
          <p className="text-sm text-text-secondary">Una biblioteca de componentes UI de código abierto.</p>
        </div>
        <Separator className="my-4 bg-surface-3" />
        <div className="flex h-5 items-center space-x-4 text-sm">
          <div className="text-text-secondary">Blog</div>
          <Separator orientation="vertical" className="bg-surface-3" />
          <div className="text-text-secondary">Docs</div>
          <Separator orientation="vertical" className="bg-surface-3" />
          <div className="text-text-secondary">Source</div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Sheet</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="border-primary-500 text-primary hover:bg-primary-500 hover:text-text-primary">Abrir hoja</Button>
          </SheetTrigger>
          <SheetContent className="bg-surface-3 border-border-dark">
            <SheetHeader>
              <SheetTitle className="text-text-primary">¿Estás absolutamente seguro?</SheetTitle>
              <SheetDescription className="text-text-secondary">
                Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
                y removerá tus datos de nuestros servidores.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Skeleton</h2>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full bg-surface-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-surface-3" />
            <Skeleton className="h-4 w-[200px] bg-surface-3" />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Slider</h2>
        <Slider defaultValue={[33]} max={100} step={1} className="[&_[role=slider]]:bg-primary-600" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Switch</h2>
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" className="bg-surface-3 data-[state=checked]:bg-primary-600" />
          <Label htmlFor="airplane-mode" className="text-text-secondary">Modo avión</Label>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Table</h2>
        <Table>
          <TableHeader>
            <TableRow className="border-border-dark">
              <TableHead className="w-[100px] text-primary">ID</TableHead>
              <TableHead className="text-primary">Nombre</TableHead>
              <TableHead className="text-primary">Estado</TableHead>
              <TableHead className="text-right text-primary">Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-border-dark">
              <TableCell className="font-medium text-text-secondary">001</TableCell>
              <TableCell className="text-text-secondary">Juan Pérez</TableCell>
              <TableCell className="text-text-secondary">Activo</TableCell>
              <TableCell className="text-right text-text-secondary">$250.00</TableCell>
            </TableRow>
            <TableRow className="border-border-dark">
              <TableCell className="font-medium text-text-secondary">002</TableCell>
              <TableCell className="text-text-secondary">María García</TableCell>
              <TableCell className="text-text-secondary">Inactivo</TableCell>
              <TableCell className="text-right text-text-secondary">$150.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Tabs</h2>
        <Tabs defaultValue="account" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2 bg-surface-3">
            <TabsTrigger value="account" className="data-[state=active]:bg-surface-3 data-[state=active]:text-primary">Cuenta</TabsTrigger>
            <TabsTrigger value="password" className="data-[state=active]:bg-surface-3 data-[state=active]:text-primary">Contraseña</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card className="bg-surface-3 border-border-dark">
              <CardHeader>
                <CardTitle className="text-text-primary">Cuenta</CardTitle>
                <CardDescription className="text-text-secondary">
                  Realiza cambios en tu cuenta aquí. Haz clic en guardar cuando hayas terminado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-text-secondary">Nombre</Label>
                  <Input id="name" defaultValue="Pedro Duarte" className="bg-surface-3 border-border-dark text-text-primary" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-text-secondary">Nombre de usuario</Label>
                  <Input id="username" defaultValue="@peduarte" className="bg-surface-3 border-border-dark text-text-primary" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-primary-600 text-text-primary hover:bg-primary-500">Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card className="bg-surface-3 border-border-dark">
              <CardHeader>
                <CardTitle className="text-text-primary">Contraseña</CardTitle>
                <CardDescription className="text-text-secondary">
                  Cambia tu contraseña aquí. Después de guardar, se cerrará tu sesión.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="current" className="text-text-secondary">Contraseña actual</Label>
                  <Input id="current" type="password" className="bg-surface-3 border-border-dark text-text-primary" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new" className="text-text-secondary">Nueva contraseña</Label>
                  <Input id="new" type="password" className="bg-surface-3 border-border-dark text-text-primary" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-primary-600 text-text-primary hover:bg-primary-500">Guardar contraseña</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Textarea</h2>
        <Textarea placeholder="Escribe tu mensaje aquí." className="bg-surface-3 border-border-dark text-text-primary" />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Tooltip</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="border-primary-500 text-text-secondary hover:bg-primary-500 hover:text-text-primary">Pasa el cursor</Button>
            </TooltipTrigger>
            <TooltipContent className="bg-surface-3 border-border-dark text-text-primary">
              <p>Añade al carrito</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

    </div>
  )
}