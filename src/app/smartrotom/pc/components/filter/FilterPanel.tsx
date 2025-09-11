import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PiSliders, PiX, PiCaretDown, PiCaretUp, PiCheck, 
  PiStar, PiGenderMale, PiGenderFemale, PiGenderNeuter,
  PiMagnifyingGlass, PiSortAscending, PiSortDescending
} from 'react-icons/pi'
import { PokemonFilter, FilterSort, POKEMON_TYPES } from '../../types/filter.types'
import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon'
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['search', 'types', 'level']))

  // Update local state when props change (when dialog opens)
  useEffect(() => {
    setLocalFilters(filters)
    setLocalSearchTerm(searchTerm)
    setLocalSort(sort)
  }, [filters, searchTerm, sort, isOpen])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateFilters = (updates: Partial<PokemonFilter>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }))
  }

  const toggleType = (type: string) => {
    const currentTypes = localFilters.types || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    setLocalFilters(prev => ({ 
      ...prev, 
      types: newTypes.length > 0 ? newTypes : undefined 
    }))
  }

  const clearAllFilters = () => {
    setLocalFilters({})
    setLocalSearchTerm('')
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="space-y-6">
              
              {/* Search Section */}
              <FilterSection
                title="Búsqueda y Orden"
                isExpanded={expandedSections.has('search')}
                onToggle={() => toggleSection('search')}
                activeCount={localSearchTerm ? 1 : 0}
              >
                <div className="space-y-4">
                  <SearchBar
                    value={localSearchTerm}
                    onChange={setLocalSearchTerm}
                    placeholder="Buscar por nombre, apodo o número..."
                  />
                  <SortDropdown
                    sort={localSort}
                    onSortChange={setLocalSort}
                  />
                </div>
              </FilterSection>

              {/* Types Filter */}
              <FilterSection
                title="Tipos de Pokémon"
                isExpanded={expandedSections.has('types')}
                onToggle={() => toggleSection('types')}
                activeCount={localFilters.types?.length || 0}
              >
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
              </FilterSection>

              {/* Level Range */}
              <FilterSection
                title="Rango de Nivel"
                isExpanded={expandedSections.has('level')}
                onToggle={() => toggleSection('level')}
                activeCount={localFilters.minLevel || localFilters.maxLevel ? 1 : 0}
              >
                <div className="space-y-4">
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
              </FilterSection>

              {/* Special Status */}
              <FilterSection
                title="Estado Especial"
                isExpanded={expandedSections.has('special')}
                onToggle={() => toggleSection('special')}
                activeCount={[localFilters.isShiny, localFilters.isLegendary, localFilters.hasItem, localFilters.isFavorited].filter(Boolean).length}
              >
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
              </FilterSection>

              {/* Gender */}
              <FilterSection
                title="Género"
                isExpanded={expandedSections.has('gender')}
                onToggle={() => toggleSection('gender')}
                activeCount={localFilters.gender ? 1 : 0}
              >
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
              </FilterSection>

              {/* Nature Filter */}
              <FilterSection
                title="Naturaleza"
                isExpanded={expandedSections.has('nature')}
                onToggle={() => toggleSection('nature')}
                activeCount={localFilters.nature ? 1 : 0}
              >
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
              </FilterSection>

              {/* Ability Filter */}
              <FilterSection
                title="Habilidad"
                isExpanded={expandedSections.has('ability')}
                onToggle={() => toggleSection('ability')}
                activeCount={localFilters.ability ? 1 : 0}
              >
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
              </FilterSection>

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

// Helper components
function FilterSection({ 
  title, 
  isExpanded, 
  onToggle, 
  activeCount, 
  children 
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  activeCount: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-500/30 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <h4 className="text-white font-medium">{title}</h4>
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <PiCaretUp className="text-slate-400 text-lg" />
        ) : (
          <PiCaretDown className="text-slate-400 text-lg" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-500/30"
          >
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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
