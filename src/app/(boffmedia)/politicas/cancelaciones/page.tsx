import React from 'react';
import Link from 'next/link';
import BoffLayout from '../../_components/BoffLayout';

export default function CancellationPolicyPage() {
  return (
    <BoffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600">Política de Cancelaciones</h1>
        <p className="mb-4 text-primary-100">
          Dado que solo vendemos artículos dentro del juego y servicios en línea para Minecraft, nuestra política de cancelaciones es limitada. Sin embargo, entendemos que pueden surgir situaciones excepcionales.
        </p>
        <h2 className="text-2xl font-bold mb-4 text-primary-400">Proceso de Cancelación</h2>
        <p className="mb-4 text-primary-100">
          Si encuentras algún problema con tu compra o necesitas solicitar una cancelación, por favor contacta a nuestro servicio de atención al cliente a través de nuestra <Link href="/contacto" className="text-primary-400 hover:text-primary-300 transition duration-300">página de contacto</Link> lo antes posible.
        </p>
        <h2 className="text-2xl font-bold mb-4 text-primary-400">Condiciones de Cancelación</h2>
        <ul className="list-disc list-inside mb-4 text-primary-100">
          <li>La solicitud de cancelación debe ser realizada dentro de las 24 horas posteriores a la compra.</li>
          <li>El artículo o servicio no debe haber sido utilizado o activado.</li>
          <li>Debes proporcionar detalles específicos del problema encontrado o la razón de la cancelación.</li>
          <li>Nos reservamos el derecho de investigar y resolver la solicitud de cancelación a nuestra discreción.</li>
        </ul>
        <p className="mb-4 text-primary-100">
          Ten en cuenta que las cancelaciones aprobadas pueden estar sujetas a una tarifa de procesamiento del 5% del valor de la compra.
        </p>
        <p className="mb-4 text-primary-100">
          Para más información sobre reembolsos y disputas, por favor consulta nuestra <Link href="/politica-de-disputas" className="text-primary-400 hover:text-primary-300 transition duration-300">Política de Disputas y Reembolsos</Link>.
        </p>
      </div>
    </BoffLayout>
  );
}