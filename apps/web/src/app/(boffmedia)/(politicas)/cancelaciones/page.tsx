import {
  PolicyShell,
  PolicySection,
  PolicyText,
  PolicyList,
  PolicyLink,
} from "../_components/PolicyShell";

export default function CancellationPolicyPage() {
  return (
    <PolicyShell title="Política de Cancelaciones">
      <PolicyText>
        Dado que solo vendemos artículos dentro del juego y servicios en línea
        para Minecraft, nuestra política de cancelaciones es limitada. Sin
        embargo, entendemos que pueden surgir situaciones excepcionales.
      </PolicyText>

      <PolicySection title="Proceso de Cancelación">
        <PolicyText>
          Si encuentras algún problema con tu compra o necesitas solicitar una
          cancelación, por favor contacta a nuestro servicio de atención al
          cliente a través de nuestra{" "}
          <PolicyLink href="/contacto">página de contacto</PolicyLink> lo antes
          posible.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Condiciones de Cancelación">
        <PolicyList
          items={[
            "La solicitud de cancelación debe ser realizada dentro de las 24 horas posteriores a la compra.",
            "El artículo o servicio no debe haber sido utilizado o activado.",
            "Debes proporcionar detalles específicos del problema encontrado o la razón de la cancelación.",
            "Nos reservamos el derecho de investigar y resolver la solicitud de cancelación a nuestra discreción.",
          ]}
        />
        <PolicyText>
          Ten en cuenta que las cancelaciones aprobadas pueden estar sujetas a
          una tarifa de procesamiento del 5% del valor de la compra.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Más información">
        <PolicyText>
          Para más información sobre reembolsos y disputas, por favor consulta
          nuestra{" "}
          <PolicyLink href="/reembolsos">
            Política de Disputas y Reembolsos
          </PolicyLink>
          .
        </PolicyText>
      </PolicySection>
    </PolicyShell>
  );
}
