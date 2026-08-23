import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import React from "react";
import { ContactForm } from "./_components/ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.contacto")
  return { title: t("index.title"), description: t("index.description") }
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto pt-16">
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-bright">
        Contacto
      </h1>
      <p className="mb-4 text-accent-bright">
        Para cualquier consulta, puedes contactarnos a través del siguiente
        correo electrónico:{" "}
        <a
          href="mailto:boffmedia@gmail.com"
          className="text-accent-bright hover:text-accent-bright transition duration-300"
        >
          boffmedia@gmail.com
        </a>
      </p>
      <p className="mb-4 text-accent-bright">
        O puedes utilizar nuestro formulario de contacto:
      </p>
      <ContactForm />
    </div>
  );
}
