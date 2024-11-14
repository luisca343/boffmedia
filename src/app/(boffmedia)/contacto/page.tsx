import React from 'react';
import BoffLayout from '../_components/BoffLayout';
import { ContactForm } from './_components/ContactForm';

export default function ContactPage() {
  return (
    <BoffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-600">Contacto</h1>
        <p className="mb-4 text-orange-100">
          Para cualquier consulta, puedes contactarnos a través del siguiente
          correo electrónico:{" "}
          <a href="mailto:boffmedia@gmail.com" className="text-orange-400 hover:text-orange-300 transition duration-300">
            boffmedia@gmail.com
          </a>
        </p>
        <p className="mb-4 text-orange-100">O puedes utilizar nuestro formulario de contacto:</p>
        <ContactForm />
      </div>
    </BoffLayout>
  );
}