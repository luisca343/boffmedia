import type { Metadata } from "next";
import { env } from "@/config/env";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FicusNav } from "@/components/boffmedia/navigation/FicusNav";
import { GlobalProviders } from "../GlobalProviders";
import { BackToTop } from "@/components/ui/BackToTop";

import '../globals.css'
import { BoffFooter } from "./_components/layout/BoffFooter";

export const metadata: Metadata = {
  title: env.NODE_ENV === 'production' ? "BoffMedia" : "FicusLab",
  description: env.NODE_ENV === 'production' ? "BoffMedia" : "FicusLab"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      <ToastContainer position="bottom-right" theme="dark" />
      <FicusNav />
      <section className="border-solid no-scrollbar flex-1 pt-16 bg-surface-900">
          <section className="flex-1 [&>*]:min-h-[calc(100vh-22rem)] [&>*:not(.main)]:py-8">
            {children}
          </section>
          <BoffFooter />
      </section>
      <BackToTop />
    </GlobalProviders>
  );
}
