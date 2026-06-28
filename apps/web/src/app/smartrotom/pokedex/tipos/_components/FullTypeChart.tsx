"use client"
import { typeChart } from '../../dexUtils';
import { useTranslations } from "next-intl";
import { colors } from '@/components/shared/pokemon/TypeBadge';

export default function FullTypeChart() {
    const t = useTranslations("pokedex");
    const pokemonTypes = [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting",
        "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
        "dragon", "dark", "steel", "fairy"
    ];

    // Function to get effectiveness and corresponding styling
    const getEffectivenessCell = (attackType: string, defenseType: string) => {
        const effectiveness = typeChart[attackType]?.[defenseType] ?? 1;
        
        let bgColor = "bg-layer-3";  // Default color for neutral effectiveness
        let textColor = "text-ink";
        let effectivenessText = "";
        
        if (effectiveness === 2) {
            bgColor = "bg-warning";
            textColor = "text-warning-hover";
            effectivenessText = "2×";
        } else if (effectiveness === 0.5) {
            bgColor = "bg-red-700";
            textColor = "text-red-100";
            effectivenessText = "½×";
        } else if (effectiveness === 0) {
            bgColor = "bg-layer-1";
            textColor = "text-ink-muted";
            effectivenessText = "0";
        }
        
        return (
            <div 
                className={`${bgColor} ${textColor} flex items-center justify-center w-9 h-9 text-xs font-bold rounded-sm m-0.5`}
                title={`${t(`type_${attackType}`)} → ${t(`type_${defenseType}`)}: ${effectiveness}x`}
            >
                {effectivenessText}
            </div>
        );
    };

    // Function to get the type cell with the icon and the correct background color
    const getTypeCell = (type: string, isHeader: boolean = false) => {
        const typeColor = colors[type]?.backgroundColor || "#666666";
        
        return (
            <div 
                className={`w-9 h-9 flex items-center justify-center font-medium rounded-sm m-0.5 ${isHeader ? 'sticky top-0 z-10' : ''}`}
                style={{ backgroundColor: typeColor }}
            >
                <img 
                    src={`/smartrotom/img/types/${type.toLowerCase()}.png`} 
                    className="w-6 h-6" 
                    alt={t(`type_${type}`)}
                    title={t(`type_${type}`)}
                />
            </div>
        );
    };

    return (
        <div className="overflow-x-auto">
            <div className="text-lg font-medium text-ink mb-3">Tabla de Efectividad de Tipos</div>
            <div className="flex flex-col lg:flex-row items-start gap-6">
                <div className="overflow-x-auto">
                    <div className="inline-block align-middle rounded-lg border border-edge overflow-hidden bg-layer-2/50">
                        <table className="border-collapse">
                            <thead>
                                <tr>
                                    {/* Empty top-left corner */}
                                    <th className="bg-layer-2 text-ink font-bold p-0 sticky top-0 left-0 z-20">
                                        <div className="w-9 h-9 flex items-center justify-center text-xs m-0.5">↓→</div>
                                    </th>
                                    
                                    {/* Top row - Defending types */}
                                    {pokemonTypes.map((defenseType) => (
                                        <th key={`def-${defenseType}`} className="sticky top-0 z-10 p-0">
                                            {getTypeCell(defenseType, true)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Side column - Attacking types */}
                                {pokemonTypes.map((attackType) => (
                                    <tr key={`row-${attackType}`}>
                                        <td className="sticky left-0 z-10 p-0">
                                            {getTypeCell(attackType)}
                                        </td>
                                        
                                        {/* Effectiveness cells */}
                                        {pokemonTypes.map((defenseType) => (
                                            <td key={`${attackType}-${defenseType}`} className="p-0">
                                                {getEffectivenessCell(attackType, defenseType)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-layer-3/30 p-4 rounded-lg flex-shrink-0 lg:w-56">
                    <h3 className="text-base font-medium text-ink mb-3">Leyenda</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-warning text-warning-hover h-7 w-9 flex items-center justify-center rounded-sm text-xs font-bold">2×</div>
                            <span className="text-sm text-ink">Super efectivo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-layer-3 text-ink h-7 w-9 flex items-center justify-center rounded-sm"></div>
                            <span className="text-sm text-ink">Daño normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-red-700 text-red-100 h-7 w-9 flex items-center justify-center rounded-sm text-xs font-bold">½×</div>
                            <span className="text-sm text-ink">Poco efectivo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-layer-1 text-ink-muted h-7 w-9 flex items-center justify-center rounded-sm text-xs font-bold">0</div>
                            <span className="text-sm text-ink">Sin efecto</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-edge">
                        <p className="text-xs text-ink">Las filas representan los tipos atacantes, mientras que las columnas muestran los tipos defensivos.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}