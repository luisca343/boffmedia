import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasSession: boolean;
}

export function InfoModal({ isOpen, onClose, hasSession }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-2 border-cyan-500/30 max-w-2xl shadow-md shadow-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Cómo funcionan las Poké Cajas
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-gray-300">
            Descubre objetos especiales para tu colección
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-gray-300">
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
            <span>Los objetos tienen diferentes niveles de rareza:</span>
          </p>
          <div className="bg-gray-950/50 rounded-lg p-4 border border-gray-800">
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span className="text-gray-400">Común - 60% de probabilidad</span>
              </li>
              <li className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <span className="text-green-400">Poco común - 25% de probabilidad</span>
              </li>
              <li className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-blue-400">Raro - 10% de probabilidad</span>
              </li>
              <li className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                <span className="text-purple-400">Épico - 4% de probabilidad</span>
              </li>
              <li className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                <span className="text-yellow-400">Legendario - 1% de probabilidad</span>
              </li>
            </ul>
          </div>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">4</span>
            <span>Abre cajas para coleccionar todos los objetos posibles.</span>
          </p>
          <p className="flex items-start">
            <span className="text-yellow-400 font-bold mr-2 bg-yellow-900/30 w-6 h-6 flex items-center justify-center rounded-full">5</span>
            <span>Puedes conseguir cajas completando desafíos en el juego.</span>
          </p>
          {hasSession && (
            <p className="flex items-start">
              <span className="text-cyan-400 font-bold mr-2 bg-cyan-900/30 w-6 h-6 flex items-center justify-center rounded-full">6</span>
              <span>Los objetos que obtengas se guardan en tu inventario permanente.</span>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}