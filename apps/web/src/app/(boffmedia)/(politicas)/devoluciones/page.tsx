import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Política de devoluciones · Boffmedia",
  description: "Condiciones, proceso y resolución de las devoluciones en Boffmedia.",
}

const SECTIONS: LegalSection[] = [
  {
    id: "condiciones",
    title: "Condiciones de devolución",
    body: [
      [
        "La solicitud debe realizarse dentro de los 7 días naturales desde la fecha de compra.",
        "El artículo o servicio no debe haber sido utilizado, activado ni canjeado.",
        "Debes acreditar la compra mediante el comprobante o número de pedido.",
        "Los artículos adquiridos en promoción o con descuento especial quedan excluidos salvo defecto comprobado.",
      ],
    ],
  },
  {
    id: "proceso-solicitud",
    title: "Proceso de solicitud",
    body: [
      "Para iniciar una devolución, contacta con nuestro equipo a través de la página de contacto indicando el número de pedido y el motivo detallado de la solicitud. Nuestro equipo te responderá en un plazo máximo de 48 horas hábiles.",
    ],
  },
  {
    id: "resolucion",
    title: "Resolución",
    body: [
      "Si la devolución es aprobada, el importe será reintegrado mediante el método de pago original en un plazo de 7 días hábiles, pudiendo estar sujeto a una tarifa de gestión del 5% del valor de la compra.",
      "Nos reservamos el derecho de rechazar solicitudes que no cumplan las condiciones anteriores o que se consideren de carácter abusivo.",
    ],
  },
  {
    id: "mas-informacion",
    title: "Más información",
    body: [
      "Consulta también nuestra Política de Cancelaciones y nuestra Política de Disputas y Reembolsos.",
    ],
  },
]

export default function ReturnPolicyPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Devoluciones"
      title="Política de devoluciones"
      lead="En Boffmedia, nos esforzamos por garantizar que cada compra sea una experiencia satisfactoria. Si no estás conforme con tu compra, revisaremos tu caso según los criterios que se detallan a continuación."
      updated={updated}
      sections={SECTIONS}
    />
  )
}
