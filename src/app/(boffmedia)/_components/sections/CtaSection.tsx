import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para comenzar tu aventura?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Únete a miles de jugadores y vive experiencias únicas en nuestros servidores.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="hover:text-primary-500 bg-surface-800 text-white hover:bg-surface-700"
          >
            Comenzar Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}

