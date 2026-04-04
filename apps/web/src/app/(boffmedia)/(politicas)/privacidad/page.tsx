import {
  PolicyShell,
  PolicySection,
  PolicyText,
  PolicyList,
  PolicyLink,
} from "../_components/PolicyShell";

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PolicyShell title="Política de Privacidad" lastUpdated={lastUpdated}>
      <PolicyText>
        En BoffMedia, valoramos y respetamos tu privacidad. Esta Política de
        Privacidad explica cómo recopilamos, usamos y protegemos tu información
        personal cuando utilizas nuestros servicios de juegos en línea y nuestro
        sitio web.
      </PolicyText>

      <PolicySection title="1. Información que Recopilamos">
        <PolicyText>
          Podemos recopilar los siguientes tipos de información:
        </PolicyText>
        <PolicyList
          items={[
            "Información de registro: nombre de usuario, dirección de correo electrónico, contraseña.",
            "Información de perfil: avatar, biografía, preferencias de juego.",
            "Información de juego: estadísticas, logros, historial de partidas.",
            "Información de pago: para procesar compras dentro del juego (gestionada por procesadores de pago seguros).",
          ]}
        />
      </PolicySection>

      <PolicySection title="2. Uso de la Información">
        <PolicyText>Utilizamos tu información para:</PolicyText>
        <PolicyList
          items={[
            "Proporcionar y mejorar nuestros servicios de juego.",
            "Personalizar tu experiencia de juego.",
            "Procesar transacciones y enviar notificaciones relacionadas.",
            "Comunicarnos contigo sobre actualizaciones, ofertas y eventos.",
            "Prevenir fraudes y garantizar la seguridad de nuestros servicios.",
          ]}
        />
      </PolicySection>

      <PolicySection title="3. Compartir Información">
        <PolicyText>
          No vendemos tu información personal. Podemos compartir información en
          las siguientes circunstancias:
        </PolicyText>
        <PolicyList
          items={[
            "Con otros jugadores, según las configuraciones de tu perfil.",
            "Con proveedores de servicios que nos ayudan a operar nuestros juegos y sitio web.",
            "Si es requerido por ley o para proteger nuestros derechos legales.",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Seguridad de Datos">
        <PolicyText>
          Implementamos medidas de seguridad técnicas y organizativas para
          proteger tu información personal contra acceso no autorizado, pérdida
          o alteración.
        </PolicyText>
      </PolicySection>

      <PolicySection title="5. Tus Derechos">
        <PolicyText>Tienes derecho a:</PolicyText>
        <PolicyList
          items={[
            "Acceder a tu información personal.",
            "Corregir información inexacta.",
            "Eliminar tu información.",
            "Oponerte al procesamiento de tu información.",
            "Retirar tu consentimiento en cualquier momento.",
          ]}
        />
      </PolicySection>

      <PolicySection title="6. Cookies y Tecnologías Similares">
        <PolicyText>
          Utilizamos cookies y tecnologías similares para mejorar la
          funcionalidad de nuestro sitio web y servicios de juego. Puedes
          gestionar tus preferencias de cookies a través de la configuración de
          tu navegador.
        </PolicyText>
      </PolicySection>

      <PolicySection title="7. Cambios en esta Política">
        <PolicyText>
          Podemos actualizar esta Política de Privacidad periódicamente. Te
          notificaremos sobre cambios significativos a través de nuestro sitio
          web o por correo electrónico.
        </PolicyText>
      </PolicySection>

      <PolicySection title="8. Contacto">
        <PolicyText>
          Si tienes preguntas sobre esta Política de Privacidad, por favor
          contáctanos a través de nuestra{" "}
          <PolicyLink href="/contacto">página de contacto</PolicyLink>.
        </PolicyText>
      </PolicySection>
    </PolicyShell>
  );
}
