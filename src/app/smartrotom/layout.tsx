import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./smartrotom.css";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <AppWrapper>{children}</AppWrapper>
    </TooltipProvider>
  );
}
