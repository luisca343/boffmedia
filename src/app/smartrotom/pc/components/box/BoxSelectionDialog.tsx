import { FaArchive, FaBox, FaDatabase, FaTimes } from 'react-icons/fa'
import { PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives/dialog'

interface BoxSelectionDialogProps {
  isOpen: boolean;
  boxes: PCBoxData[];
  currentBox: number;
  onBoxSelect: (boxNumber: number) => void;
  onClose: () => void;
}

export default function BoxSelectionDialog({ 
  isOpen,
  boxes, 
  currentBox, 
  onBoxSelect, 
  onClose 
}: BoxSelectionDialogProps) {
  const getPokemonCount = (box: PCBoxData) => {
    return box.pokemon.filter(p => p !== null).length
  }

  const getBoxStatus = (count: number) => {
    if (count === 0) return { 
      color: 'from-slate-600 to-slate-700', 
      text: 'Vacía',
      bgColor: 'bg-slate-600/20',
      borderColor: 'border-slate-500/40'
    }
    if (count < 10) return { 
      color: 'from-green-600 to-green-700', 
      text: 'Poco llena',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-500/40'
    }
    if (count < 20) return { 
      color: 'from-amber-600 to-amber-700', 
      text: 'Medio llena',
      bgColor: 'bg-amber-600/20',
      borderColor: 'border-amber-500/40'
    }
    if (count < 30) return { 
      color: 'from-orange-600 to-orange-700', 
      text: 'Casi llena',
      bgColor: 'bg-orange-600/20',
      borderColor: 'border-orange-500/40'
    }
    return { 
      color: 'from-red-600 to-red-700', 
      text: 'Llena',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-500/40'
    }
  }

  const handleBoxSelect = (boxNumber: number) => {
    onBoxSelect(boxNumber)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] bg-slate-900/95 border-slate-500/30 flex flex-col p-0">
        {/* Fixed Header */}
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <FaDatabase className="text-blue-300 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Selector de Cajas</h2>
              <p className="text-slate-300 text-sm">Selecciona una caja para navegar</p>
            </div>
          </div>
        </div>

        {/* Scrollable Box Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {boxes.map((box) => {
              const count = getPokemonCount(box)
              const status = getBoxStatus(count)
              const isCurrentBox = box.boxNumber === currentBox
              
              return (
                <button
                  key={box.boxNumber}
                  onClick={() => handleBoxSelect(box.boxNumber)}
                  className={`relative group transition-all duration-200 hover:scale-105 focus:scale-105 ${
                    isCurrentBox 
                      ? 'ring-2 ring-blue-400 ring-opacity-60 bg-blue-500/20' 
                      : 'hover:bg-slate-700/30 focus:bg-slate-700/30'
                  } bg-slate-800/40 backdrop-blur-sm border ${status.borderColor} rounded-2xl p-4 text-left overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${status.color} opacity-10 rounded-2xl`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 ${status.bgColor} rounded-lg flex items-center justify-center border ${status.borderColor}`}>
                          <FaBox className="text-white text-xs" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">Caja {box.boxNumber + 1}</h4>
                        </div>
                      </div>
                      {isCurrentBox && (
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Pokemon count */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 text-xs font-medium">{count}/30 Pokémon</span>
                        <span className={`text-xs font-semibold ${
                          count === 0 ? 'text-slate-400' :
                          count < 10 ? 'text-green-400' :
                          count < 20 ? 'text-amber-400' :
                          count < 30 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {status.text}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-slate-700/50 rounded-full h-2 border border-slate-600/30">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            count === 0 ? 'bg-slate-500' :
                            count < 10 ? 'bg-green-500' :
                            count < 20 ? 'bg-amber-500' :
                            count < 30 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(count / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                        {isCurrentBox ? 'Caja actual' : 'Hacer clic para seleccionar'}
                      </span>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="relative bg-slate-800/50 backdrop-blur-sm p-4 border-t border-slate-500/30 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <div className="relative flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-slate-400">
              <span>Total: {boxes.length} cajas</span>
              <span>•</span>
              <span>Actual: Caja {currentBox + 1}</span>
            </div>
            <div className="text-slate-500 text-xs">
              Use las flechas del teclado para navegar
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}