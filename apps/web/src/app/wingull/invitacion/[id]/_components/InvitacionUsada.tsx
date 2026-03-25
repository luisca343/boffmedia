import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";
import { BackgroundDecorations } from "@/app/wingull/_components/BackgroundDecorations";

export default function InvitacionUsada({ id }: { id: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <BackgroundDecorations />
      <Card className="w-full max-w-2xl shadow-xl bg-secondary-800 bg-opacity-70 text-white rounded-xl overflow-hidden relative z-10">
        <CardHeader className="border-b border-secondary-700">
          <CardTitle className="text-2xl font-bold text-yellow-300">
            Invitación ya utilizada
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4 text-secondary-100">
            <p className="text-lg">
              La invitación con ID {id} ya ha sido utilizada.
            </p>
            <p>
              Cada invitación solo puede ser usada una vez para registrarse en
              el Plan de Desarrollo de Teras.
            </p>
            <p>
              Si crees que esto es un error o necesitas una nueva invitación,
              por favor contacta al administrador.
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            <Link href="/contacto">
              <Button className="bg-yellow-300 text-secondary-900 hover:bg-yellow-400 px-6 py-2 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105">
                <AlertCircle className="mr-2 h-5 w-5" />
                Contactar soporte
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                className="text-secondary-100 border-secondary-600 hover:bg-secondary-700 hover:text-yellow-300 px-6 py-2 rounded-lg text-lg font-semibold transition-all duration-300"
              >
                <Home className="mr-2 h-5 w-5" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
