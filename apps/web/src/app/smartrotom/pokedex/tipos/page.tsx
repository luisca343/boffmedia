"use client"
import { useState } from "react"
import TypeSelector from "./_components/TypeSelector"
import TypeEffectivenessTable from "./_components/TypeEffectivenessTable"
import DualTypeAnalysis from "./_components/DualTypeAnalysis"
import FullTypeChart from "./_components/FullTypeChart"
import { TypeChip } from "../_components/TypeChip"
import { SecondaryPageHeader } from "../_components/SecondaryPageHeader"
import { useTranslations } from "next-intl"

export default function TiposPage() {
  const t = useTranslations("pokedex")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSecondType, setSelectedSecondType] = useState<string | null>(null)
  const [showFullChart, setShowFullChart] = useState(true)

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting",
    "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
    "dragon", "dark", "steel", "fairy",
  ]

  return (
    <SecondaryPageHeader eyebrow="Referencia" title={t("types_title")} description={t("types_sub")}>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setShowFullChart(true)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            showFullChart
              ? "bg-primary-400/[0.14] text-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
              : "text-surface-300 hover:text-surface-100 hover:bg-white/[0.04]"
          }`}
        >
          Tabla Completa
        </button>
        <button
          onClick={() => setShowFullChart(false)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            !showFullChart
              ? "bg-primary-400/[0.14] text-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
              : "text-surface-300 hover:text-surface-100 hover:bg-white/[0.04]"
          }`}
        >
          Análisis de Tipos
        </button>
      </div>

      {showFullChart ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
          <FullTypeChart />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
            <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-4">Selecciona un tipo</h3>
            <TypeSelector types={pokemonTypes} selectedType={selectedType} onTypeSelect={(type) => {
              setSelectedType(type)
              if (selectedSecondType === type) setSelectedSecondType(null)
            }} />
          </div>

          {selectedType && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
              <div className="flex justify-center mb-4">
                <TypeChip type={selectedType} size="lg" />
              </div>
              <TypeEffectivenessTable type={selectedType} />
              <div className="mt-6 pt-4 border-t border-white/[0.05]">
                <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Análisis de Tipo Dual</h3>
                <p className="text-surface-400 text-xs mb-4">Selecciona un segundo tipo para ver la efectividad combinada</p>
                <TypeSelector types={pokemonTypes.filter((tp) => tp !== selectedType)} selectedType={selectedSecondType} onTypeSelect={setSelectedSecondType} />
              </div>
            </div>
          )}

          {selectedType && selectedSecondType && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
              <div className="flex justify-center items-center gap-3 mb-4">
                <TypeChip type={selectedType} size="md" />
                <span className="text-surface-100 font-bold text-lg">+</span>
                <TypeChip type={selectedSecondType} size="md" />
              </div>
              <DualTypeAnalysis type1={selectedType} type2={selectedSecondType} />
            </div>
          )}
        </div>
      )}
    </SecondaryPageHeader>
  )
}
