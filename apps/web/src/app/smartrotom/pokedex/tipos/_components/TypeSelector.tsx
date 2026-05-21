"use client"
import { TypeChip } from "../../_components/TypeChip"

interface TypeSelectorProps {
  types: string[]
  selectedType: string | null
  onTypeSelect: (type: string) => void
}

export default function TypeSelector({ types, selectedType, onTypeSelect }: TypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onTypeSelect(type)}
          className={`transition-all cursor-pointer rounded-lg ${
            selectedType === type
              ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-surface-950 scale-105"
              : "hover:scale-105 opacity-70 hover:opacity-100"
          }`}
        >
          <TypeChip type={type} size="sm" />
        </button>
      ))}
    </div>
  )
}
