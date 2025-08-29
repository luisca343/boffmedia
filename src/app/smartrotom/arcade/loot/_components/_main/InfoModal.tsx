import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasSession: boolean;
}

export function InfoModal({ isOpen, onClose, hasSession }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface-900 border-2 border-cyan-500/30 max-w-2xl shadow-md shadow-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-secondary-400">
            Cómo funcionan las Poké Cajas
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-surface-300">
            Descubre objetos especiales para tu colección
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-surface-300">
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">1</span> 
            <span>Selecciona una caja de la colección disponible.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">2</span>
            <span>Necesitas tener la caja en tu inventario para poder abrirla.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">3</span>
            <span>Cada caja contiene diferentes objetos con distintos niveles de rareza, desde comunes hasta legendarios.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">4</span>
            <span>Abre cajas para coleccionar todos los objetos posibles para tu aventura.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">5</span>
            <span>Puedes conseguir cajas completando desafíos en el juego.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">6</span>
            <span>Consulta las probabilidades de cada objeto pulsando el botón &quot;Ver probabilidades&quot; en la caja.</span>
          </p>
          {hasSession && (
            <p className="flex items-start">
              <span className="text-cyan-400 font-bold mr-2 bg-cyan-900/30 w-6 h-6 flex items-center justify-center rounded-full">7</span>
              <span>Los objetos que obtengas se guardan en tu inventario permanente.</span>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}