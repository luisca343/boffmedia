import { FaTaxi } from 'react-icons/fa'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-md">
      <div className="bg-[#041F4E] p-8 rounded-xl shadow-2xl text-center border-2 border-yellow-400">
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
            <FaTaxi className="text-yellow-400 text-5xl absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            <div className="w-16 h-16 border-t-4 border-b-4 border-secondary rounded-full animate-spin absolute top-4 left-4"></div>
          </div>
        </div>
        <p className="text-xl font-medium text-white">Tu taxi está en camino...</p>
        <p className="text-secondary-hover mt-2">Por favor espera un momento</p>
      </div>
    </div>
  )
}