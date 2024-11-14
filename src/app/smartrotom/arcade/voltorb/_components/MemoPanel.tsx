import Image from 'next/image'

interface MemoPanelProps {
  memoMode: boolean
  selectedMark: number
  onToggleMemoMode: () => void
  onSelectMark: (mark: number) => void
}

function MemoPanel({ memoMode, selectedMark, onToggleMemoMode, onSelectMark }: MemoPanelProps) {
  return (
    <div className="rounded-lg w-48 h-full">
      <button
        className={`w-full mb-4 py-2 px-4 rounded ${memoMode ? 'bg-yellow-500' : 'bg-blue-500'} text-white font-bold`}
        onClick={onToggleMemoMode}
      >
        {memoMode ? 'Jugar' : 'Añadir Marcas'}
      </button>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map(mark => (
          <button
            key={mark}
            className={`w-full h-12 py-2 px-4 rounded ${
              selectedMark === mark && memoMode ? 'bg-green-500' : 'bg-surface-5'
            } text-white font-bold ${!memoMode && 'opacity-50 cursor-not-allowed'} flex items-center justify-center`}
            onClick={() => onSelectMark(mark)}
            disabled={!memoMode}
          >
            {mark === 0 ? (
              <Image
                src="/smartrotom/img/apps/arcade/voltorb.png"
                alt="Voltorb"
                width={24}
                height={24}
              />
            ) : (
              <span>{mark}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MemoPanel