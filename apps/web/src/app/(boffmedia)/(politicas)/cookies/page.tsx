"use client"

import * as React from "react"
import { DocTOC } from "@/components/boffmedia/primitives/doc-toc"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { BoffButton as Button } from "@/components/boffmedia/primitives/button"
import { BoffCard as Card } from "@/components/boffmedia/primitives/card"

const SECTIONS: {
  id: string
  title: string
  body: (string | string[])[]
}[] = [
  {
    id: "introduccion",
    title: "Introducción",
    body: [
      "Esta Política de Cookies explica qué son las cookies, cómo las utilizamos en BoffMedia y cómo puedes gestionar tus preferencias. Al utilizar nuestro sitio web y servicios, aceptas el uso de cookies según lo descrito en esta política.",
    ],
  },
  {
    id: "que-son",
    title: "Qué son las cookies",
    body: [
      "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, tableta o móvil) cuando visitas un sitio web. Permiten que el sitio web recuerde tus preferencias y acciones durante un período de tiempo, para que no tengas que volver a introducirlas cada vez que nos visites.",
      "Las cookies pueden ser propias (establecidas por el sitio web que estás visitando) o de terceros (establecidas por dominios externos). También pueden ser temporales (de sesión) o persistentes (permanecen en tu dispositivo hasta que se eliminan o caducan).",
    ],
  },
  {
    id: "tipos",
    title: "Tipos de cookies que utilizamos",
    body: [
      "En BoffMedia utilizamos los siguientes tipos de cookies para mejorar tu experiencia:",
      [
        "Cookies esenciales: necesarias para el funcionamiento básico del sitio. Permiten la navegación, el inicio de sesión y el acceso a áreas seguras. Sin estas cookies, el sitio no puede funcionar correctamente.",
        "Cookies de preferencia: permiten recordar tus preferencias, como el idioma, el tema visual y el acento de color seleccionado, para ofrecerte una experiencia personalizada.",
        "Cookies de análisis: nos ayudan a entender cómo interactúas con el sitio, qué secciones visitas y cómo podemos mejorar. La información recopilada es agregada y anónima.",
        "Cookies de funcionalidad: mejoran el rendimiento del sitio recordando las decisiones que tomas, como mantener tu sesión activa o conservar herramientas recientes.",
      ],
    ],
  },
  {
    id: "terceros",
    title: "Cookies de terceros",
    body: [
      "Algunos servicios externos que utilizamos pueden establecer sus propias cookies en tu dispositivo:",
      [
        "Proveedores de análisis: utilizamos herramientas de análisis anónimas para entender el uso del sitio y mejorar nuestros servicios.",
        "Redes sociales: los botones de compartir en redes sociales pueden establecer cookies para rastrear tu interacción con ellos.",
        "Servicios de pago: los procesadores de pago externos pueden utilizar cookies necesarias para procesar las transacciones de forma segura.",
      ],
      "No tenemos control sobre las cookies de terceros. Te recomendamos revisar las políticas de privacidad y cookies de cada servicio externo para obtener información detallada.",
    ],
  },
  {
    id: "gestion",
    title: "Gestión de cookies",
    body: [
      "Puedes gestionar y controlar las cookies de las siguientes maneras:",
      [
        "Configuración del navegador: la mayoría de navegadores permiten bloquear o eliminar cookies desde su configuración. Consulta la sección de ayuda de tu navegador para más información.",
        "Herramientas específicas: puedes utilizar herramientas de privacidad en línea para gestionar tus preferencias de cookies de forma centralizada.",
        "Exclusión de análisis: algunos proveedores de análisis ofrecen complementos de exclusión que puedes instalar en tu navegador.",
      ],
      "Ten en cuenta que si bloqueas las cookies esenciales, algunas partes de nuestro sitio pueden no funcionar correctamente o tu experiencia puede verse afectada.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios en esta política",
    body: [
      "Podemos actualizar esta Política de Cookies periódicamente para reflejar cambios en las cookies que utilizamos o por requisitos legales. Te notificaremos sobre cambios significativos a través del sitio o por correo electrónico.",
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    body: [
      "Si tienes preguntas sobre nuestra Política de Cookies, contáctanos a través de nuestra página de contacto.",
    ],
  },
]

export default function CookiesPage() {
  const today = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container pt-8 pb-20">
      <div className="max-w-[60ch] mb-10">
        <Kicker>Legal · Cookies</Kicker>
        <h1 className="text-[length:var(--t-4xl)] mt-[0.7rem]">
          Política de cookies
        </h1>
        <p className="text-[length:var(--t-lg)] leading-[1.7] text-ink-muted mt-[1.1rem] mb-5">
          En BoffMedia utilizamos cookies y tecnologías similares para mejorar
          tu experiencia, personalizar contenido y analizar el tráfico. Esta
          política explica cómo las utilizamos y cómo puedes controlarlas.
        </p>
        <div className="flex gap-6 flex-wrap">
          <span className="inline-flex items-center gap-2 font-mono text-[length:var(--t-xs)] tracking-[0.04em] text-ink-dim">
            <Icon name="calendar" size={15} />
            Última actualización: {today}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-[length:var(--t-xs)] tracking-[0.04em] text-ink-dim">
            <Icon name="shield" size={15} />
            Vigente
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-14 items-start max-[1000px]:grid-cols-1 max-[1000px]:gap-8">
        <DocTOC
          items={SECTIONS.map((s) => ({ id: s.id, title: s.title }))}
        />

        <div className="max-w-[70ch]">
          {SECTIONS.map((s, i) => (
            <section
              key={s.id}
              id={"sec-" + s.id}
              className="pb-10 mb-10 border-b border-edge scroll-mt-[100px] last:border-b-0"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <span
                  className="font-mono font-bold text-sm text-[color:var(--orange-500)] py-1 px-2 rounded-[var(--radius)] shrink-0"
                  style={{
                    border: "var(--hairline) solid color-mix(in srgb, var(--orange-500) 35%, transparent)",
                    background:
                      "color-mix(in srgb, var(--orange-500) 10%, transparent)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[length:var(--t-2xl)]">{s.title}</h2>
              </div>
              {s.body.map((b, j) =>
                Array.isArray(b) ? (
                  <ul
                    key={j}
                    className="list-none p-0 m-0 mb-4 flex flex-col gap-[0.7rem] last:mb-0"
                  >
                    {b.map((li, k) => (
                      <li
                        key={k}
                        className="flex items-start gap-[0.7rem] text-[length:var(--t-base)] leading-[1.6] text-ink-muted"
                      >
                        <span className="shrink-0 w-[21px] h-[21px] rounded-full grid place-items-center text-[var(--on-secondary)] bg-secondary-hover mt-[0.15rem]">
                          <Icon name="check" size={13} />
                        </span>
                        {li}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    key={j}
                    className="text-[length:var(--t-base)] leading-[1.75] text-ink-muted m-0 mb-4 last:mb-0"
                  >
                    {b}
                  </p>
                ),
              )}
              {s.id === "contacto" && (
                <Button
                  variant="primary"
                  icon="mail"
                  style={{ marginTop: "1rem" }}
                >
                  Ir a contacto
                </Button>
              )}
            </section>
          ))}

          <Card ticks className="flex items-center gap-5 p-6 flex-wrap">
            <span
              className="w-[50px] h-[50px] rounded-[var(--radius)] grid place-items-center text-[color:var(--orange-500)] shrink-0"
              style={{
                background:
                  "color-mix(in srgb, var(--orange-500) 14%, transparent)",
                border:
                  "var(--hairline) solid color-mix(in srgb, var(--orange-500) 30%, transparent)",
              }}
            >
              <Icon name="sliders" size={22} />
            </span>
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-[length:var(--t-lg)] m-0">
                ¿Quieres ajustar tus preferencias?
              </h3>
              <p className="text-ink-muted text-[length:var(--t-sm)] mt-[0.3rem] m-0">
                Puedes gestionar las cookies desde la configuración de tu
                navegador en cualquier momento.
              </p>
            </div>
            <Button variant="ghost" iconRight="arrow">
              Más información
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
