import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PiSliders, PiX, PiCheck, 
  PiStar, PiGenderMale, PiGenderFemale, PiGenderNeuter,
  PiMagnifyingGlass, PiSortAscending, PiSortDescending
} from 'react-icons/pi'
import { PokemonFilter, FilterSort, POKEMON_TYPES } from '../../types/filter.types'
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon'
import { SearchBar } from './SearchBar'
import { SortDropdown } from './SortDropdown'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: PokemonFilter
  searchTerm: string
  sort: FilterSort
  onFiltersChange: (filters: PokemonFilter) => void
  onSortChange: (sort: FilterSort) => void
  onApply: (searchTerm: string, filters: PokemonFilter, sort: FilterSort) => void
  filterOptions: {
    types: string[]
    natures: string[]
    abilities: string[]
    levelRange: { min: number; max: number }
  }
}

export function FilterPanel({ 
  isOpen, 
  onClose, 
  filters,
  searchTerm,
  sort,
  onFiltersChange,
  onSortChange,
  onApply,
  filterOptions 
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<PokemonFilter>(filters)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [localSort, setLocalSort] = useState(sort)

  // Update local state when props change
  useEffect(() => {
    setLocalFilters(filters)
    setLocalSearchTerm(searchTerm)
    setLocalSort(sort)
  }, [filters, searchTerm, sort])

  const updateFilters = (updates: Partial<PokemonFilter>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    // Don't notify parent immediately - only when Apply is clicked
  }

  const toggleType = (type: string) => {
    const currentTypes = localFilters.types || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    const newFilters = { 
      ...localFilters, 
      types: newTypes.length > 0 ? newTypes : undefined 
    }
    setLocalFilters(newFilters)
    // Don't notify parent immediately - only when Apply is clicked
  }

  const clearAllFilters = () => {
    const emptyFilters = {}
    setLocalFilters(emptyFilters)
    setLocalSearchTerm('')
    // Don't notify parent immediately - only when Apply is clicked
  }

  const handleApply = () => {
    onApply(localSearchTerm, localFilters, localSort)
  }

  const handleCancel = () => {
    // Reset to original values
    setLocalFilters(filters)
    setLocalSearchTerm(searchTerm)
    setLocalSort(sort)
    onClose()
  }

  const hasActiveFilters = Object.keys(localFilters).length > 0 || localSearchTerm.length > 0

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                  <PiSliders className="text-purple-300 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Filtros de Búsqueda</h3>
                  <p className="text-slate-300 text-sm">Personaliza tu búsqueda de Pokémon</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Limpiar Todo
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <PiX className="text-slate-300 text-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh_-_100px)]">
            <div className="space-y-6">
              
              {/* Search and Sort Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <PiMagnifyingGlass className="text-blue-400 text-lg" />
                  <h4 className="text-white font-medium">Búsqueda y Orden</h4>
                  {localSearchTerm && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <SearchBar
                  value={localSearchTerm}
                  onChange={(value) => {
                    setLocalSearchTerm(value)
                    // Don't update filters immediately - only when Apply is clicked
                  }}
                  placeholder="Buscar por nombre, apodo o número..."
                />
                <SortDropdown
                  sort={localSort}
                  onSortChange={setLocalSort}
                />
              </div>

              {/* Types Filter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-blue-500 rounded"></div>
                  <h4 className="text-white font-medium">Tipos de Pokémon</h4>
                  {localFilters.types && localFilters.types.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {localFilters.types.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {POKEMON_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`relative flex flex-col items-center p-2 rounded-lg border transition-all duration-200 ${
                        localFilters.types?.includes(type)
                          ? 'border-blue-400 bg-blue-400/20 shadow-lg'
                          : 'border-slate-500/30 bg-slate-700/30 hover:border-slate-400/50 hover:bg-slate-600/30'
                      }`}
                    >
                      <PokemonTypeIcon type={type} size={24} />
                      <span className="text-xs text-white mt-1 capitalize">{type}</span>
                      {localFilters.types?.includes(type) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                          <PiCheck className="text-xs text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Range */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <PiSortAscending className="text-green-400 text-lg" />
                  <h4 className="text-white font-medium">Rango de Nivel</h4>
                  {(localFilters.minLevel || localFilters.maxLevel) && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Nivel Mínimo</label>
                    <input
                      type="number"
                      min={filterOptions.levelRange.min}
                      max={filterOptions.levelRange.max}
                      value={localFilters.minLevel || ''}
                      onChange={(e) => updateFilters({ 
                        minLevel: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="w-full bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                      placeholder={filterOptions.levelRange.min.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Nivel Máximo</label>
                    <input
                      type="number"
                      min={filterOptions.levelRange.min}
                      max={filterOptions.levelRange.max}
                      value={localFilters.maxLevel || ''}
                      onChange={(e) => updateFilters({ 
                        maxLevel: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="w-full bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                      placeholder={filterOptions.levelRange.max.toString()}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Rango disponible: {filterOptions.levelRange.min} - {filterOptions.levelRange.max}
                </p>
              </div>

              {/* Special Status */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <PiStar className="text-yellow-400 text-lg" />
                  <h4 className="text-white font-medium">Estado Especial</h4>
                  {[localFilters.isShiny, localFilters.isLegendary, localFilters.hasItem, localFilters.isFavorited].filter(Boolean).length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {[localFilters.isShiny, localFilters.isLegendary, localFilters.hasItem, localFilters.isFavorited].filter(Boolean).length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FilterToggle
                    label="Shiny"
                    icon={<PiStar className="text-yellow-400" />}
                    checked={localFilters.isShiny}
                    onChange={(checked) => updateFilters({ isShiny: checked ? true : undefined })}
                  />
                  <FilterToggle
                    label="Legendario"
                    icon={<PiStar className="text-purple-400" />}
                    checked={localFilters.isLegendary}
                    onChange={(checked) => updateFilters({ isLegendary: checked ? true : undefined })}
                  />
                  <FilterToggle
                    label="Con Objeto"
                    icon={<div className="w-4 h-4 bg-amber-400 rounded-sm" />}
                    checked={localFilters.hasItem}
                    onChange={(checked) => updateFilters({ hasItem: checked ? true : undefined })}
                  />
                  <FilterToggle
                    label="Favorito"
                    icon={<PiStar className="text-red-400" />}
                    checked={localFilters.isFavorited}
                    onChange={(checked) => updateFilters({ isFavorited: checked ? true : undefined })}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <PiGenderMale className="text-blue-400 text-lg" />
                  <h4 className="text-white font-medium">Género</h4>
                  {localFilters.gender && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FilterToggle
                    label="Macho"
                    icon={<PiGenderMale className="text-blue-400" />}
                    checked={localFilters.gender === 'male'}
                    onChange={(checked) => updateFilters({ gender: checked ? 'male' : undefined })}
                  />
                  <FilterToggle
                    label="Hembra"
                    icon={<PiGenderFemale className="text-pink-400" />}
                    checked={localFilters.gender === 'female'}
                    onChange={(checked) => updateFilters({ gender: checked ? 'female' : undefined })}
                  />
                  <FilterToggle
                    label="Sin Género"
                    icon={<PiGenderNeuter className="text-gray-400" />}
                    checked={localFilters.gender === 'genderless'}
                    onChange={(checked) => updateFilters({ gender: checked ? 'genderless' : undefined })}
                  />
                </div>
              </div>

              {/* Nature Filter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  <h4 className="text-white font-medium">Naturaleza</h4>
                  {localFilters.nature && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <select
                  value={localFilters.nature || ''}
                  onChange={(e) => updateFilters({ nature: e.target.value || undefined })}
                  className="w-full bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                >
                  <option value="">Todas las naturalezas</option>
                  {filterOptions.natures.map(nature => (
                    <option key={nature} value={nature}>{nature}</option>
                  ))}
                </select>
              </div>

              {/* Ability Filter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-4 h-4 bg-purple-400 rounded-sm"></div>
                  <h4 className="text-white font-medium">Habilidad</h4>
                  {localFilters.ability && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      1
                    </span>
                  )}
                </div>
                <select
                  value={localFilters.ability || ''}
                  onChange={(e) => updateFilters({ ability: e.target.value || undefined })}
                  className="w-full bg-slate-700/50 border border-slate-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400/50"
                >
                  <option value="">Todas las habilidades</option>
                  {filterOptions.abilities.map(ability => (
                    <option key={ability} value={ability}>{ability}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-500/30 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <PiCheck className="text-lg" />
                <span>Aplicar Filtros</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper component for toggle buttons
function FilterToggle({
  label,
  icon,
  checked,
  onChange
}: {
  label: string
  icon: React.ReactNode
  checked?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
        checked
          ? 'border-blue-400 bg-blue-400/20 shadow-lg'
          : 'border-slate-500/30 bg-slate-700/30 hover:border-slate-400/50 hover:bg-slate-600/30'
      }`}
    >
      {icon}
      <span className="text-sm text-white">{label}</span>
      {checked && (
        <PiCheck className="text-blue-400 ml-auto" />
      )}
    </button>
  )
}
