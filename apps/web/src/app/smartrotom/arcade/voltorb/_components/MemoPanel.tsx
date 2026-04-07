import Image from 'next/image'

interface MemoPanelProps {
  memoMode: boolean
  selectedMark: number
  onToggleMemoMode: () => void
  onSelectMark: (mark: number) => void
}

function MemoPanel({ memoMode, selectedMark, onToggleMemoMode, onSelectMark }: MemoPanelProps) {
  return (
    <div className="w-full">
      <button
        className={`w-full mb-3 py-2 px-4 rounded-md border-2 transition-all duration-200 ${
          memoMode 
            ? 'bg-yellow-500/80 hover:bg-yellow-400 border-yellow-400' 
            : 'bg-indigo-700/80 hover:bg-indigo-600 border-indigo-600'
        } text-white font-bold`}
        onClick={onToggleMemoMode}
      >
        {memoMode ? '🎮 Modo Jugar' : '✏️ Modo Notas'}
      </button>
      
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map(mark => (
          <button
            key={mark}
            className={`relative w-full h-12 py-2 px-4 rounded-md transition-all duration-200 ${
              selectedMark === mark && memoMode 
                ? 'bg-cyan-700 border-2 border-cyan-400' 
                : 'bg-indigo-900/60 border-2 border-indigo-700/50'
            } text-white font-bold ${!memoMode && 'opacity-50 cursor-not-allowed'} flex items-center justify-center`}
            onClick={() => onSelectMark(mark)}
            disabled={!memoMode}
          >
            {selectedMark === mark && memoMode && (
              <div className="absolute inset-0 bg-cyan-500/20 rounded-md animate-pulse"></div>
            )}
            
            {mark === 0 ? (
              <Image
                src="/smartrotom/img/apps/arcade/voltorb.png"
                alt="Voltorb"
                width={24}
                height={24}
              />
            ) : (
              <span>x{mark}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MemoPanel