import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalProviders } from "./GlobalProviders";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import OptimizedFicusNav from "@/components/nav/FicusNav";

const inter = Inter({ subsets: ["latin"] });

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
        className={`${inter.className} flex flex-col h-screen bg-transparent`}
      >
        {children}
      </body>
      </NextIntlClientProvider>
    </html>
  );
}
