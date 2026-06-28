"use client"
import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';
import { typeChart } from '../../dexUtils';

interface TypeEffectivenessTableProps {
    type: string;
}

export default function TypeEffectivenessTable({ type }: TypeEffectivenessTableProps) {
    // Offensive: What types this type is effective against
    const superEffectiveAgainst: string[] = [];
    const notVeryEffectiveAgainst: string[] = [];
    const noEffectAgainst: string[] = [];

    // Defensive: What types are effective against this type
    const weakTo: string[] = [];
    const resistantTo: string[] = [];
    const immuneTo: string[] = [];

    // Calculate offensive effectiveness
    Object.keys(typeChart).forEach(targetType => {
        const effectiveness = typeChart[type]?.[targetType] || 1;
        
        if (effectiveness === 2) {
            superEffectiveAgainst.push(targetType);
        } else if (effectiveness === 0.5) {
            notVeryEffectiveAgainst.push(targetType);
        } else if (effectiveness === 0) {
            noEffectAgainst.push(targetType);
        }
    });

    // Calculate defensive effectiveness
    Object.keys(typeChart).forEach(attackType => {
        const effectiveness = typeChart[attackType]?.[type] || 1;
        
        if (effectiveness === 2) {
            weakTo.push(attackType);
        } else if (effectiveness === 0.5) {
            resistantTo.push(attackType);
        } else if (effectiveness === 0) {
            immuneTo.push(attackType);
        }
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Super Efectivo contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {superEffectiveAgainst.length > 0 ? (
                            superEffectiveAgainst.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Poco Efectivo contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {notVeryEffectiveAgainst.length > 0 ? (
                            notVeryEffectiveAgainst.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Sin Efecto contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {noEffectAgainst.length > 0 ? (
                            noEffectAgainst.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Débil contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {weakTo.length > 0 ? (
                            weakTo.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Resistente contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {resistantTo.length > 0 ? (
                            resistantTo.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-medium text-ink mb-2">Inmune contra:</h3>
                    <div className="bg-layer-3/50 rounded-lg p-3 min-h-16 flex flex-wrap gap-2">
                        {immuneTo.length > 0 ? (
                            immuneTo.map(t => (
                                <TypeBadgeSmall key={t} type={t} />
                            ))
                        ) : (
                            <p className="text-ink">Ningún tipo</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}