import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import OptimizedFicusNav from "@/components/nav/FicusNav";
import { GlobalProviders } from "../GlobalProviders";
import BoffLayout from "./_components/BoffLayout";

import '../globals.css'

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
    <GlobalProviders>
      <ToastContainer position="bottom-right" theme="dark" />
      <OptimizedFicusNav />
      <section className="border-solid no-scrollbar flex-1 pt-16">
        <NextIntlClientProvider messages={messages}>
          <BoffLayout>{children}</BoffLayout>
        </NextIntlClientProvider>
      </section>
    </GlobalProviders>
  );
}
