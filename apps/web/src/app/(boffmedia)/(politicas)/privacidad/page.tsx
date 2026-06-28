"use client"

import * as React from "react"
import { DocTOC } from "@/components/boffmedia/primitives/doc-toc"
import { Kicker } from "@/components/boffmedia/primitives/kicker"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { BoffButton as Button } from "@/components/boffmedia/primitives/button"
import { BoffCard as Card } from "@/components/boffmedia/primitives/card"

const PRIVACY: {
  id: string
  title: string
  body: (string | string[])[]
}[] = [
  {
    id: "info",
    title: "Información que recopilamos",
    body: [
      "Podemos recopilar los siguientes tipos de información cuando utilizas nuestros servicios:",
      [
        "Información de registro: nombre de usuario, dirección de correo electrónico y contraseña.",
        "Información de perfil: avatar, biografía y preferencias de juego.",
        "Información de juego: estadísticas, logros e historial de partidas.",
        "Información de pago: gestionada por procesadores de pago seguros.",
      ],
    ],
  },
  {
    id: "uso",
    title: "Uso de la información",
    body: [
      "Utilizamos tu información para:",
      [
        "Proporcionar y mejorar nuestros servicios de juego.",
        "Personalizar tu experiencia de juego.",
        "Procesar transacciones y enviar notificaciones relacionadas.",
        "Comunicarnos contigo sobre actualizaciones, ofertas y eventos.",
        "Prevenir fraudes y garantizar la seguridad de nuestros servicios.",
      ],
    ],
  },
  {
    id: "compartir",
    title: "Compartir información",
    body: [
      "No vendemos tu información personal. Podemos compartir información en las siguientes circunstancias:",
      [
        "Con otros jugadores, según las configuraciones de tu perfil.",
        "Con proveedores de servicios que nos ayudan a operar la plataforma.",
        "Si es requerido por ley o para proteger nuestros derechos legales.",
      ],
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad de datos",
    body: [
      "Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.",
    ],
  },
  {
    id: "derechos",
    title: "Tus derechos",
    body: [
      "Tienes derecho a:",
      [
        "Acceder a tu información personal.",
        "Corregir información inexacta.",
        "Eliminar tu información.",
        "Oponerte al procesamiento de tu información.",
        "Retirar tu consentimiento en cualquier momento.",
      ],
    ],
  },
  {
    id: "cookies",
    title: "Cookies y tecnologías similares",
    body: [
      "Utilizamos cookies y tecnologías similares para mejorar la funcionalidad del sitio. Puedes gestionar tus preferencias a través de la configuración de tu navegador.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios en esta política",
    body: [
      "Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos a través del sitio o por correo electrónico.",
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    body: [
      "Si tienes preguntas sobre esta Política de Privacidad, contáctanos a través de nuestra página de contacto.",
    ],
  },
]

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container pt-8 pb-20">
      <div className="max-w-[60ch] mb-10">
        <Kicker>Legal · Privacidad</Kicker>
        <h1 className="text-[length:var(--t-4xl)] mt-[0.7rem]">
          Política de privacidad
        </h1>
        <p className="text-[length:var(--t-lg)] leading-[1.7] text-ink-muted mt-[1.1rem] mb-5">
          En BoffMedia valoramos y respetamos tu privacidad. Esta política
          explica cómo recopilamos, usamos y protegemos tu información personal
          cuando utilizas nuestros servicios.
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
          items={PRIVACY.map((s) => ({ id: s.id, title: s.title }))}
        />

        <div className="max-w-[70ch]">
          {PRIVACY.map((s, i) => (
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
              <Icon name="shield" size={22} />
            </span>
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-[length:var(--t-lg)] m-0">
                ¿Quieres gestionar tus datos?
              </h3>
              <p className="text-ink-muted text-[length:var(--t-sm)] mt-[0.3rem] m-0">
                Desde tu perfil puedes descargar o eliminar tu información en
                cualquier momento.
              </p>
            </div>
            <Button variant="ghost" iconRight="arrow">
              Ir a mi perfil
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
