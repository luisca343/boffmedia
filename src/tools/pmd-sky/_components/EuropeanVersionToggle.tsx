import { useTranslations } from "next-intl";
import { AnimatedToggle } from "@/components/inputs";

interface EuropeanVersionToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function EuropeanVersionToggle({ 
  checked, 
  onChange 
}: EuropeanVersionToggleProps) {
  const t = useTranslations("");

  return (
    <AnimatedToggle
      checked={checked}
      onChange={onChange}
      label={t("EUROPEAN_VERSION")}
      description={checked ? 'Formato EU activado' : 'Formato internacional'}
      icon={<span>🇪🇺</span>}
      variant="feature"
    />
  );
}
