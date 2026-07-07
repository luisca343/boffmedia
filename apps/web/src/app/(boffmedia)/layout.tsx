import type { Metadata } from "next";
import { env } from "@/config/env";
import { GlobalProviders } from "../GlobalProviders";
import { BackToTop } from "@/components/ui/BackToTop";

import '../globals.css'
import { Navbar } from "@/components/boffmedia/ui/navigation/Navbar";
import { Footer } from "@/components/boffmedia/ui/layout/Footer";
import { ToastStack } from "@/components/boffmedia/primitives/toast";

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
      {/* v3 base heading styles (tailwind.config.ts) are scoped per-page via
          data-ds="boffmedia" on each migrated page root — not here, so the
          not-yet-migrated v2 pages under this layout keep their look. Move the
          attribute up to this layout once every page is on v3. */}
      <ToastStack />
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
