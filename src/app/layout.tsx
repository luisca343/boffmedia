import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {FicusNav} from "@/components/nav/FicusNav";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "BoffMedia",
  description: "BoffMedia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col h-screen overflow-hidden`}>
        <FicusNav />
        <section className="overflow-auto border-solid no-scrollbar flex-1">{children}</section>
        </body>
    </html>
  );
}
