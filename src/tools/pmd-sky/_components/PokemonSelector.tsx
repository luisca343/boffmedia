import { ComboboxWithPreview } from "@/components/ui/interactive/ComboboxWithPreview";
import { getValidPokemon } from "../PokemonData";
import { useTranslations } from "next-intl";

interface PokemonSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  sprite: string;
  alt: string;
}

export function PokemonSelector({ value, onChange, disabled, sprite, alt }: PokemonSelectorProps) {
  const t = useTranslations("pmdsky");
  return (
    <ComboboxWithPreview
      value={value}
      onChange={onChange}
      data={getValidPokemon(t)}
      disabled={disabled}
      preview={sprite}
      previewAlt={alt}
      placeholder={t("SELECT_POKEMON")}
    />
  );
}