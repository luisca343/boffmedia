"use client"
import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';

interface TypeSelectorProps {
    types: string[];
    selectedType: string | null;
    onTypeSelect: (type: string) => void;
}

export default function TypeSelector({ types, selectedType, onTypeSelect }: TypeSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {types.map(type => (
                <button
                    key={type}
                    onClick={() => onTypeSelect(type)}
                    className={`transition-all transform ${selectedType === type ? 'scale-110 ring-2 ring-primary rounded-lg' : 'hover:scale-105'}`}
                >
                    <TypeBadgeSmall type={type} />
                </button>
            ))}
        </div>
    );
}