export function EventsLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-32">
          {/* Animated loading spinner with gaming style */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-accent-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-accent-500 rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-secondary-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          
          {/* Loading text with gradient */}
          <h2 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-secondary-400">
            Cargando eventos...
          </h2>
          <p className="mt-2 text-surface-400">Preparando experiencias épicas</p>
          
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-accent-400/30 rounded-full animate-ping"
                style={{
                  top: `${20 + (i * 15)}%`,
                  left: `${10 + (i * 15)}%`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: '3s'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}