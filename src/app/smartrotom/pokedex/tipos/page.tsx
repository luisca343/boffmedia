"use client"
import { useState } from 'react';
import TypeSelector from './_components/TypeSelector';
import TypeEffectivenessTable from './_components/TypeEffectivenessTable';
import DualTypeAnalysis from './_components/DualTypeAnalysis';
import FullTypeChart from './_components/FullTypeChart';
import { TypeBadgeSmall } from '../entrada/[[...params]]/_components/TypeBadge';
import { TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

export default function TiposPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedSecondType, setSelectedSecondType] = useState<string | null>(null);
    const pokemonTypes = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting",
        "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
        "dragon", "dark", "steel", "fairy"
    ];

    const [showFullChart, setShowFullChart] = useState(false);

    return (
        <div className="bg-surface-800 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                <div className="bg-surface-700/30 rounded-lg p-4 border border-surface-600/50">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-surface-50">Tabla de Tipos</h1>
                        <button 
                            onClick={() => setShowFullChart(!showFullChart)}
                            className="flex items-center gap-1 bg-surface-600 hover:bg-surface-500 text-surface-100 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                        >
                            {showFullChart ? (
                                <>
                                    <ViewColumnsIcon className="h-4 w-4" />
                                    Ver Análisis de Tipos
                                </>
                            ) : (
                                <>
                                    <TableCellsIcon className="h-4 w-4" />
                                    Ver Tabla Completa
                                </>
                            )}
                        </button>
                    </div>

                    {showFullChart ? (
                        <div>
                            <FullTypeChart />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                                <h2 className="text-lg font-semibold text-surface-100 mb-3">Selecciona un tipo</h2>
                                <TypeSelector 
                                    types={pokemonTypes} 
                                    selectedType={selectedType} 
                                    onTypeSelect={(type) => {
                                        setSelectedType(type);
                                        if (selectedSecondType === type) {
                                            setSelectedSecondType(null);
                                        }
                                    }} 
                                />
                            </div>

                            {selectedType && (
                                <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                                    <div className="flex justify-center mb-4">
                                        <TypeBadgeSmall type={selectedType} />
                                    </div>
                                    
                                    <TypeEffectivenessTable type={selectedType} />
                                    
                                    <div className="mt-6 pt-4 border-t border-surface-700/30">
                                        <h2 className="text-lg font-semibold text-surface-100 mb-2">Análisis de Tipo Dual</h2>
                                        <p className="text-surface-300 mb-4">Selecciona un segundo tipo para ver la efectividad combinada</p>
                                        
                                        <TypeSelector 
                                            types={pokemonTypes.filter(t => t !== selectedType)} 
                                            selectedType={selectedSecondType} 
                                            onTypeSelect={setSelectedSecondType} 
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedType && selectedSecondType && (
                                <div className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30">
                                    <div className="flex justify-center items-center gap-4 mb-4">
                                        <TypeBadgeSmall type={selectedType} />
                                        <span className="text-surface-100 font-bold">+</span>
                                        <TypeBadgeSmall type={selectedSecondType} />
                                    </div>
                                    <DualTypeAnalysis type1={selectedType} type2={selectedSecondType} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}