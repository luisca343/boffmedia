"use client"
import { useState, useEffect } from 'react';
import TypeSelector from './_components/TypeSelector';
import TypeEffectivenessTable from './_components/TypeEffectivenessTable';
import DualTypeAnalysis from './_components/DualTypeAnalysis';
import FullTypeChart from './_components/FullTypeChart';
import { TypeBadgeSmall } from '../entrada/[[...params]]/_components/TypeBadge';
import { TableCellsIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

export default function TiposPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedSecondType, setSelectedSecondType] = useState<string | null>(null);
    const [showFullChart, setShowFullChart] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const pokemonTypes = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting",
        "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
        "dragon", "dark", "steel", "fairy"
    ];

    const handleViewChange = () => {
        setIsLoading(true);
        setTimeout(() => {
            setShowFullChart(!showFullChart);
            setIsLoading(false);
        }, 300);
    };

    return (
        <div className="bg-surface-800 min-h-full overflow-auto">
            <div className="mt-4 p-4 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-surface-50 relative">
                        Tabla de Tipos
                        <span className="absolute bottom-0 left-0 w-1/3 h-1 bg-primary-500 rounded-full"></span>
                    </h1>
                    <button 
                        onClick={handleViewChange}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                        ) : showFullChart ? (
                            <>
                                <ViewColumnsIcon className="h-5 w-5" />
                                Ver Análisis de Tipos
                            </>
                        ) : (
                            <>
                                <TableCellsIcon className="h-5 w-5" />
                                Ver Tabla Completa
                            </>
                        )}
                    </button>
                </div>

                {showFullChart ? (
                    <div className="relative">
                        <div className="bg-surface-800/70 rounded-lg shadow-lg p-5 border border-surface-700/40 backdrop-blur-sm">
                            <FullTypeChart />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-surface-800/70 rounded-lg p-5 border border-surface-700/40 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-surface-600/50">
                            <h2 className="text-lg font-semibold text-surface-50 mb-4 flex items-center">
                                <div className="w-2 h-8 bg-primary-500 rounded-full mr-3"></div>
                                Selecciona un tipo
                            </h2>
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
                            <div className="bg-surface-800/70 rounded-lg p-5 border border-surface-700/40 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-surface-600/50">
                                <div className="flex justify-center mb-6">
                                    <TypeBadgeSmall type={selectedType} className="transform transition-transform hover:scale-110" />
                                </div>
                                
                                <TypeEffectivenessTable type={selectedType} />
                                
                                <div className="mt-8 pt-5 border-t border-surface-700/30">
                                    <h2 className="text-lg font-semibold text-surface-50 mb-2 flex items-center">
                                        <div className="w-2 h-8 bg-primary-500 rounded-full mr-3"></div>
                                        Análisis de Tipo Dual
                                    </h2>
                                    <p className="text-surface-300 mb-5">Selecciona un segundo tipo para ver la efectividad combinada</p>
                                    
                                    <TypeSelector 
                                        types={pokemonTypes.filter(t => t !== selectedType)} 
                                        selectedType={selectedSecondType} 
                                        onTypeSelect={setSelectedSecondType} 
                                    />
                                </div>
                            </div>
                        )}

                        {selectedType && selectedSecondType && (
                            <div className="bg-surface-800/70 rounded-lg p-5 border border-surface-700/40 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-surface-600/50">
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <TypeBadgeSmall type={selectedType} className="transform transition-transform hover:scale-110" />
                                    <span className="text-surface-100 font-bold text-xl">+</span>
                                    <TypeBadgeSmall type={selectedSecondType} className="transform transition-transform hover:scale-110" />
                                </div>
                                <DualTypeAnalysis type1={selectedType} type2={selectedSecondType} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}