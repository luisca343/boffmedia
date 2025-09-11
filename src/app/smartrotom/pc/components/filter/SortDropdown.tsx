import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PiCaretDown, PiSortAscending, PiSortDescending } from 'react-icons/pi'
import { FilterSort } from '../../types/filter.types'

interface SortDropdownProps {
  sort: FilterSort
  onSortChange: (sort: FilterSort) => void
}

const SORT_OPTIONS = [
  { field: 'dex' as const, label: 'Nº Pokédex' },
  { field: 'name' as const, label: 'Nombre' },
  { field: 'level' as const, label: 'Nivel' },
  { field: 'dateAdded' as const, label: 'Fecha Agregado' }
]

export function SortDropdown({ sort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentOption = SORT_OPTIONS.find(option => option.field === sort.field)

  const handleOptionClick = (field: FilterSort['field']) => {
    const newDirection = field === sort.field && sort.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ field, direction: newDirection })
    setIsOpen(false)
  }

  const toggleDirection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSortChange({ 
      field: sort.field, 
      direction: sort.direction === 'asc' ? 'desc' : 'asc' 
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-500/30 hover:border-slate-400/50 rounded-lg px-3 py-2 text-white transition-colors duration-200"
      >
        <span className="text-sm font-medium">
          {currentOption?.label || 'Ordenar'}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleDirection}
            className="hover:bg-slate-600/50 rounded p-1 transition-colors duration-200"
          >
            {sort.direction === 'asc' ? (
              <PiSortAscending className="text-blue-400 text-sm" />
            ) : (
              <PiSortDescending className="text-blue-400 text-sm" />
            )}
          </button>
          <PiCaretDown 
            className={`text-slate-400 text-sm transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-500/30 rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.field}
                  onClick={() => handleOptionClick(option.field)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-200 ${
                    sort.field === option.field
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {sort.field === option.field && (
                    <div className="flex items-center space-x-1">
                      {sort.direction === 'asc' ? (
                        <PiSortAscending className="text-blue-400 text-sm" />
                      ) : (
                        <PiSortDescending className="text-blue-400 text-sm" />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
