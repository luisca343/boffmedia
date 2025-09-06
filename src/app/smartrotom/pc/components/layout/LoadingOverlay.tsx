import { FaDesktop, FaSpinner } from 'react-icons/fa'

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-300 border-4 border-black p-8 text-center">
        <div className="mb-6">
          {/* Loading spinner */}
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 border-4 border-gray-600 border-t-black animate-spin" />
            
            {/* Desktop icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
                <FaDesktop className="text-black text-sm" />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-mono font-bold text-black mb-2">LOADING PC...</h3>
          <p className="text-gray-700 font-mono text-sm mb-4">ACCESSING STORAGE SYSTEM</p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin">
              <FaSpinner className="text-black" />
            </div>
            <span className="text-gray-700 font-mono text-xs">PLEASE WAIT...</span>
          </div>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-black animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-black animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-black animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}