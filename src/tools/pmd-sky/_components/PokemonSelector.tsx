import { Combobox } from "@/components/ui/combobox";
import { getValidPokemon } from "../PokemonData";

interface PokemonSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  sprite: string;
  alt: string;
}

export function PokemonSelector({ value, onChange, disabled, sprite, alt }: PokemonSelectorProps) {
  return (
    <div className="flex items-center">
      <Combobox 
        variant="orange"
        data={getValidPokemon()}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="flex-grow bg-surface-700 border-surface-600 text-surface-50"
      />
      <img
        width={40}
        height={40}
        src={sprite}
        alt={alt}
        className="ml-2"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}