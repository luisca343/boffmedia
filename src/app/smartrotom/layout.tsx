import type { Metadata } from "next";
import "../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalProviders } from "../GlobalProviders";
import AppWrapper from "@/components/smartrotom/AppWrapper";

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
      <TooltipProvider>
        <AppWrapper>{children}</AppWrapper>
      </TooltipProvider>
    </GlobalProviders>
  );
}
