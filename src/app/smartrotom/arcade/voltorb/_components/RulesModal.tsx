import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RainbowText } from "../../_components/RainbowText";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[80vh] flex flex-col bg-surface-2 border-4 border-yellow-500 rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-surface-3 p-4 border-b-4 border-yellow-500">
          <DialogTitle className="text-center">
            <RainbowText text="Reglas de Gira Voltorb" size="lg" />
          </DialogTitle>
          <DialogDescription className="text-center text-text-secondary">
            Descubre cómo jugar este emocionante juego de estrategia y suerte
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Introducción
              </h3>
              <p className="text-text-secondary">
                Gira Voltorb es una mezcla entre Picross y Buscaminas. Tu
                objetivo es encontrar las cartas multiplicadoras sin voltear
                ningún Voltorb.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                El Tablero
              </h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>El juego se desarrolla en una cuadrícula de 5x5.</li>
                <li>
                  Bajo cada casilla se esconde un número (1, 2 o 3) o un
                  Voltorb.
                </li>
                <li>
                  Los números son multiplicadores que aumentan tus monedas.
                </li>
                <li>
                  Los Voltorb hacen que pierdas todas las monedas de la ronda
                  actual.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Cómo Jugar
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-text-secondary">
                <li>Haz clic en una casilla para voltearla.</li>
                <li>
                  Si encuentras un multiplicador (x2 o x3), tus monedas se
                  multiplican por ese valor.
                </li>
                <li>
                  Si es la primera carta que volteas, obtienes ese número de
                  monedas.
                </li>
                <li>
                  Si encuentras un Voltorb, pierdes todas las monedas de la
                  ronda y el juego termina.
                </li>
                <li>
                  Puedes elegir Cobrar en cualquier momento para guardar tus
                  monedas y pasar al siguiente nivel.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Niveles y Progresión
              </h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Hay 8 niveles en total.</li>
                <li>
                  Ganas y avanzas de nivel encontrando todas las cartas x2 y x3.
                </li>
                <li>
                  Los niveles más altos tienen más multiplicadores y Voltorbs,
                  aumentando el riesgo y la recompensa.
                </li>
                <li className="font-medium">
                  Regla de regresión de nivel:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>
                      Todas las cartas con números (x1, x2, x3) cuentan como
                      cartas multiplicadoras.
                    </li>
                    <li>
                      Si al terminar la ronda (ya sea por encontrar un Voltorb o
                      por elegir Cobrar) has volteado menos cartas
                      multiplicadoras que el número de tu nivel actual, bajarás
                      de nivel.
                    </li>
                    <li>
                      El nuevo nivel será igual al número de cartas
                      multiplicadoras que hayas volteado.
                    </li>
                    <li>
                      Ejemplo: Si estás en el nivel 5 y volteas solo 3 cartas
                      multiplicadoras (incluyendo x1) antes de que termine la
                      ronda, bajarás al nivel 3 para la siguiente ronda.
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Nivel 8
              </h3>
              <p className="text-text-secondary">
                Para alcanzar el nivel 8, debes ganar 5 juegos seguidos en
                cualquier nivel, volteando 8 o más cartas multiplicadoras en
                cada uno de estos 5 juegos.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Modo Memo
              </h3>
              <p className="text-text-secondary">
                Puedes usar el modo Memo para marcar las casillas con símbolos
                (Voltorb, 1, 2 o 3) sin voltearlas. Esto te ayuda a recordar tus
                sospechas sobre el contenido de cada casilla.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">
                Consejos
              </h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>
                  Usa la información de las filas y columnas para deducir la
                  ubicación de los multiplicadores y Voltorbs.
                </li>
                <li>
                  A veces es mejor cobrar y pasar al siguiente nivel que
                  arriesgarse a perder todo.
                </li>
                <li>
                  Utiliza el modo Memo para marcar tus sospechas y estrategias.
                </li>
                <li>
                  Practica y desarrolla tu intuición para mejorar en el juego.
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
