"use client"
import { usePokedexData } from "@/hooks/usePokedexData";
import { LoadingScreen } from "@/components/smartrotom/Loading";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { isLoading } = usePokedexData()
  if(isLoading) return <LoadingScreen/>

  return (<>
    {children}
    </>
  );
}
