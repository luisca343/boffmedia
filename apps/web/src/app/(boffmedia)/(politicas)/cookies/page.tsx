import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Política de cookies · Boffmedia",
  description: "Qué cookies utilizamos en Boffmedia y cómo gestionar tus preferencias.",
}

const SECTIONS: LegalSection[] = [
  {
    id: "introduccion",
    title: "Introducción",
    body: [
      "Esta Política de Cookies explica qué son las cookies, cómo las utilizamos en Boffmedia y cómo puedes gestionar tus preferencias. Al utilizar nuestro sitio web y servicios, aceptas el uso de cookies según lo descrito en esta política.",
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
      "En Boffmedia utilizamos los siguientes tipos de cookies para mejorar tu experiencia:",
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
    body: ["Si tienes preguntas sobre nuestra Política de Cookies, contáctanos a través de nuestra página de contacto."],
  },
]

export default function CookiesPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Cookies"
      title="Política de cookies"
      lead="En Boffmedia utilizamos cookies y tecnologías similares para mejorar tu experiencia, personalizar contenido y analizar el tráfico. Esta política explica cómo las utilizamos y cómo puedes controlarlas."
      updated={updated}
      sections={SECTIONS}
    />
  )
}
