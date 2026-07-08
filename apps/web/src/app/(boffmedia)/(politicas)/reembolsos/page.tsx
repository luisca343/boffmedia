import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Política de disputas y reembolsos · Boffmedia",
  description: "Cómo resolvemos disputas y gestionamos los reembolsos en Boffmedia.",
}

const SECTIONS: LegalSection[] = [
  {
    id: "proceso-disputa",
    title: "Proceso de disputa",
    body: [
      "Si tienes algún problema con tu compra, sigue estos pasos:",
      [
        "Contacta a nuestro servicio de atención al cliente a través de nuestra página de contacto.",
        "Proporciona todos los detalles relevantes, incluyendo el número de pedido y una descripción detallada del problema.",
        "Nuestro equipo investigará el problema y te responderá dentro de las 48 horas hábiles.",
      ],
    ],
  },
  {
    id: "politica-reembolsos",
    title: "Política de reembolsos",
    body: [
      "Los reembolsos se manejan caso por caso, teniendo en cuenta las siguientes condiciones:",
      [
        "La solicitud de reembolso debe realizarse dentro de los 7 días posteriores a la compra.",
        "El artículo o servicio no debe haber sido utilizado o activado sustancialmente.",
        "Se debe proporcionar una razón válida para el reembolso.",
      ],
    ],
  },
  {
    id: "proceso-reembolso",
    title: "Proceso de reembolso",
    body: [
      "Si se aprueba un reembolso:",
      [
        "Se procesará a través del método de pago original dentro de los 7 días hábiles.",
        "Puede estar sujeto a una tarifa de procesamiento del 5% del valor de la compra.",
      ],
      "Nos reservamos el derecho de rechazar solicitudes de reembolso que no cumplan con nuestras políticas o que se consideren abusivas.",
    ],
  },
  {
    id: "mas-informacion",
    title: "Más información",
    body: [
      "Para más información sobre cancelaciones, consulta nuestra Política de Cancelaciones.",
    ],
  },
]

export default function DisputePolicyPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Reembolsos"
      title="Política de disputas y reembolsos"
      lead="En Boffmedia, nos esforzamos por proporcionar la mejor experiencia posible a nuestros clientes. Sin embargo, entendemos que pueden surgir problemas o malentendidos. Esta política está diseñada para manejar tales situaciones de manera justa y eficiente."
      updated={updated}
      sections={SECTIONS}
    />
  )
}
