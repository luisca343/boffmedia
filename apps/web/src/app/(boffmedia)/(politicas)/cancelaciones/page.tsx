import type { Metadata } from "next"
import { LegalDoc, type LegalSection } from "@/components/boffmedia/ui/legal"

export const metadata: Metadata = {
  title: "Política de cancelaciones · Boffmedia",
  description: "Cómo solicitar la cancelación de una compra en Boffmedia y en qué condiciones.",
}

const SECTIONS: LegalSection[] = [
  {
    id: "proceso-cancelacion",
    title: "Proceso de cancelación",
    body: [
      "Si encuentras algún problema con tu compra o necesitas solicitar una cancelación, contacta a nuestro servicio de atención al cliente a través de nuestra página de contacto lo antes posible.",
    ],
  },
  {
    id: "condiciones",
    title: "Condiciones de cancelación",
    body: [
      [
        "La solicitud de cancelación debe realizarse dentro de las 24 horas posteriores a la compra.",
        "El artículo o servicio no debe haber sido utilizado o activado.",
        "Debes proporcionar detalles específicos del problema encontrado o la razón de la cancelación.",
        "Nos reservamos el derecho de investigar y resolver la solicitud de cancelación a nuestra discreción.",
      ],
      "Ten en cuenta que las cancelaciones aprobadas pueden estar sujetas a una tarifa de procesamiento del 5% del valor de la compra.",
    ],
  },
  {
    id: "mas-informacion",
    title: "Más información",
    body: [
      "Para más información sobre reembolsos y disputas, consulta nuestra Política de Disputas y Reembolsos.",
    ],
  },
]

export default function CancellationPolicyPage() {
  const updated = `Última actualización: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`
  return (
    <LegalDoc
      kicker="Legal · Cancelaciones"
      title="Política de cancelaciones"
      lead="Dado que solo vendemos artículos dentro del juego y servicios en línea para Minecraft, nuestra política de cancelaciones es limitada. Sin embargo, entendemos que pueden surgir situaciones excepcionales."
      updated={updated}
      sections={SECTIONS}
    />
  )
}
