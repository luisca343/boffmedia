import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OptimizedFicusNav from "@/components/nav/FicusNav";
import { GlobalProviders } from "../GlobalProviders";

import '../globals.css'
import { BoffFooter } from "./_components/BoffFooter";

export const metadata: Metadata = {
  title: process.env.NODE_ENV === 'production' ? "BoffMedia" : "FicusLab",
  description: "BoffMedia",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      <ToastContainer position="bottom-right" theme="dark" />
      <OptimizedFicusNav />
      <section className="border-solid no-scrollbar flex-1 pt-16 bg-surface-900">
          <section className="flex-1 [&>*]:min-h-[calc(100vh-22rem)] [&>*:not(.main)]:py-8">
            {children}
          </section>
          <BoffFooter />
      </section>
    </GlobalProviders>
  );
}
