import { ComboboxWithPreview } from "@/components/ui/interactive/ComboboxWithPreview";
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
    <ComboboxWithPreview
      value={value}
      onChange={onChange}
      data={getValidPokemon()}
      disabled={disabled}
      preview={sprite}
      previewAlt={alt}
      placeholder="Select a Pokémon"
    />
  );
}