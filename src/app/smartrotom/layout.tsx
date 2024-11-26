import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import RotomNav from "@/components/nav/RotomNav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalProviders } from "../GlobalProviders";
import AppWrapper from "@/components/smartrotom/AppWrapper";

const inter = Inter({ subsets: ["latin"] });

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
