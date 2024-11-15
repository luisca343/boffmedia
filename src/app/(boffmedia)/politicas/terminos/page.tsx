import React from 'react';
import Link from 'next/link';
import BoffLayout from '../../_components/BoffLayout';

export default function TermsOfServicePage() {
  return (
    <BoffLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600">Términos de Servicio</h1>
        
        <p className="mb-4 text-primary-100">
          Bienvenido a BoffMedia. Al acceder y utilizar nuestros servicios, aceptas cumplir y estar sujeto a los siguientes términos y condiciones. Lee atentamente estos Términos de Servicio antes de utilizar nuestra plataforma.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">1. Aceptación de los Términos</h2>
        <p className="mb-4 text-primary-100">
          Al utilizar nuestros servicios, aceptas estos Términos de Servicio en su totalidad. Si no estás de acuerdo con estos términos, por favor, no utilices nuestros servicios.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">2. Cambios en los Términos</h2>
        <p className="mb-4 text-primary-100">
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos a través de nuestro sitio web o por correo electrónico. El uso continuado de nuestros servicios después de dichos cambios constituye tu aceptación de los nuevos términos.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">3. Uso del Servicio</h2>
        <p className="mb-4 text-primary-100">
          Nuestros servicios están destinados únicamente para uso personal y no comercial. Te comprometes a no:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-100">
          <li>Utilizar nuestros servicios para cualquier propósito ilegal o no autorizado.</li>
          <li>Interferir o interrumpir la integridad o el rendimiento de nuestros servicios.</li>
          <li>Intentar obtener acceso no autorizado a nuestros sistemas o redes.</li>
          <li>Copiar, modificar, distribuir, vender o arrendar cualquier parte de nuestros servicios.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">4. Cuentas de Usuario</h2>
        <p className="mb-4 text-primary-100">
          Para acceder a ciertas funciones de nuestros servicios, deberás crear una cuenta. Eres responsable de:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-100">
          <li>Mantener la confidencialidad de tu cuenta y contraseña.</li>
          <li>Restringir el acceso a tu computadora o dispositivo.</li>
          <li>Todas las actividades que ocurran bajo tu cuenta.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">5. Contenido del Usuario</h2>
        <p className="mb-4 text-primary-100">
          Nuestros servicios pueden permitirte publicar, enlazar, almacenar, compartir y poner a disposición cierta información, texto, gráficos, videos u otros materiales. Eres responsable de este contenido y de cualquier reclamo relacionado con él.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">6. Propiedad Intelectual</h2>
        <p className="mb-4 text-primary-100">
          El servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de BoffMedia y sus licenciantes. El servicio está protegido por derechos de autor, marcas registradas y otras leyes.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">7. Compras y Pagos</h2>
        <p className="mb-4 text-primary-100">
          Si realizas una compra a través de nuestros servicios, aceptas proporcionar información de pago precisa y completa. Todas las tarifas están sujetas a cambios y son no reembolsables, excepto según lo exija la ley o se indique en nuestra política de reembolsos.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">8. Terminación</h2>
        <p className="mb-4 text-primary-100">
          Podemos terminar o suspender tu acceso inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, sin limitación, si incumples estos Términos de Servicio.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">9. Limitación de Responsabilidad</h2>
        <p className="mb-4 text-primary-100">
          En ningún caso BoffMedia, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">10. Ley Aplicable</h2>
        <p className="mb-4 text-primary-100">
          Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
        </p>

        <h2 className="text-2xl font-bold mb-4 text-primary-400">11. Contacto</h2>
        <p className="mb-4 text-primary-100">
          Si tienes preguntas sobre estos Términos de Servicio, por favor contáctanos a través de nuestra <Link href="/contacto" className="text-primary-400 hover:text-primary-300 transition duration-300">página de contacto</Link>.
        </p>

        <p className="mt-8 text-primary-100">
          Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </BoffLayout>
  );
}