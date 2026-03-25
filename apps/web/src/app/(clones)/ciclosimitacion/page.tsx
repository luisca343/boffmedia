import { Button } from "@/components/ui/primitives/button";
import { Header } from "./_components/Header";
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="font-['Roboto',_sans-serif] text-base text-[#444] bg-white min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex flex-1 pt-[98px]">
        <Sidebar isSidebarCollapsed={false} />
        <div className={`font-sans text-base text-[#444] bg-white flex-1 ml-60`}>
          <header className="text-black p-4">
            <h1 className="text-2xl font-normal text-[#1d71b8] mb-4">Inicio</h1>
          </header>

          <main className="p-6">
            <div className="bg-[#e6f3ff] p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-[#1d71b8] mb-4">
                Bienvenido a la Colección de Herramientas de Ayuda
              </h2>

              <p className="mb-4">
                Esta es una colección de herramientas desarrolladas para agilizar
                mi trabajo diario, principalmente evitar tareas repetitivas y
                tediosas.
              </p>

              <h3 className="text-xl font-semibold text-[#1d71b8] mb-2">
                Herramientas disponibles:
              </h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Conversor JSON a DBUnit XML</li>
              </ul>

              <p className="text-sm text-surface-600 mb-4">
                Para acceder a una herramienta específica, seleccione la opción
                correspondiente en el menú de navegación.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href='/ciclosimitacion/dbunit' className="flex items-center justify-between w-full px-4 py-2 bg-[#1d71b8] text-white rounded hover:bg-[#16568c]">
                Conversor JSON a DBUnit XML
                <ExternalLink size={18} />
              </Link>
            </div>

            <footer className="mt-8 text-sm text-surface-600">
              <p>
                Para acceder a la aplicación con usuario y contraseña, debe
                hacer clic en el icono de la esquina superior derecha.
              </p>
              <p>
                Si se le solicita DNI o DOI (Documento oficial de identidad),
                deberá introducir las letras en mayúsculas.
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
