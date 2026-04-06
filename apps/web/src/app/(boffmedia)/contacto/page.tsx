import React from "react";
import { Container, Heading, Text } from "@/components/ui";
import { ContactForm } from "./_components/ContactForm";

export default function ContactPage() {
  return (
    <Container size="sm">
      <Heading as="h1" size="lg" weight="bold" className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600">
        Contacto
      </Heading>
      <Text color="muted" className="mb-4">
        Para cualquier consulta, puedes contactarnos a través del siguiente
        correo electrónico:{" "}
        <a
          href="mailto:boffmedia@gmail.com"
          className="text-primary-400 hover:text-primary-300 transition duration-300"
        >
          boffmedia@gmail.com
        </a>
      </Text>
      <Text color="muted" className="mb-4">
        O puedes utilizar nuestro formulario de contacto:
      </Text>
      <ContactForm />
    </Container>
  );
}
