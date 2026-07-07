import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Política de privacidad · Boffmedia",
  description: "Cómo recopilamos, usamos y protegemos tu información personal en Boffmedia.",
}

const PRIVACY: LegalSection[] = [
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
    body: ["Si tienes preguntas sobre esta Política de Privacidad, contáctanos a través de nuestra página de contacto."],
  },
]

export default function PrivacyPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Privacidad"
      title="Política de privacidad"
      lead="En Boffmedia valoramos y respetamos tu privacidad. Esta política explica cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestros servicios."
      updated={updated}
      sections={PRIVACY}
    />
  )
}
