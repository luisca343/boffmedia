import {
  PolicyShell,
  PolicySection,
  PolicyText,
  PolicyList,
  PolicyLink,
} from "../_components/PolicyShell";

export default function DisputePolicyPage() {
  return (
    <PolicyShell title="Política de Disputas y Reembolsos">
      <PolicyText>
        En BoffMedia, nos esforzamos por proporcionar la mejor experiencia
        posible a nuestros clientes. Sin embargo, entendemos que pueden surgir
        problemas o malentendidos. Esta política está diseñada para manejar
        tales situaciones de manera justa y eficiente.
      </PolicyText>

      <PolicySection title="Proceso de Disputa">
        <PolicyText>
          Si tienes algún problema con tu compra, sigue estos pasos:
        </PolicyText>
        <PolicyList
          ordered
          items={[
            <>
              Contacta a nuestro servicio de atención al cliente a través de
              nuestra{" "}
              <PolicyLink href="/contacto">página de contacto</PolicyLink>.
            </>,
            "Proporciona todos los detalles relevantes, incluyendo el número de pedido y una descripción detallada del problema.",
            "Nuestro equipo investigará el problema y te responderá dentro de las 48 horas hábiles.",
          ]}
        />
      </PolicySection>

      <PolicySection title="Política de Reembolsos">
        <PolicyText>
          Los reembolsos se manejan caso por caso, teniendo en cuenta las
          siguientes condiciones:
        </PolicyText>
        <PolicyList
          items={[
            "La solicitud de reembolso debe realizarse dentro de los 7 días posteriores a la compra.",
            "El artículo o servicio no debe haber sido utilizado o activado sustancialmente.",
            "Se debe proporcionar una razón válida para el reembolso.",
          ]}
        />
      </PolicySection>

      <PolicySection title="Proceso de Reembolso">
        <PolicyText>Si se aprueba un reembolso:</PolicyText>
        <PolicyList
          items={[
            "Se procesará a través del método de pago original dentro de los 7 días hábiles.",
            "Puede estar sujeto a una tarifa de procesamiento del 5% del valor de la compra.",
          ]}
        />
        <PolicyText>
          Nos reservamos el derecho de rechazar solicitudes de reembolso que no
          cumplan con nuestras políticas o que se consideren abusivas.
        </PolicyText>
      </PolicySection>

      <PolicySection title="Más información">
        <PolicyText>
          Para más información sobre cancelaciones, consulta nuestra{" "}
          <PolicyLink href="/cancelaciones">
            Política de Cancelaciones
          </PolicyLink>
          .
        </PolicyText>
      </PolicySection>
    </PolicyShell>
  );
}
