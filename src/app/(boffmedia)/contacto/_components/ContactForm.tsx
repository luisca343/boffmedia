"use client"
import { useState } from "react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would typically send the form data to your server
    console.log("Form submitted:", formData);
    // Reset form after submission
    setFormData({ name: "", email: "", message: "" });
    alert("Mensaje enviado. ¡Gracias por contactarnos!");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-main-800 p-6 rounded-lg shadow-lg"
    >
      <div className="mb-4">
        <label htmlFor="name" className="block text-orange-300 mb-2">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-main-700 text-white border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-orange-300 mb-2">
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 rounded bg-main-700 text-white border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="message" className="block text-orange-300 mb-2">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full p-2 rounded bg-main-700 text-white border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={4}
          required
        ></textarea>
      </div>
      <button
        type="submit"
        className="bg-gradient-to-r from-orange-500 to-orange-700 px-6 py-2 rounded-full text-white font-bold hover:from-orange-600 hover:to-orange-800 transition duration-300 shadow-neon"
      >
        Enviar
      </button>
    </form>
  );
}
