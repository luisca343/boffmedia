import type { Metadata } from "next";
import { env } from "@/config/env";
import { GlobalProviders } from "../GlobalProviders";
import { BackToTop } from "@/components/ui/BackToTop";

import '../globals.css'
import { Navbar } from "@/components/boffmedia/ui/navigation/Navbar";
import { Footer } from "@/components/boffmedia/ui/layout/Footer";
import { ToastStack } from "@/components/boffmedia/primitives"

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
      {/* v3 base heading styles (tailwind.config.ts) are scoped here for the
          whole group now that every route is v3. `display:contents` keeps the
          body flex layout intact while the descendant selectors still match. */}
      <div data-ds="boffmedia" className="contents">
        <ToastStack />
        <Navbar />
        <section className="no-scrollbar flex-1 bg-base">
            <section className="flex-1 [&>*]:min-h-[calc(100vh_-_22rem)]">
              {children}
            </section>
            <Footer />
        </section>
        <BackToTop />
      </div>
    </GlobalProviders>
  );
}
