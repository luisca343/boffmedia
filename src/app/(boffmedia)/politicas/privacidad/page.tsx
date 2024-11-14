import React from 'react';
import Link from 'next/link';
import BoffLayout from '../../_components/BoffLayout';

export default function PrivacyPolicyPage() {
  return (
    <BoffLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">Política de Privacidad</h1>
        
        <p className="mb-4 text-primary-light">
          En BoffMedia, valoramos y respetamos tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestros servicios de juegos en línea y nuestro sitio web.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary">1. Información que Recopilamos</h2>
        <p className="mb-4 text-primary-light">
          Podemos recopilar los siguientes tipos de información:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>Información de registro: nombre de usuario, dirección de correo electrónico, contraseña.</li>
          <li>Información de perfil: avatar, biografía, preferencias de juego.</li>
          <li>Información de juego: estadísticas, logros, historial de partidas.</li>
          <li>Información de pago: para procesar compras dentro del juego (gestionada por procesadores de pago seguros).</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary">2. Uso de la Información</h2>
        <p className="mb-4 text-primary-light">
          Utilizamos tu información para:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>Proporcionar y mejorar nuestros servicios de juego.</li>
          <li>Personalizar tu experiencia de juego.</li>
          <li>Procesar transacciones y enviar notificaciones relacionadas.</li>
          <li>Comunicarnos contigo sobre actualizaciones, ofertas y eventos.</li>
          <li>Prevenir fraudes y garantizar la seguridad de nuestros servicios.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary">3. Compartir Información</h2>
        <p className="mb-4 text-primary-light">
          No vendemos tu información personal. Podemos compartir información en las siguientes circunstancias:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>Con otros jugadores, según las configuraciones de tu perfil.</li>
          <li>Con proveedores de servicios que nos ayudan a operar nuestros juegos y sitio web.</li>
          <li>Si es requerido por ley o para proteger nuestros derechos legales.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary">4. Seguridad de Datos</h2>
        <p className="mb-4 text-primary-light">
          Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary">5. Tus Derechos</h2>
        <p className="mb-4 text-primary-light">
          Tienes derecho a:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>Acceder a tu información personal.</li>
          <li>Corregir información inexacta.</li>
          <li>Eliminar tu información.</li>
          <li>Oponerte al procesamiento de tu información.</li>
          <li>Retirar tu consentimiento en cualquier momento.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary">6. Cookies y Tecnologías Similares</h2>
        <p className="mb-4 text-primary-light">
          Utilizamos cookies y tecnologías similares para mejorar la funcionalidad de nuestro sitio web y servicios de juego. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary">7. Cambios en esta Política</h2>
        <p className="mb-4 text-primary-light">
          Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos a través de nuestro sitio web o por correo electrónico.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary">8. Contacto</h2>
        <p className="mb-4 text-primary-light">
          Si tienes preguntas sobre esta Política de Privacidad, por favor contáctanos a través de nuestra <Link href="/contacto" className="text-primary hover:text-primary transition duration-300">página de contacto</Link>.
        </p>

        <p className="mt-8 text-primary-light">
          Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </BoffLayout>
  );
}