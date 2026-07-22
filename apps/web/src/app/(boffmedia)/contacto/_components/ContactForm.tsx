"use client"
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ContactForm() {
  const t = useTranslations("boffmedia");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

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
    setSent(true);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-panel-2 p-6 rounded-lg shadow-lg"
    >
      <div className="mb-4">
        <label htmlFor="name" className="block text-accent-bright mb-2">
          {t("contact.nameLabel")}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-panel-2 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-accent-bright mb-2">
          {t("contact.emailLabel")}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 rounded bg-panel-2 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="message" className="block text-accent-bright mb-2">
          {t("contact.messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full p-2 rounded bg-panel-2 text-white border border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          rows={4}
          required
        ></textarea>
      </div>
      {sent && (
        <p className="mb-4 text-accent-bright">
          {t("contact.successMessage")}
        </p>
      )}
      <button
        type="submit"
        className="bg-gradient-to-r from-accent to-accent-bright px-6 py-2 rounded-full text-white font-bold hover:from-accent-bright hover:to-accent-soft transition duration-300 shadow-neon"
      >
        {t("contact.submit")}
      </button>
    </form>
  );
}
