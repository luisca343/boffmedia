import {
  PolicyShell,
  PolicySection,
  PolicyText,
  PolicyList,
  PolicyLink,
} from "../_components/PolicyShell";

export default function TermsOfServicePage() {
  const lastUpdated = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PolicyShell title="Términos de Servicio" lastUpdated={lastUpdated}>
      <PolicyText>
        Bienvenido a BoffMedia. Al acceder y utilizar nuestros servicios,
        aceptas cumplir y estar sujeto a los siguientes términos y condiciones.
        Lee atentamente estos Términos de Servicio antes de utilizar nuestra
        plataforma.
      </PolicyText>

      <PolicySection title="1. Aceptación de los Términos">
        <PolicyText>
          Al utilizar nuestros servicios, aceptas estos Términos de Servicio en
          su totalidad. Si no estás de acuerdo con estos términos, por favor, no
          utilices nuestros servicios.
        </PolicyText>
      </PolicySection>

      <PolicySection title="2. Cambios en los Términos">
        <PolicyText>
          Nos reservamos el derecho de modificar estos términos en cualquier
          momento. Te notificaremos sobre cambios significativos a través de
          nuestro sitio web o por correo electrónico. El uso continuado de
          nuestros servicios después de dichos cambios constituye tu aceptación
          de los nuevos términos.
        </PolicyText>
      </PolicySection>

      <PolicySection title="3. Uso del Servicio">
        <PolicyText>
          Nuestros servicios están destinados únicamente para uso personal y no
          comercial. Te comprometes a no:
        </PolicyText>
        <PolicyList
          items={[
            "Utilizar nuestros servicios para cualquier propósito ilegal o no autorizado.",
            "Interferir o interrumpir la integridad o el rendimiento de nuestros servicios.",
            "Intentar obtener acceso no autorizado a nuestros sistemas o redes.",
            "Copiar, modificar, distribuir, vender o arrendar cualquier parte de nuestros servicios.",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Cuentas de Usuario">
        <PolicyText>
          Para acceder a ciertas funciones de nuestros servicios, deberás crear
          una cuenta. Eres responsable de:
        </PolicyText>
        <PolicyList
          items={[
            "Mantener la confidencialidad de tu cuenta y contraseña.",
            "Restringir el acceso a tu computadora o dispositivo.",
            "Todas las actividades que ocurran bajo tu cuenta.",
          ]}
        />
      </PolicySection>

      <PolicySection title="5. Contenido del Usuario">
        <PolicyText>
          Nuestros servicios pueden permitirte publicar, enlazar, almacenar,
          compartir y poner a disposición cierta información, texto, gráficos,
          videos u otros materiales. Eres responsable de este contenido y de
          cualquier reclamo relacionado con él.
        </PolicyText>
      </PolicySection>

      <PolicySection title="6. Propiedad Intelectual">
        <PolicyText>
          El servicio y su contenido original, características y funcionalidad
          son y seguirán siendo propiedad exclusiva de BoffMedia y sus
          licenciantes. El servicio está protegido por derechos de autor, marcas
          registradas y otras leyes.
        </PolicyText>
      </PolicySection>

      <PolicySection title="7. Compras y Pagos">
        <PolicyText>
          Si realizas una compra a través de nuestros servicios, aceptas
          proporcionar información de pago precisa y completa. Todas las tarifas
          están sujetas a cambios y son no reembolsables, excepto según lo exija
          la ley o se indique en nuestra{" "}
          <PolicyLink href="/reembolsos">política de reembolsos</PolicyLink>.
        </PolicyText>
      </PolicySection>

      <PolicySection title="8. Terminación">
        <PolicyText>
          Podemos terminar o suspender tu acceso inmediatamente, sin previo
          aviso ni responsabilidad, por cualquier motivo, incluyendo, sin
          limitación, si incumples estos Términos de Servicio.
        </PolicyText>
      </PolicySection>

      <PolicySection title="9. Limitación de Responsabilidad">
        <PolicyText>
          En ningún caso BoffMedia, ni sus directores, empleados, socios,
          agentes, proveedores o afiliados, serán responsables por cualquier
          daño indirecto, incidental, especial, consecuente o punitivo.
        </PolicyText>
      </PolicySection>

      <PolicySection title="10. Ley Aplicable">
        <PolicyText>
          Estos Términos se regirán e interpretarán de acuerdo con las leyes de
          España, sin tener en cuenta sus disposiciones sobre conflictos de
          leyes.
        </PolicyText>
      </PolicySection>

      <PolicySection title="11. Contacto">
        <PolicyText>
          Si tienes preguntas sobre estos Términos de Servicio, por favor
          contáctanos a través de nuestra{" "}
          <PolicyLink href="/contacto">página de contacto</PolicyLink>.
        </PolicyText>
      </PolicySection>
    </PolicyShell>
  );
}
