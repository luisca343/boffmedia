import type { Metadata } from "next";
import { env } from "@/config/env";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GlobalProviders } from "../GlobalProviders";
import { BackToTop } from "@/components/ui/BackToTop";

import '../globals.css'
import { Navbar } from "@/components/boffmedia/ui/navigation/Navbar";
import { Footer } from "@/components/boffmedia/ui/layout/Footer";

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
      <Navbar />
      <section className="no-scrollbar flex-1 bg-base">
          <section className="flex-1 [&>*]:min-h-[calc(100vh-22rem)]">
            {children}
          </section>
          <Footer />
      </section>
      <BackToTop />
    </GlobalProviders>
  );
}
