import type { Metadata } from "next";
import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalProviders } from "../GlobalProviders";
import AppWrapper from "@/components/smartrotom/AppWrapper";
import { SmartRotomProviders } from "./SmartRotomProviders";

export const metadata: Metadata = {
  title: "SmartRotom",
  description: "SmartRotom",
};

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
