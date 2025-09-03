import { FaDesktop, FaSpinner } from 'react-icons/fa'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8 rounded-2xl shadow-2xl border-2 border-purple-400/30 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
            <FaDesktop className="text-purple-400 text-5xl absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin absolute top-4 left-4"></div>
          </div>
        </div>
        <p className="text-xl font-medium text-white mb-2">Cargando PC...</p>
        <p className="text-purple-200">Accediendo al sistema de almacenamiento</p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <FaSpinner className="text-purple-400 animate-spin" />
          <span className="text-purple-300 text-sm">Por favor espera un momento</span>
        </div>
      </div>
    </div>
  )
}
