import { useTranslations } from "next-intl";
import { AnimatedToggle } from "@/components/ui/interactive/AnimatedToggle";

interface EuropeanVersionToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function EuropeanVersionToggle({ 
  checked, 
  onChange 
}: EuropeanVersionToggleProps) {
  const t = useTranslations("pmdsky");

  return (
    <AnimatedToggle
      checked={checked}
      onChange={onChange}
      label={t("EUROPEAN_VERSION")}
      description={checked ? t("EUROPEAN_VERSION_ACTIVE") : t("EUROPEAN_VERSION_INACTIVE")}
      icon={<span>🇪🇺</span>}
      variant="feature"
    />
  );
}
