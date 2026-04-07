import { useState } from 'react'
import { PiMagnifyingGlass, PiX } from 'react-icons/pi'
import { motion } from 'framer-motion'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Buscar por nombre, apodo o Nº Pokédex...",
  onClear 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onChange('')
    if (onClear) onClear()
  }

  return (
    <div className="relative">
      <motion.div 
        className={`relative flex items-center bg-slate-800/50 backdrop-blur-sm rounded-xl border transition-all duration-200 ${
          isFocused 
            ? 'border-blue-400/50 shadow-lg shadow-blue-400/20' 
            : 'border-slate-500/30 hover:border-slate-400/50'
        }`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
      >
        {/* Search Icon */}
        <div className="absolute left-3 flex items-center justify-center">
          <PiMagnifyingGlass className={`text-lg transition-colors duration-200 ${
            isFocused ? 'text-blue-400' : 'text-slate-400'
          }`} />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-10 pr-10 py-3 text-white placeholder-slate-400 focus:outline-none text-sm"
        />

        {/* Clear Button */}
        {value && (
          <motion.button
            onClick={handleClear}
            className="absolute right-3 flex items-center justify-center w-5 h-5 bg-slate-600/50 hover:bg-slate-500/50 rounded-full transition-colors duration-200"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PiX className="text-xs text-slate-300" />
          </motion.button>
        )}
      </motion.div>

      {/* Search suggestions or help text */}
      {isFocused && !value && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-500/30 shadow-xl z-50"
        >
          <div className="p-3 text-xs text-slate-400">
            <div className="space-y-1">
              <p className="font-medium text-slate-300">Ejemplos de búsqueda:</p>
              <p>• <span className="text-blue-400">Pikachu</span> - Buscar por nombre</p>
              <p>• <span className="text-green-400">25</span> - Buscar por Nº Pokédex</p>
              <p>• <span className="text-yellow-400">Mi Charizard</span> - Buscar por apodo</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
