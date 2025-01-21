import type { Metadata } from "next";
import "./globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: process.env.NODE_ENV === 'production' ? "BoffMedia" : "FicusLab",
  description: "BoffMedia",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang="en">
      <NextIntlClientProvider messages={messages}>
      <body
        className={`flex flex-col h-screen bg-transparent`}
      >
        {children}
      </body>
      </NextIntlClientProvider>
    </html>
  );
}
