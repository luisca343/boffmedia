import { HiMail, HiSparkles } from "react-icons/hi";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/ui/interactive/ActionButton";

interface GenerateButtonProps {
  onClick: () => void;
}

export function GenerateButton({ onClick }: GenerateButtonProps) {
  const t = useTranslations("pmdsky");
  
  return (
    <ActionButton
      onClick={onClick}
      variant="generate"
      size="lg"
      fullWidth
      icon={<HiMail className="w-5 h-5" />}
      endIcon={<HiSparkles className="w-5 h-5" />}
    >
      {t("GENERATE_WONDER_MAIL")}
    </ActionButton>
  );
}
