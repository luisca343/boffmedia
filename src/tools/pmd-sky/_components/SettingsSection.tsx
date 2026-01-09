import { useTranslations } from "next-intl";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { SectionHeader } from "@/components/ui/form/FormSectionHeader";
import { EuropeanVersionToggle } from "./EuropeanVersionToggle";

interface SettingsSectionProps {
  europeanVersion: boolean;
  onEuropeanVersionChange: (value: boolean) => void;
}

export function SettingsSection({
  europeanVersion,
  onEuropeanVersionChange
}: SettingsSectionProps) {
  const t = useTranslations("pmdsky");

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<Cog6ToothIcon className="w-5 h-5" />} 
        title={t("ADDITIONAL_SETTINGS")} 
      />
      
      <EuropeanVersionToggle 
        checked={europeanVersion}
        onChange={onEuropeanVersionChange}
      />
    </div>
  );
}