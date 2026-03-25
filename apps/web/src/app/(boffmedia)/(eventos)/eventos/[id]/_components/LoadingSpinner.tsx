"use client"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'lg', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  }

  const innerSize = {
    sm: 'w-6 h-6 top-1 left-1',
    md: 'w-12 h-12 top-2 left-2',
    lg: 'w-16 h-16 top-2 left-2'
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800 ${className}`}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative">
            <div className={`${sizeClasses[size]} border-4 border-accent-500/20 rounded-full`}></div>
            <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-accent-500 rounded-full animate-spin`}></div>
            <div className={`absolute ${innerSize[size]} border-4 border-transparent border-t-pink-500 rounded-full animate-spin`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          
          <h2 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-pink-400">
            Cargando evento...
          </h2>
          <p className="mt-2 text-surface-400">Preparando una experiencia increíble</p>
        </div>
      </div>
    </div>
  )
}
