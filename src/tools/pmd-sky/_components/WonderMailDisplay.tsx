import { HiMail } from "react-icons/hi";
import { useTranslations } from "next-intl";
import { CodeDisplay } from "@/components/ui/display/CodeDisplay";

interface WonderMailDisplayProps {
  mail: string;
  isEuropean: boolean;
  onCopy: () => void;
  copied: boolean;
}

export function WonderMailDisplay({ 
  mail, 
  isEuropean, 
  onCopy, 
  copied 
}: WonderMailDisplayProps) {
  const t = useTranslations("pmdsky");

  return (
    <CodeDisplay
      code={mail}
      title={isEuropean ? t("WONDER_MAIL_TITLE_EU") : t("WONDER_MAIL_TITLE_USJP")}
      icon={<HiMail className="w-6 h-6" />}
      badge={{
        text: isEuropean ? t("EUROPEAN_VERSION_ACTIVE") : t("EUROPEAN_VERSION_INACTIVE"),
        variant: "secondary",
        className: "bg-secondary-500/20 text-secondary-300 border-secondary-500/30"
      }}
      onCopy={onCopy}
      copied={copied}
      copyable={true}
    />
  );
}
