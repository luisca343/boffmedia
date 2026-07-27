import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "../globals.css";
import { GlobalProviders } from "../GlobalProviders";
import AppWrapper from "@/components/smartrotom/AppWrapper";
import { SmartRotomProviders } from "./SmartRotomProviders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.smartrotom")
  return { title: t("index.title"), description: t("index.description") }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      <SmartRotomProviders>
        <AppWrapper>{children}</AppWrapper>
      </SmartRotomProviders>
    </GlobalProviders>
  );
}
