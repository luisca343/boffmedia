"use client"
import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';
import { getPokemonDefense } from '../../dexUtils';

interface DualTypeAnalysisProps {
    type1: string;
    type2: string;
}

export default function DualTypeAnalysis({ type1, type2 }: DualTypeAnalysisProps) {
    // Use the existing function from dexUtils to get effectiveness
    const defenses = getPokemonDefense(type1, type2);
    
    // Sort types by their effectiveness multipliers
    const x4: string[] = [];  // Very weak (4x damage)
    const x2: string[] = [];  // Weak (2x damage)
    const x1: string[] = [];  // Normal (1x damage)
    const x05: string[] = []; // Resistant (0.5x damage)
    const x025: string[] = []; // Very resistant (0.25x damage)
    const x0: string[] = [];  // Immune (0x damage)
    
    // Categorize types based on the calculated effectiveness
    Object.entries(defenses).forEach(([type, effectiveness]) => {
        if (effectiveness === 4) {
            x4.push(type);
        } else if (effectiveness === 2) {
            x2.push(type);
        } else if (effectiveness === 1) {
            x1.push(type);
        } else if (effectiveness === 0.5) {
            x05.push(type);
        } else if (effectiveness === 0.25) {
            x025.push(type);
        } else if (effectiveness === 0) {
            x0.push(type);
        }
    });

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium text-ink mb-2 flex items-center">
                    <span className="bg-red-600 text-white px-2 py-1 rounded-lg mr-2 font-bold">4×</span>
                    Muy débil contra:
                </h3>
                <div className="bg-layer-3/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2">
                    {x4.length > 0 ? (
                        x4.map(t => (
                            <TypeBadgeSmall key={t} type={t} />
                        ))
                    ) : (
                        <p className="text-ink">Ningún tipo</p>
                    )}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-medium text-ink mb-2 flex items-center">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-lg mr-2 font-bold">2×</span>
                    Débil contra:
                </h3>
                <div className="bg-layer-3/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2">
                    {x2.length > 0 ? (
                        x2.map(t => (
                            <TypeBadgeSmall key={t} type={t} />
                        ))
                    ) : (
                        <p className="text-ink">Ningún tipo</p>
                    )}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-medium text-ink mb-2 flex items-center">
                    <span className="bg-warning text-white px-2 py-1 rounded-lg mr-2 font-bold">½×</span>
                    Resistente contra:
                </h3>
                <div className="bg-layer-3/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2">
                    {x05.length > 0 ? (
                        x05.map(t => (
                            <TypeBadgeSmall key={t} type={t} />
                        ))
                    ) : (
                        <p className="text-ink">Ningún tipo</p>
                    )}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-medium text-ink mb-2 flex items-center">
                    <span className="bg-secondary text-white px-2 py-1 rounded-lg mr-2 font-bold">¼×</span>
                    Muy resistente contra:
                </h3>
                <div className="bg-layer-3/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2">
                    {x025.length > 0 ? (
                        x025.map(t => (
                            <TypeBadgeSmall key={t} type={t} />
                        ))
                    ) : (
                        <p className="text-ink">Ningún tipo</p>
                    )}
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-medium text-ink mb-2 flex items-center">
                    <span className="bg-secondary-active text-white px-2 py-1 rounded-lg mr-2 font-bold">0×</span>
                    Inmune contra:
                </h3>
                <div className="bg-layer-3/50 rounded-lg p-3 min-h-12 flex flex-wrap gap-2">
                    {x0.length > 0 ? (
                        x0.map(t => (
                            <TypeBadgeSmall key={t} type={t} />
                        ))
                    ) : (
                        <p className="text-ink">Ningún tipo</p>
                    )}
                </div>
            </div>
        </div>
    );
}