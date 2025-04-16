import { FaTaxi } from 'react-icons/fa'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <FaTaxi className="text-blue-500 text-5xl mx-auto mb-3 animate-bounce" />
        <p className="text-xl font-medium">Tu taxi está en camino...</p>
      </div>
    </div>
  )
}