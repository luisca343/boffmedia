import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Términos de servicio · Boffmedia",
  description: "Las condiciones que regulan el uso de los servicios de Boffmedia.",
}

const SECTIONS: LegalSection[] = [
  {
    id: "aceptacion",
    title: "Aceptación de los términos",
    body: [
      "Al acceder y utilizar nuestros servicios, aceptas cumplir y estar sujeto a estos Términos de Servicio en su totalidad. Si no estás de acuerdo con estos términos, por favor, no utilices nuestros servicios.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios en los términos",
    body: [
      "Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos a través de nuestro sitio web o por correo electrónico. El uso continuado de nuestros servicios después de dichos cambios constituye tu aceptación de los nuevos términos.",
    ],
  },
  {
    id: "uso",
    title: "Uso del servicio",
    body: [
      "Nuestros servicios están destinados únicamente para uso personal y no comercial. Te comprometes a no:",
      [
        "Utilizar nuestros servicios para cualquier propósito ilegal o no autorizado.",
        "Interferir o interrumpir la integridad o el rendimiento de nuestros servicios.",
        "Intentar obtener acceso no autorizado a nuestros sistemas o redes.",
        "Copiar, modificar, distribuir, vender o arrendar cualquier parte de nuestros servicios.",
      ],
    ],
  },
  {
    id: "cuentas",
    title: "Cuentas de usuario",
    body: [
      "Para acceder a ciertas funciones de nuestros servicios, deberás crear una cuenta. Eres responsable de:",
      [
        "Mantener la confidencialidad de tu cuenta y contraseña.",
        "Restringir el acceso a tu computadora o dispositivo.",
        "Todas las actividades que ocurran bajo tu cuenta.",
      ],
    ],
  },
  {
    id: "contenido",
    title: "Contenido del usuario",
    body: [
      "Nuestros servicios pueden permitirte publicar, enlazar, almacenar, compartir y poner a disposición cierta información, texto, gráficos, videos u otros materiales. Eres responsable de este contenido y de cualquier reclamo relacionado con él.",
    ],
  },
  {
    id: "propiedad",
    title: "Propiedad intelectual",
    body: [
      "El servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de Boffmedia y sus licenciantes. El servicio está protegido por derechos de autor, marcas registradas y otras leyes.",
    ],
  },
  {
    id: "compras",
    title: "Compras y pagos",
    body: [
      "Si realizas una compra a través de nuestros servicios, aceptas proporcionar información de pago precisa y completa. Todas las tarifas están sujetas a cambios. Las transacciones son gestionadas por procesadores de pago seguros.",
    ],
  },
  {
    id: "cancelaciones",
    title: "Cancelaciones",
    body: [
      "Dado que ofrecemos artículos dentro del juego y servicios en línea, nuestra política de cancelaciones es limitada. Si encuentras algún problema con tu compra, contacta a nuestro servicio de atención al cliente lo antes posible.",
      "Para solicitar una cancelación:",
      [
        "La solicitud debe realizarse dentro de las 24 horas posteriores a la compra.",
        "El artículo o servicio no debe haber sido utilizado o activado.",
        "Debes proporcionar detalles específicos del problema encontrado o la razón de la cancelación.",
        "Nos reservamos el derecho de investigar y resolver la solicitud a nuestra discreción.",
      ],
      "Las cancelaciones aprobadas pueden estar sujetas a una tarifa de procesamiento del 5% del valor de la compra.",
    ],
  },
  {
    id: "devoluciones",
    title: "Devoluciones",
    body: [
      "Nos esforzamos por garantizar que cada compra sea una experiencia satisfactoria. Si no estás conforme con tu compra, revisaremos tu caso según los siguientes criterios:",
      [
        "La solicitud debe realizarse dentro de los 7 días naturales desde la fecha de compra.",
        "El artículo o servicio no debe haber sido utilizado, activado ni canjeado.",
        "Debes acreditar la compra mediante el comprobante o número de pedido.",
        "Los artículos adquiridos en promoción o con descuento especial quedan excluidos salvo defecto comprobado.",
      ],
      "Para iniciar una devolución, contacta con nuestro equipo indicando el número de pedido y el motivo detallado. Te responderemos en un plazo máximo de 48 horas hábiles.",
      "Si la devolución es aprobada, el importe será reintegrado mediante el método de pago original en un plazo de 7 días hábiles, pudiendo estar sujeto a una tarifa de gestión del 5% del valor de la compra. Nos reservamos el derecho de rechazar solicitudes que no cumplan las condiciones anteriores o que se consideren abusivas.",
    ],
  },
  {
    id: "reembolsos",
    title: "Reembolsos y disputas",
    body: [
      "Entendemos que pueden surgir problemas o malentendidos. Esta política está diseñada para manejar tales situaciones de manera justa y eficiente.",
      "Si tienes algún problema con tu compra, sigue estos pasos:",
      [
        "Contacta a nuestro servicio de atención al cliente a través de nuestra página de contacto.",
        "Proporciona todos los detalles relevantes, incluyendo el número de pedido y una descripción detallada del problema.",
        "Nuestro equipo investigará el problema y te responderá dentro de las 48 horas hábiles.",
      ],
      "Los reembolsos se manejan caso por caso, teniendo en cuenta las siguientes condiciones:",
      [
        "La solicitud de reembolso debe realizarse dentro de los 7 días posteriores a la compra.",
        "El artículo o servicio no debe haber sido utilizado o activado sustancialmente.",
        "Se debe proporcionar una razón válida para el reembolso.",
      ],
      "Si se aprueba un reembolso, se procesará a través del método de pago original dentro de los 7 días hábiles. Puede estar sujeto a una tarifa de procesamiento del 5% del valor de la compra. Nos reservamos el derecho de rechazar solicitudes que no cumplan con nuestras políticas o que se consideren abusivas.",
    ],
  },
  {
    id: "terminacion",
    title: "Terminación",
    body: [
      "Podemos terminar o suspender tu acceso inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitación, si incumples estos Términos de Servicio.",
    ],
  },
  {
    id: "responsabilidad",
    title: "Limitación de responsabilidad",
    body: [
      "En ningún caso Boffmedia, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo derivado del uso o la imposibilidad de usar nuestros servicios.",
    ],
  },
  {
    id: "ley",
    title: "Ley aplicable",
    body: [
      "Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus disposiciones sobre conflictos de leyes.",
    ],
  },
  {
    id: "contacto",
    title: "Contacto",
    body: ["Si tienes preguntas sobre estos Términos de Servicio, contáctanos a través de nuestra página de contacto."],
  },
]

export default function TermsPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Términos"
      title="Términos de servicio"
      lead="Estos términos regulan el acceso y uso de los servicios de Boffmedia. Al utilizarlos, aceptas cumplir con las condiciones descritas a continuación."
      updated={updated}
      sections={SECTIONS}
    />
  )
}
