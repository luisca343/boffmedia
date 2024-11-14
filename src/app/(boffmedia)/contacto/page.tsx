import React from 'react';
import BoffLayout from '../_components/BoffLayout';
import { ContactForm } from './_components/ContactForm';

export default function ContactPage() {
  return (
    <BoffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-hover">Contacto</h1>
        <p className="mb-4 text-primary-light">
          Para cualquier consulta, puedes contactarnos a través del siguiente
          correo electrónico:{" "}
          <a href="mailto:boffmedia@gmail.com" className="text-primary hover:text-primary transition duration-300">
            boffmedia@gmail.com
          </a>
        </p>
        <p className="mb-4 text-primary-light">O puedes utilizar nuestro formulario de contacto:</p>
        <ContactForm />
      </div>
    </BoffLayout>
  );
}