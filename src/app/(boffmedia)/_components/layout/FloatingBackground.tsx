interface FloatingBackgroundProps {
  variant?: 'default' | 'warm' | 'cool'
  showParticles?: boolean
  showBlobs?: boolean
}

export function FloatingBackground({ 
  variant = 'default', 
  showParticles = true, 
  showBlobs = true 
}: FloatingBackgroundProps) {
  const getColorsByVariant = () => {
    switch (variant) {
      case 'warm':
        return {
          blob1: 'bg-primary-500',
          blob2: 'bg-orange-500',
          blob3: 'bg-amber-500',
          particle1: 'bg-primary-500',
          particle2: 'bg-orange-500',
          particle3: 'bg-amber-500',
          particle4: 'bg-yellow-500'
        }
      case 'cool':
        return {
          blob1: 'bg-blue-500',
          blob2: 'bg-cyan-500',
          blob3: 'bg-teal-500',
          particle1: 'bg-blue-500',
          particle2: 'bg-cyan-500',
          particle3: 'bg-teal-500',
          particle4: 'bg-green-500'
        }
      default:
        return {
          blob1: 'bg-primary-500',
          blob2: 'bg-orange-500',
          blob3: 'bg-amber-500',
          particle1: 'bg-primary-500',
          particle2: 'bg-orange-500',
          particle3: 'bg-amber-500',
          particle4: 'bg-yellow-500'
        }
    }
  }

  const colors = getColorsByVariant()

  return (
    <>
      {/* Background Blobs */}
      {showBlobs && (
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute top-20 left-10 w-32 h-32 ${colors.blob1} rounded-full blur-3xl`}></div>
          <div className={`absolute bottom-20 right-10 w-40 h-40 ${colors.blob2} rounded-full blur-3xl`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${colors.blob3} rounded-full blur-3xl opacity-30`}></div>
        </div>
      )}

      {/* Floating Particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute w-2 h-2 ${colors.particle1} rounded-full opacity-20 animate-pulse`} style={{top: '20%', left: '10%', animationDelay: '0s'}}></div>
          <div className={`absolute w-1 h-1 ${colors.particle2} rounded-full opacity-30 animate-pulse`} style={{top: '60%', left: '80%', animationDelay: '1s'}}></div>
          <div className={`absolute w-3 h-3 ${colors.particle3} rounded-full opacity-15 animate-pulse`} style={{top: '80%', left: '20%', animationDelay: '2s'}}></div>
          <div className={`absolute w-2 h-2 ${colors.particle4} rounded-full opacity-25 animate-pulse`} style={{top: '40%', left: '90%', animationDelay: '1.5s'}}></div>
        </div>
      )}
    </>
  )
}