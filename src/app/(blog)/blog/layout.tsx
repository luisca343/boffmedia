import { GlobalProviders } from "@/app/GlobalProviders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      {children}
    </GlobalProviders>
  );
}