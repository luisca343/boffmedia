import { FaDesktop, FaSpinner } from 'react-icons/fa'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="relative bg-slate-900/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-500/30 text-center overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 via-transparent to-slate-800/20 pointer-events-none" />
        <div className="relative z-10">
          <div className="relative mb-6">
            {/* Animated loading rings (CSS only) */}
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 border-4 border-slate-500/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border-4 border-blue-400/50 rounded-full border-t-blue-400 animate-spin-reverse" />
              <div className="absolute inset-4 border-2 border-amber-400/40 rounded-full border-r-amber-400 animate-spin" style={{ animationDuration: '1.5s' }} />
              {/* Desktop icon in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-xl border border-slate-500/50 flex items-center justify-center backdrop-blur-sm animate-pulse-slow">
                  <FaDesktop className="text-slate-300 text-xl" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Cargando PC...</h3>
            <p className="text-slate-300 mb-4">Accediendo al sistema de almacenamiento</p>
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin">
                <FaSpinner className="text-blue-400" />
              </div>
              <span className="text-slate-400 text-sm font-medium">Por favor espera un momento</span>
            </div>
            {/* Animated dots */}
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}