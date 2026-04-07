import { useTranslations } from "next-intl";
import { PageHeader } from "@/features/boffmedia/tools/PageHeader";

export function Header() {
  const t = useTranslations("");

  return (
    <PageHeader
      title={{ prefix: t("WONDERMAIL_TITLE"), highlight: t("WONDERMAIL_SUBTITLE") }}
      subtitle={t("WONDER_MAIL_CREATOR_DESCRIPTION")}
      theme="secondary"
      sectionLabel="Pokémon"
    />
  );
}
