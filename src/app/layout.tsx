import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalProviders } from "./GlobalProviders";

import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import OptimizedFicusNav from "@/components/nav/FicusNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BoffMedia",
  description: "BoffMedia",
};

export default async  function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  return (
    <GlobalProviders>
      <html lang="en">
        <body
          className={`${inter.className} flex flex-col h-screen overflow-hidden bg-transparent`}
        >
          <ToastContainer position="bottom-right" theme="dark" />
          <OptimizedFicusNav />
          <section className="overflow-auto border-solid no-scrollbar flex-1 pt-16">
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </section>
        </body>
      </html>
    </GlobalProviders>
  );
}
