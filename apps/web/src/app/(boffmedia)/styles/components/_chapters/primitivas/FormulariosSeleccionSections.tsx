"use client"

import * as React from "react"
import { Sample, Section } from "../../showcase-shared"
import { Checkbox, Disclosure, Field, Input, OptionGroup, Progress, RadioGroup, SearchInput, Select, Slider, Textarea, Toggle } from "@boffmedia/ui"

export function FormulariosSeleccionSections({ rng, setRng }: { rng: number; setRng: React.Dispatch<React.SetStateAction<number>> }) {
  const [sq, setSq] = React.useState("")
  const [tglA, setTglA] = React.useState(true)
  const [tglB, setTglB] = React.useState(false)
  const [ck1, setCk1] = React.useState(true)
  const [rad, setRad] = React.useState("dobles")
  const [opt, setOpt] = React.useState("dobles")
  const [optM, setOptM] = React.useState<string[]>(["protect"])
  return (
    <>
      <Section id="formularios" kicker="Primitivas" title="Formularios">
        <Sample title="Campos" code="<Field> + <Input>" col>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nombre de invocador" hint="Como aparece en el servidor.">
              <Input placeholder="AxelCraft" />
            </Field>
            <Field label="Juego">
              <Select
                value="vgc"
                onChange={() => {}}
                options={[
                  { value: "vgc", label: "Pokémon VGC" },
                  { value: "mc", label: "Minecraft" },
                  { value: "mh", label: "Monster Hunter Wilds" },
                ]}
              />
            </Field>
            <Field label="Código de equipo" error="Ese código ya está en uso.">
              <Input defaultValue="ROT-2026" />
            </Field>
            <Field label="Buscar">
              <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
            </Field>
          </div>
        </Sample>
        <Sample title="Área de texto" code="<Field> + <Textarea>" col note={<>Entrada multilínea con el mismo chasis; crece en vertical con <code>resize</code>.</>}>
          <div className="w-full max-w-[440px]">
            <Field label="Notas del equipo" hint="Visible solo para ti.">
              <Textarea rows={3} placeholder="Anota leads, coberturas, ideas de EV…" />
            </Field>
          </div>
        </Sample>
        <Sample title="Interruptores" code="<Toggle>">
          <Toggle on={tglA} onChange={setTglA} label="Notificaciones" />
          <Toggle on={tglB} onChange={setTglB} label="Modo retransmisión" />
        </Sample>
        <Sample title="Búsqueda" code="<SearchInput value onChange size>" col note={<>Chasis con botón de limpiar cuando hay texto; variante <code>sm</code> para barras densas.</>}>
          <div className="grid gap-3 w-full max-w-[400px]">
            <SearchInput value={sq} onChange={setSq} placeholder="Buscar jugador, evento…" />
            <SearchInput value={sq} onChange={setSq} size="sm" placeholder="Variante sm" />
          </div>
        </Sample>
        <Sample
          title="Desplegable"
          code="<Disclosure title icon sub badge>"
          col
          note={<>Contenedor plegable para ajustes avanzados y ayuda contextual; oculta el detalle hasta que se necesita. Admite <code>icon</code>, subtítulo y <code>badge</code>.</>}
        >
          <div className="grid gap-3 w-full max-w-[440px]">
            <Disclosure title="Ajustes avanzados" icon="sliders" sub="EVs, IVs y naturaleza" badge="Opcional">
              <div className="grid gap-3 pt-3">
                <Field label="Naturaleza">
                  <Select
                    value="adamant"
                    onChange={() => {}}
                    options={[
                      { value: "adamant", label: "Firme (+Atq / −AtqEsp)" },
                      { value: "jolly", label: "Alegre (+Vel / −AtqEsp)" },
                      { value: "modest", label: "Modesta (+AtqEsp / −Atq)" },
                    ]}
                  />
                </Field>
                <Checkbox defaultChecked label="Sincronizar IVs perfectos" />
              </div>
            </Disclosure>
            <Disclosure title="Cómo se calcula" icon="info">
              <p className="pt-3 text-txt-muted text-[13px] leading-[1.6]">
                El rango sale de aplicar la fórmula de daño con los modificadores activos: naturaleza, objeto, campo y clima.
              </p>
            </Disclosure>
          </div>
        </Sample>
      </Section>

      <Section
        id="seleccion"
        kicker="Primitivas"
        title="Selección y rango"
        lead={<>Checkbox para selección múltiple, Radio para elección exclusiva con descripción y Slider para rango. Los completan <code>Toggle</code> (encendido inmediato) y <code>OptionGroup</code> (tarjetas con icono). Marcadores del sistema: cuadro con corte y diamante.</>}
      >
        <Sample title="Checkbox" code="<Checkbox checked onChange label>" col>
          <div className="grid gap-3">
            <Checkbox checked={ck1} onChange={setCk1} label="Recibir novedades por correo" />
            <Checkbox defaultChecked label="Mostrar mi actividad a la comunidad" />
            <Checkbox disabled label="Opción no disponible" />
          </div>
        </Sample>
        <Sample
          title="Radio"
          code="<RadioGroup value onChange options>"
          col
          note={
            <>
              Filas sin caja: sólo la opción elegida se pinta, con barra de acento y tinte. Sigue el patrón ARIA de radiogroup — las flechas
              mueven la selección y el grupo entero ocupa <em>una</em> parada de tabulación, así que <code>Tab</code> entra y sale en vez de
              recorrer opción por opción.
            </>
          }
        >
          <div className="w-full max-w-[440px]">
            <RadioGroup
              value={rad}
              onChange={setRad}
              ariaLabel="Formato de combate"
              options={[
                { value: "singles", label: "Singles", desc: "Combate 1v1 clásico." },
                { value: "dobles", label: "Dobles / VGC", desc: "El formato oficial por equipos." },
                { value: "draft", label: "Draft", desc: "Selección por turnos." },
              ]}
            />
          </div>
        </Sample>
        <Sample title="Slider" code="<Slider value min max unit onChange>" col note={<>El valor va en mono naranja; aquí alimenta al <code>Progress</code> de abajo.</>}>
          <div className="grid gap-[18px] w-full max-w-[440px]">
            <Slider label="Volumen de la señal" value={rng} onChange={setRng} unit="%" />
            <Progress value={rng} />
          </div>
        </Sample>
        <Sample
          title="Tarjetas de opción"
          code="<OptionGroup options value onChange columns multi>"
          col
          note={
            <>
              Tarjetas con icono para elección exclusiva o <code>multi</code>; alternativa expresiva al <code>RadioGroup</code>.{" "}
              <code>columns</code> es el <em>máximo</em> a pantalla ancha, no una rejilla fija: por debajo baja a dos columnas sola, para que un
              grupo de cuatro no acabe en cuatro tarjetas estrujadas en el móvil. En modo exclusivo hereda las flechas y la parada única de
              tabulación del <code>RadioGroup</code>; con <code>multi</code> cada tarjeta es una casilla y mantiene su propio tabulador.
            </>
          }
        >
          <div className="grid gap-4 w-full max-w-[520px]">
            <OptionGroup
              value={opt}
              onChange={(v) => setOpt(v as string)}
              columns={3}
              ariaLabel="Formato de combate"
              options={[
                { value: "singles", icon: "sword", label: "Singles", desc: "1v1" },
                { value: "dobles", icon: "users", label: "Dobles", desc: "VGC" },
                { value: "draft", icon: "list", label: "Draft", desc: "Por turnos" },
              ]}
            />
            <OptionGroup
              multi
              value={optM}
              onChange={(v) => setOptM(v as string[])}
              columns={2}
              ariaLabel="Coberturas del equipo"
              options={[
                { value: "protect", icon: "shield", label: "Protect", desc: "Prioridad +4" },
                { value: "fake", icon: "zap", label: "Fake Out", desc: "Amedrenta" },
              ]}
            />
          </div>
        </Sample>
      </Section>
    </>
  )
}
