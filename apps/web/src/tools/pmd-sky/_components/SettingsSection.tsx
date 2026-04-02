import { useTranslations } from "next-intl";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { ToolSectionHeader } from "@components/boffmedia/tools/ToolSectionHeader";
import { EuropeanVersionToggle } from "./EuropeanVersionToggle";

interface SettingsSectionProps {
  europeanVersion: boolean;
  onEuropeanVersionChange: (value: boolean) => void;
}

export function SettingsSection({
  europeanVersion,
  onEuropeanVersionChange,
}: SettingsSectionProps) {
  const t = useTranslations("");

  return (
    <div className="mb-8">
      <ToolSectionHeader
        icon={<Cog6ToothIcon />}
        label={t("ADDITIONAL_SETTINGS")}
      />
      <EuropeanVersionToggle
        checked={europeanVersion}
        onChange={onEuropeanVersionChange}
      />
    </div>
  );
}
