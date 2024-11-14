import React from 'react';
import Link from 'next/link';
import BoffLayout from '../../_components/BoffLayout';

export default function DisputePolicyPage() {
  return (
    <BoffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">Política de Disputas y Reembolsos</h1>
        <p className="mb-4 text-primary-light">
          En BoffMedia, nos esforzamos por proporcionar la mejor experiencia posible a nuestros clientes. Sin embargo, entendemos que pueden surgir problemas o malentendidos. Esta política está diseñada para manejar tales situaciones de manera justa y eficiente.
        </p>
        
        <h2 className="text-2xl font-bold mb-4 text-primary">Proceso de Disputa</h2>
        <p className="mb-4 text-primary-light">
          Si tienes algún problema con tu compra, sigue estos pasos:
        </p>
        <ol className="list-decimal list-inside mb-4 text-primary-light">
          <li>Contacta a nuestro servicio de atención al cliente a través de nuestra <Link href="/contacto" className="text-primary hover:text-primary transition duration-300">página de contacto</Link>.</li>
          <li>Proporciona todos los detalles relevantes, incluyendo el número de pedido y una descripción detallada del problema.</li>
          <li>Nuestro equipo investigará el problema y te responderá dentro de las 48 horas hábiles.</li>
        </ol>

        <h2 className="text-2xl font-bold mb-4 text-primary">Política de Reembolsos</h2>
        <p className="mb-4 text-primary-light">
          Los reembolsos se manejan caso por caso, teniendo en cuenta las siguientes condiciones:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>La solicitud de reembolso debe realizarse dentro de los 7 días posteriores a la compra.</li>
          <li>El artículo o servicio no debe haber sido utilizado o activado sustancialmente.</li>
          <li>Se debe proporcionar una razón válida para el reembolso.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mb-4 text-primary">Proceso de Reembolso</h2>
        <p className="mb-4 text-primary-light">
          Si se aprueba un reembolso:
        </p>
        <ul className="list-disc list-inside mb-4 text-primary-light">
          <li>Se procesará a través del método de pago original dentro de los 7 días hábiles.</li>
          <li>Puede estar sujeto a una tarifa de procesamiento del 5% del valor de la compra.</li>
        </ul>
        
        <p className="mb-4 text-primary-light">
          Nos reservamos el derecho de rechazar solicitudes de reembolso que no cumplan con nuestras políticas o que se consideren abusivas.
        </p>
        
        <p className="mb-4 text-primary-light">
          Para más información sobre cancelaciones, consulta nuestra <Link href="/politicas/devoluciones" className="text-primary hover:text-primary transition duration-300">Política de Cancelaciones</Link>.
        </p>
      </div>
    </BoffLayout>
  );
}