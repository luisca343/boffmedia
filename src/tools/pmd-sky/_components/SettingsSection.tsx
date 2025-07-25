import { useTranslations } from "next-intl";
import { HiLightningBolt } from "react-icons/hi";
import { SectionHeader } from "@/components/form";
import { EuropeanVersionToggle } from "./EuropeanVersionToggle";

interface SettingsSectionProps {
  europeanVersion: boolean;
  onEuropeanVersionChange: (value: boolean) => void;
}

export function SettingsSection({
  europeanVersion,
  onEuropeanVersionChange
}: SettingsSectionProps) {
  const t = useTranslations("");

  return (
    <div className="mb-8">
      <SectionHeader 
        icon={<HiLightningBolt className="w-5 h-5" />} 
        title={t("ADDITIONAL_SETTINGS")} 
      />
      
      <EuropeanVersionToggle 
        checked={europeanVersion}
        onChange={onEuropeanVersionChange}
      />
    </div>
  );
}
