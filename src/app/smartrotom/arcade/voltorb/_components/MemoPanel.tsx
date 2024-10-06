interface MemoPanelProps {
    memoMode: boolean
    selectedMark: number
    onToggleMemoMode: () => void
    onSelectMark: (mark: number) => void
  }
  
  function MemoPanel({ memoMode, selectedMark, onToggleMemoMode, onSelectMark }: MemoPanelProps) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg w-48">
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
              className={`w-full py-2 px-4 rounded ${
                selectedMark === mark && memoMode ? 'bg-green-500' : 'bg-gray-600'
              } text-white font-bold ${!memoMode && 'opacity-50 cursor-not-allowed'}`}
              onClick={() => onSelectMark(mark)}
              disabled={!memoMode}
            >
              {mark === 0 ? '💣' : mark}
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  export default MemoPanel