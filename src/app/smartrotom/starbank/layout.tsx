"use client"
import { SideMenu } from "./_components/SideMenu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  
  return (
    <div className="flex overflow-hidden bg-blue-300 "
    style={{
        //background:'url(https://static.vecteezy.com/system/resources/previews/004/695/787/non_2x/banking-service-background-bank-building-icon-made-with-currency-symbols-dollar-euro-yen-and-pound-icons-background-with-currency-signs-bank-financing-money-exchange-illustration-vector.jpg)',
         backgroundRepeat:'no-repeat', backgroundSize:'cover'}}
         >
        <SideMenu />
    {children}
    </div>
    
  );
}
